import os
import time
import json
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import anthropic

from submissions.models import StudentSubmission
from .models import GradingResult
from .tools import CPPAnalysisTools

class GradingService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)
        self.model = "claude-3-5-sonnet-20241022"  # Use latest stable model
    
    def grade_submission(self, submission: StudentSubmission) -> GradingResult:
        """
        Grade a student submission using Claude AI with development tools
        """
        start_time = time.time()
        tools = None
        
        try:
            student_name = submission.student.full_name if submission.student else submission.legacy_student_name
            print(f"\n🤖 AI AGENT GRADING STARTED for {student_name}")
            print(f"   📝 Assignment: {submission.assignment.name}")
            print("=" * 70)
            
            # Read student code
            student_code = self._read_file_content(submission.code_file.path)
            print(f"📄 Student Code Loaded: {len(student_code)} characters")
            
            # Read reference answer
            reference_code = self._read_file_content(submission.assignment.reference_file.path)
            print(f"📂 Reference Code Loaded: {len(reference_code)} characters")
            
            # Initialize AI agent tools
            print(f"\n🔧 Initializing AI Agent Tools...")
            tools = CPPAnalysisTools()
            print(f"✅ Tools Initialized Successfully")
            
            # TOOL 1: Extract custom grading rubric from reference code
            print(f"\n📋 TOOL 1: Extracting Custom Grading Rubric...")
            try:
                rubric_data = tools.extract_rubric_from_code(reference_code)
                print(f"   ✅ Rubric extraction completed")
            except Exception as e:
                print(f"   ❌ Rubric extraction failed: {str(e)}")
                rubric_data = {"has_custom_rubric": False, "criteria": []}
            
            # TOOL 2: Compile student code with error handling
            print(f"\n🔨 TOOL 2: Compiling Student Code...")
            try:
                compilation_result = tools.compile_code(student_code)
                print(f"   {'✅' if compilation_result['success'] else '❌'} Compilation {'successful' if compilation_result['success'] else 'failed'}")
            except Exception as e:
                print(f"   ❌ Compilation tool failed: {str(e)}")
                compilation_result = {
                    "success": False,
                    "errors": f"Compilation tool error: {str(e)}",
                    "compiler_output": str(e)
                }
            
            # TOOL 3: Analyze code style with error handling
            print(f"\n🎨 TOOL 3: Analyzing Code Style...")
            try:
                style_analysis = tools.analyze_style(student_code)
                print(f"   ✅ Style analysis completed - Score: {style_analysis.get('style_score', 'N/A')}/25")
            except Exception as e:
                print(f"   ❌ Style analysis failed: {str(e)}")
                style_analysis = {
                    "style_score": 15,  # Default neutral score
                    "issues": [f"Style analysis failed: {str(e)}"],
                    "suggestions": ["Could not perform style analysis"],
                    "score_breakdown": {"basic": 15}
                }
            
            # TOOL 4: Run comprehensive tests with error handling
            print(f"\n🧪 TOOL 4: Running Automated Tests...")
            try:
                test_results = tools.run_comprehensive_tests(
                    student_code, 
                    reference_code, 
                    submission.assignment.description
                )
                tests_passed = test_results.get('tests_passed', 0)
                total_tests = test_results.get('total_tests', 0)
                print(f"   ✅ Testing completed - {tests_passed}/{total_tests} tests passed")
            except Exception as e:
                print(f"   ❌ Testing failed: {str(e)}")
                test_results = {
                    "compilation": {"success": compilation_result["success"]},
                    "test_results": [],
                    "tests_passed": 0,
                    "total_tests": 0,
                    "overall_correctness": 50,  # Default neutral score
                    "detailed_feedback": [f"Testing failed: {str(e)}"]
                }
            
            print(f"\n🤖 TOOL 5: Creating Enhanced AI Prompt...")
            # Create enhanced grading prompt with tool results AND custom rubric
            prompt = self._create_enhanced_grading_prompt_with_rubric(
                student_code, 
                reference_code, 
                submission.assignment.name,
                compilation_result,
                style_analysis,
                test_results,
                rubric_data
            )
            print(f"   📝 Enhanced prompt length: {len(prompt)} characters")
            if rubric_data["has_custom_rubric"]:
                print(f"   📋 Using CUSTOM rubric with {len(rubric_data['criteria'])} criteria")
            else:
                print(f"   📋 Using DEFAULT rubric (no custom rubric found)")
            print(f"   🧠 Prompt includes tool analysis data from all 4 tools")
            
            print(f"\n🧠 SENDING TO CLAUDE AI...")
            print(f"   🤖 Model: {self.model}")
            print(f"   📨 Sending enhanced prompt with tool data...")
            
            # Call Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            print(f"   ✅ Claude AI Response received")
            print(f"   📄 Response length: {len(response.content[0].text)} characters")
            
            # Parse Claude's response (with custom rubric support) with error handling
            try:
                grading_data = self._parse_claude_response_with_rubric(response.content[0].text, rubric_data)
                print(f"   ✅ Response parsed successfully")
                print(f"   🔍 Parsed grading data keys: {list(grading_data.keys())}")
            except json.JSONDecodeError as e:
                print(f"   ❌ JSON parsing failed: {str(e)}")
                print(f"   🔧 Attempting response cleanup and retry...")
                
                # Try to clean and parse the response
                cleaned_response = self._clean_claude_response(response.content[0].text)
                try:
                    grading_data = self._parse_claude_response_with_rubric(cleaned_response, rubric_data)
                    print(f"   ✅ Response parsed after cleanup")
                    print(f"   🔍 Parsed grading data keys: {list(grading_data.keys())}")
                except Exception as cleanup_error:
                    print(f"   ❌ Cleanup failed: {str(cleanup_error)}")
                    # Create a fallback grading result
                    grading_data = self._create_fallback_grading(compilation_result, style_analysis, test_results)
                    print(f"   🔄 Using fallback grading result")
            except Exception as e:
                print(f"   ❌ Response parsing error: {str(e)}")
                grading_data = self._create_fallback_grading(compilation_result, style_analysis, test_results)
                print(f"   🔄 Using fallback grading result")
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Create GradingResult with tool analysis data
            print(f"   💾 Creating GradingResult in database...")
            try:
                grading_result = GradingResult.objects.create(
                    submission=submission,
                    total_score=grading_data['total_score'],
                    max_score=grading_data['max_score'],
                    percentage=Decimal(str(grading_data['percentage'])),
                    
                    correctness_score=grading_data['correctness']['score'],
                    correctness_max=grading_data['correctness']['max_score'],
                    correctness_feedback=grading_data['correctness']['feedback'][:5000],  # Limit length
                    
                    code_style_score=grading_data['code_style']['score'],
                    code_style_max=grading_data['code_style']['max_score'],
                    code_style_feedback=grading_data['code_style']['feedback'][:5000],
                    
                    efficiency_score=grading_data['efficiency']['score'],
                    efficiency_max=grading_data['efficiency']['max_score'],
                    efficiency_feedback=grading_data['efficiency']['feedback'][:5000],
                    
                    documentation_score=grading_data['documentation']['score'],
                    documentation_max=grading_data['documentation']['max_score'],
                    documentation_feedback=grading_data['documentation']['feedback'][:5000],
                    
                    overall_feedback=grading_data['overall_feedback'][:10000],  # Limit length
                    suggestions=grading_data['suggestions'][:5000],
                    ai_model_used=self.model,
                    processing_time=processing_time,
                    
                    # Store tool analysis results for transparency
                    compilation_result=compilation_result,
                    test_results=test_results,
                    style_analysis=style_analysis,
                    custom_rubric=rubric_data  # Store the extracted custom rubric
                )
                print(f"   ✅ GradingResult created successfully with ID: {grading_result.id}")
            except Exception as db_error:
                print(f"   ❌ Database error creating GradingResult: {str(db_error)}")
                print(f"   📊 Grading data structure: {grading_data}")
                raise db_error
            
            print(f"\n🎯 FINAL GRADING SUMMARY:")
            print(f"   👤 Student: {student_name}")
            print(f"   📝 Assignment: {submission.assignment.name}")
            print(f"   🏆 Final Score: {grading_data['total_score']}/{grading_data['max_score']} ({grading_data['percentage']}%)")
            print(f"   🔨 Compilation: {'✅ Success' if compilation_result['success'] else '❌ Failed'}")
            if test_results.get('test_results'):
                print(f"   🧪 Tests: {test_results['tests_passed']}/{test_results['total_tests']} passed")
            print(f"   🎨 Style Score: {style_analysis['style_score']}/25")
            print(f"   ⏱️ Processing Time: {processing_time:.2f}s")
            print("=" * 60)
            print(f"✅ GRADING COMPLETE - Results saved to database")
            print("=" * 60)
            
            return grading_result
            
        except Exception as e:
            raise Exception(f"Grading failed: {str(e)}")
        finally:
            # Always clean up temporary files
            if tools:
                tools.cleanup()
    
    def _read_file_content(self, file_path: str) -> str:
        """Read content from a file with multiple encoding support"""
        encodings_to_try = ['utf-8', 'latin-1', 'cp1252', 'ascii', 'utf-16']
        
        for encoding in encodings_to_try:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    content = file.read()
                    # Validate that it's readable C++ code
                    if content.strip():
                        print(f"   ✅ File read successfully with {encoding} encoding")
                        return content
                    else:
                        print(f"   ⚠️ File appears empty with {encoding} encoding")
                        continue
            except UnicodeDecodeError:
                print(f"   ❌ Failed to read with {encoding} encoding, trying next...")
                continue
            except FileNotFoundError:
                raise Exception(f"File not found: {file_path}")
            except Exception as e:
                print(f"   ❌ Error with {encoding}: {str(e)}")
                continue
        
        # If all encodings fail, try reading as binary and cleaning
        try:
            with open(file_path, 'rb') as file:
                raw_content = file.read()
                # Try to decode and clean non-printable characters
                content = raw_content.decode('utf-8', errors='replace')
                # Remove or replace problematic characters
                content = ''.join(char if ord(char) < 127 else ' ' for char in content)
                if content.strip():
                    print(f"   ⚠️ File read as binary and cleaned")
                    return content
        except Exception:
            pass
            
        raise Exception(f"Could not read file {file_path} with any supported encoding")
    
    def _create_enhanced_grading_prompt(self, student_code: str, reference_code: str, assignment_name: str, compilation_result: dict, style_analysis: dict, test_results: dict) -> str:
        """Create enhanced grading prompt with tool analysis results"""
        
        # Format compilation results
        compilation_status = "✅ Compiles successfully" if compilation_result["success"] else f"❌ Compilation failed: {compilation_result['errors']}"
        if compilation_result["success"] and compilation_result["warnings"]:
            compilation_status += f"\n⚠️ Compiler warnings: {compilation_result['warnings']}"
        
        # Format test results
        test_summary = ""
        if test_results.get("test_results"):
            passed = test_results["tests_passed"]
            total = test_results["total_tests"]
            test_summary = f"🧪 Test Results: {passed}/{total} tests passed\n"
            
            for test in test_results["test_results"][:3]:  # Show first 3 tests
                status = "✅" if test["passed"] else "❌"
                test_summary += f"  {status} {test['test_name']}: {test.get('description', 'Test case')}\n"
        
        # Format style analysis
        style_summary = f"🎨 Style Analysis: {style_analysis['style_score']}/25 points\n"
        if style_analysis["style_issues"]:
            style_summary += "Style Issues:\n"
            for issue in style_analysis["style_issues"][:3]:  # Show first 3 issues
                style_summary += f"  • {issue}\n"
        
        return f"""
You are an expert C++ programming instructor with access to automated analysis tools. Please grade this student's C++ code submission based on both your expert analysis AND the automated tool results below.

**Assignment:** {assignment_name}

**AUTOMATED TOOL ANALYSIS:**
{compilation_status}

{test_summary}

{style_summary}

**Reference Solution:**
```cpp
{reference_code}
```

**Student Submission:**
```cpp
{student_code}
```

**Grading Criteria (Total: 100 points):**
1. **Correctness (40 points)** - Use the automated test results and your analysis
2. **Code Style (25 points)** - Consider automated style analysis and your review  
3. **Efficiency (20 points)** - Analyze algorithm efficiency and approach
4. **Documentation (15 points)** - Comments, code clarity, readability

**IMPORTANT:** 
- Use the automated compilation and test results as primary evidence for correctness scoring
- If code doesn't compile, correctness score should be very low (0-10 points)
- If tests fail, explain why based on the test case outputs shown above
- Combine automated style analysis with your expert judgment
- The automated tools provide objective data - use this to support your grading decisions

Please provide your response in the following JSON format:

```json
{{
    "total_score": <number>,
    "max_score": 100,
    "percentage": <number with 2 decimals>,
    "correctness": {{
        "score": <number out of 40>,
        "max_score": 40,
        "feedback": "<detailed feedback incorporating automated test results>"
    }},
    "code_style": {{
        "score": <number out of 25>,
        "max_score": 25,
        "feedback": "<detailed feedback incorporating automated style analysis>"
    }},
    "efficiency": {{
        "score": <number out of 20>,
        "max_score": 20,
        "feedback": "<detailed feedback on algorithm efficiency>"
    }},
    "documentation": {{
        "score": <number out of 15>,
        "max_score": 15,
        "feedback": "<detailed feedback on documentation quality>"
    }},
    "overall_feedback": "<overall assessment mentioning the automated analysis results>",
    "suggestions": "<specific suggestions for improvement based on tool findings>"
}}
```

Be thorough but constructive in your feedback. Reference the automated tool results in your analysis.
"""
    
    def _create_enhanced_grading_prompt_with_rubric(self, student_code: str, reference_code: str, assignment_name: str, compilation_result: dict, style_analysis: dict, test_results: dict, rubric_data: dict) -> str:
        """Create enhanced grading prompt with tool analysis results AND custom rubric criteria"""
        
        # Format compilation results
        compilation_status = "✅ Compiles successfully" if compilation_result["success"] else f"❌ Compilation failed: {compilation_result['errors']}"
        if compilation_result["success"] and compilation_result["warnings"]:
            compilation_status += f"\n⚠️ Compiler warnings: {compilation_result['warnings']}"
        
        # Format test results
        test_summary = ""
        if test_results.get("test_results"):
            passed = test_results["tests_passed"]
            total = test_results["total_tests"]
            test_summary = f"🧪 Test Results: {passed}/{total} tests passed\n"
            
            for test in test_results["test_results"][:3]:  # Show first 3 tests
                status = "✅" if test["passed"] else "❌"
                test_summary += f"  {status} {test['test_name']}: {test.get('description', 'Test case')}\n"
        
        # Format style analysis
        style_summary = f"🎨 Style Analysis: {style_analysis['style_score']}/25 points\n"
        if style_analysis["style_issues"]:
            style_summary += "Style Issues:\n"
            for issue in style_analysis["style_issues"][:3]:  # Show first 3 issues
                style_summary += f"  • {issue}\n"
        
        # Format custom rubric or use default
        grading_criteria_section = ""
        json_format_section = ""
        
        if rubric_data["has_custom_rubric"]:
            # Use custom rubric from reference code
            total_points = rubric_data["total_possible_points"]
            grading_criteria_section = f"**CUSTOM GRADING RUBRIC (Total: {total_points} points):**\n"
            
            json_criteria = []
            for criteria in rubric_data["criteria"]:
                grading_criteria_section += f"• **{criteria['name']} ({criteria['max_points']} points)** - {criteria['description']}\n"
                if criteria.get("subcriteria"):
                    for subcriterion in criteria["subcriteria"]:
                        grading_criteria_section += f"  - {subcriterion}\n"
                
                json_criteria.append(f'''    "{criteria['name'].lower().replace(' ', '_')}": {{
        "score": <number out of {criteria['max_points']}>,
        "max_score": {criteria['max_points']},
        "feedback": "<detailed feedback for {criteria['name'].lower()}>"
    }}''')
            
            # Create custom JSON format
            json_criteria_str = ',\n'.join(json_criteria)
            json_format_section = f'''```json
{{
    "total_score": <number>,
    "max_score": {total_points},
    "percentage": <number with 2 decimals>,
{json_criteria_str},
    "overall_feedback": "<overall assessment mentioning the automated analysis results and custom rubric>",
    "suggestions": "<specific suggestions for improvement based on tool findings and rubric criteria>"
}}
```'''
            
            # Find compilation penalty
            compilation_penalties = [c['max_points'] for c in rubric_data['criteria'] if 'compil' in c['name'].lower()]
            compilation_penalty = max(compilation_penalties) if compilation_penalties else "maximum"
            
            grading_criteria_section += f"""
**IMPORTANT RUBRIC-BASED GRADING:**
- Use the CUSTOM rubric criteria above as your PRIMARY grading framework
- Each criterion has specific point values that must be respected
- Deduct points based on the rubric categories and automated tool findings
- If code doesn't compile, deduct the full compilation penalty ({compilation_penalty} points)
- Reference the automated tool results to justify your scoring decisions"""
            
        else:
            # Use default 4-criteria system
            grading_criteria_section = """**Grading Criteria (Total: 100 points):**
1. **Correctness (40 points)** - Use the automated test results and your analysis
2. **Code Style (25 points)** - Consider automated style analysis and your review  
3. **Efficiency (20 points)** - Analyze algorithm efficiency and approach
4. **Documentation (15 points)** - Comments, code clarity, readability"""
            
            json_format_section = '''
```json
{
    "total_score": <number>,
    "max_score": 100,
    "percentage": <number with 2 decimals>,
    "correctness": {
        "score": <number out of 40>,
        "max_score": 40,
        "feedback": "<detailed feedback incorporating automated test results>"
    },
    "code_style": {
        "score": <number out of 25>,
        "max_score": 25,
        "feedback": "<detailed feedback incorporating automated style analysis>"
    },
    "efficiency": {
        "score": <number out of 20>,
        "max_score": 20,
        "feedback": "<detailed feedback on algorithm efficiency>"
    },
    "documentation": {
        "score": <number out of 15>,
        "max_score": 15,
        "feedback": "<detailed feedback on documentation quality>"
    },
    "overall_feedback": "<overall assessment mentioning the automated analysis results>",
    "suggestions": "<specific suggestions for improvement based on tool findings>"
}
```'''

        return f"""
You are an expert C++ programming instructor with access to automated analysis tools. Please grade this student's C++ code submission based on both your expert analysis AND the automated tool results below.

**Assignment:** {assignment_name}

**AUTOMATED TOOL ANALYSIS:**
{compilation_status}

{test_summary}

{style_summary}

**Reference Solution:**
```cpp
{reference_code}
```

**Student Submission:**
```cpp
{student_code}
```

{grading_criteria_section}

**CRITICAL INSTRUCTIONS:** 
- Use the automated compilation and test results as primary evidence for correctness scoring
- If code doesn't compile, apply severe point deductions as specified in the rubric
- If tests fail, explain why based on the test case outputs shown above
- Combine automated style analysis with your expert judgment
- The automated tools provide objective data - use this to support your grading decisions
- Follow the specific point allocations in the grading criteria exactly

Please provide your response in the following JSON format:
{json_format_section}

Be thorough but constructive in your feedback. Reference the automated tool results and apply the grading criteria consistently.
"""
    
    def _create_grading_prompt(self, student_code: str, reference_code: str, assignment_name: str) -> str:
        """Create the grading prompt for Claude"""
        return f"""
You are an expert C++ programming instructor. Please grade this student's C++ code submission.

**Assignment:** {assignment_name}

**Reference Solution:**
```cpp
{reference_code}
```

**Student Submission:**
```cpp
{student_code}
```

**Grading Criteria (Total: 100 points):**
1. **Correctness (40 points)** - Does the code work correctly? Does it solve the problem?
2. **Code Style (25 points)** - Proper naming, formatting, structure
3. **Efficiency (20 points)** - Algorithm efficiency, memory usage
4. **Documentation (15 points)** - Comments, code clarity

Please provide your response in the following JSON format:

```json
{{
    "total_score": <number>,
    "max_score": 100,
    "percentage": <number with 2 decimals>,
    "correctness": {{
        "score": <number out of 40>,
        "max_score": 40,
        "feedback": "<detailed feedback on correctness>"
    }},
    "code_style": {{
        "score": <number out of 25>,
        "max_score": 25,
        "feedback": "<detailed feedback on code style>"
    }},
    "efficiency": {{
        "score": <number out of 20>,
        "max_score": 20,
        "feedback": "<detailed feedback on efficiency>"
    }},
    "documentation": {{
        "score": <number out of 15>,
        "max_score": 15,
        "feedback": "<detailed feedback on documentation>"
    }},
    "overall_feedback": "<overall assessment and key strengths/weaknesses>",
    "suggestions": "<specific suggestions for improvement>"
}}
```

Be thorough but constructive in your feedback. Focus on helping the student learn.
"""
    
    def _parse_claude_response(self, response_text: str) -> dict:
        """Parse Claude's response and extract grading data"""
        try:
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON found in response")
            
            json_str = response_text[start_idx:end_idx]
            grading_data = json.loads(json_str)
            
            # Validate required fields
            required_fields = ['total_score', 'max_score', 'percentage', 'correctness', 
                             'code_style', 'efficiency', 'documentation', 'overall_feedback']
            
            for field in required_fields:
                if field not in grading_data:
                    raise ValueError(f"Missing required field: {field}")
            
            return grading_data
            
        except json.JSONDecodeError as e:
            raise Exception(f"Could not parse Claude response as JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Error parsing Claude response: {str(e)}")
    
    def _parse_claude_response_with_rubric(self, response_text: str, rubric_data: dict) -> dict:
        """Parse Claude's response and extract grading data, supporting both custom rubrics and default format"""
        try:
            # Find JSON in the response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON found in response")
            
            json_str = response_text[start_idx:end_idx]
            raw_grading_data = json.loads(json_str)
            
            # Convert to the standard format our database expects
            if rubric_data["has_custom_rubric"]:
                # Handle custom rubric response
                total_score = raw_grading_data.get("total_score", 0)
                max_score = raw_grading_data.get("max_score", 100)
                percentage = raw_grading_data.get("percentage", 0.0)
                
                grading_data = {
                    "total_score": total_score,
                    "max_score": max_score,
                    "percentage": percentage
                }
                
                # Calculate proportional scores for standard 4-category system
                # Standard distribution: 40% correctness, 25% style, 20% efficiency, 15% docs
                score_ratio = total_score / max_score if max_score > 0 else 0
                
                correctness_score = round(score_ratio * 40)
                style_score = round(score_ratio * 25)
                efficiency_score = round(score_ratio * 20)
                docs_score = round(score_ratio * 15)
                
                # Collect custom criteria feedback for display
                custom_feedback_parts = []
                custom_criteria_details = []
                
                for key, value in raw_grading_data.items():
                    if isinstance(value, dict) and "score" in value and "feedback" in value:
                        criterion_name = key.replace('_', ' ').title()
                        score = value["score"]
                        max_score_item = value["max_score"]
                        feedback = value["feedback"]
                        
                        custom_feedback_parts.append(f"**{criterion_name}** ({score}/{max_score_item}): {feedback}")
                        custom_criteria_details.append({
                            "name": criterion_name,
                            "score": score,
                            "max_score": max_score_item,
                            "feedback": feedback
                        })
                
                # Map custom criteria to standard categories intelligently
                correctness_feedback = ""
                style_feedback = ""
                efficiency_feedback = ""
                docs_feedback = ""
                
                for detail in custom_criteria_details:
                    name_lower = detail["name"].lower()
                    if any(term in name_lower for term in ['compil', 'correct', 'algorithm', 'implement', 'major']):
                        correctness_feedback += f"{detail['name']}: {detail['feedback']}\n"
                    elif any(term in name_lower for term in ['style', 'format', 'variable', 'minor']):
                        style_feedback += f"{detail['name']}: {detail['feedback']}\n"
                    elif any(term in name_lower for term in ['efficien', 'performance', 'moderate']):
                        efficiency_feedback += f"{detail['name']}: {detail['feedback']}\n"
                    elif any(term in name_lower for term in ['doc', 'comment', 'clarity']):
                        docs_feedback += f"{detail['name']}: {detail['feedback']}\n"
                    else:
                        # Default to correctness for unmatched criteria
                        correctness_feedback += f"{detail['name']}: {detail['feedback']}\n"
                
                # Set up standard 4-category structure
                grading_data.update({
                    "correctness": {
                        "score": correctness_score, 
                        "max_score": 40, 
                        "feedback": correctness_feedback.strip() or f"Proportional score based on custom rubric (Total: {total_score}/{max_score})"
                    },
                    "code_style": {
                        "score": style_score, 
                        "max_score": 25, 
                        "feedback": style_feedback.strip() or f"Proportional score based on custom rubric (Total: {total_score}/{max_score})"
                    },
                    "efficiency": {
                        "score": efficiency_score, 
                        "max_score": 20, 
                        "feedback": efficiency_feedback.strip() or f"Proportional score based on custom rubric (Total: {total_score}/{max_score})"
                    },
                    "documentation": {
                        "score": docs_score, 
                        "max_score": 15, 
                        "feedback": docs_feedback.strip() or f"Proportional score based on custom rubric (Total: {total_score}/{max_score})"
                    }
                })
                
                overall_feedback = raw_grading_data.get("overall_feedback", "")
                grading_data["overall_feedback"] = f"Custom Rubric Applied:\n{chr(10).join(custom_feedback_parts)}\n\n{overall_feedback}"
                grading_data["suggestions"] = raw_grading_data.get("suggestions", "Continue practicing to improve your programming skills.")
                
            else:
                # Use standard format parsing
                return self._parse_claude_response(response_text)
            
            return grading_data
            
        except json.JSONDecodeError as e:
            # Fallback to standard parsing
            return self._parse_claude_response(response_text)
        except Exception as e:
            raise Exception(f"Error parsing Claude response with rubric: {str(e)}")
    
    def _clean_claude_response(self, response_text: str) -> str:
        """Clean Claude response to fix common JSON parsing issues"""
        import re
        
        try:
            # Remove control characters that cause JSON parsing issues
            cleaned = re.sub(r'[\x00-\x1F\x7F]', '', response_text)
            
            # Try to extract JSON from markdown code blocks
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', cleaned, re.DOTALL)
            if json_match:
                return json_match.group(1)
            
            # Try to extract JSON from regular code blocks
            code_match = re.search(r'```\s*(\{.*?\})\s*```', cleaned, re.DOTALL)
            if code_match:
                return code_match.group(1)
            
            # Try to find JSON object in the response
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                return json_match.group(0)
                
            return cleaned
            
        except Exception:
            return response_text
    
    def _create_fallback_grading(self, compilation_result: dict, style_analysis: dict, test_results: dict) -> dict:
        """Create a fallback grading result when AI parsing fails"""
        
        # Calculate scores based on available tool results
        compilation_score = 20 if compilation_result.get("success", False) else 5
        style_score = style_analysis.get("style_score", 15)
        test_score = test_results.get("overall_correctness", 50)
        docs_score = 10  # Default middle score
        
        total_score = compilation_score + style_score + (test_score * 0.4) + docs_score
        max_score = 100
        percentage = (total_score / max_score) * 100
        
        return {
            "total_score": int(total_score),
            "max_score": max_score,
            "percentage": round(percentage, 1),
            "correctness": {
                "score": int(test_score * 0.4),
                "max_score": 40,
                "feedback": f"Compilation: {'Success' if compilation_result.get('success') else 'Failed'}. " +
                          f"Tests: {test_results.get('tests_passed', 0)}/{test_results.get('total_tests', 0)} passed. " +
                          "AI analysis failed, using tool-based assessment."
            },
            "code_style": {
                "score": style_score,
                "max_score": 25, 
                "feedback": f"Style score: {style_score}/25. " + 
                          f"Issues found: {len(style_analysis.get('issues', []))}. " +
                          "AI analysis failed, using automated style checker."
            },
            "efficiency": {
                "score": 15,  # Default neutral score
                "max_score": 20,
                "feedback": "AI analysis failed. Code efficiency could not be fully assessed. Consider optimizing algorithms and data structures."
            },
            "documentation": {
                "score": docs_score,
                "max_score": 15,
                "feedback": "AI analysis failed. Documentation assessment based on basic code structure."
            },
            "overall_feedback": "AI grading analysis encountered an error and fell back to tool-based assessment. " +
                              f"Your code {'compiles successfully' if compilation_result.get('success') else 'has compilation errors'}. " +
                              f"Consider reviewing the compiler messages and fixing any issues.",
            "suggestions": "Review compilation errors if any, improve code style based on automated checks, and ensure proper documentation."
        }

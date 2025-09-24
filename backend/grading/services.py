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
            
            # Use tools to analyze the code
            print(f"\n🔨 TOOL 1: Compiling Student Code...")
            compilation_result = tools.compile_code(student_code)
            
            print(f"\n🎨 TOOL 2: Analyzing Code Style...")
            style_analysis = tools.analyze_style(student_code)
            
            print(f"\n🧪 TOOL 3: Running Automated Tests...")
            test_results = tools.run_comprehensive_tests(
                student_code, 
                reference_code, 
                submission.assignment.description
            )
            
            print(f"\n🤖 TOOL 4: Creating Enhanced AI Prompt...")
            # Create enhanced grading prompt with tool results
            prompt = self._create_enhanced_grading_prompt(
                student_code, 
                reference_code, 
                submission.assignment.name,
                compilation_result,
                style_analysis,
                test_results
            )
            print(f"   📝 Enhanced prompt length: {len(prompt)} characters")
            print(f"   🧠 Prompt includes tool analysis data from all 3 tools")
            
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
            
            # Parse Claude's response
            grading_data = self._parse_claude_response(response.content[0].text)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Create GradingResult with tool analysis data
            grading_result = GradingResult.objects.create(
                submission=submission,
                total_score=grading_data['total_score'],
                max_score=grading_data['max_score'],
                percentage=Decimal(str(grading_data['percentage'])),
                
                correctness_score=grading_data['correctness']['score'],
                correctness_max=grading_data['correctness']['max_score'],
                correctness_feedback=grading_data['correctness']['feedback'],
                
                code_style_score=grading_data['code_style']['score'],
                code_style_max=grading_data['code_style']['max_score'],
                code_style_feedback=grading_data['code_style']['feedback'],
                
                efficiency_score=grading_data['efficiency']['score'],
                efficiency_max=grading_data['efficiency']['max_score'],
                efficiency_feedback=grading_data['efficiency']['feedback'],
                
                documentation_score=grading_data['documentation']['score'],
                documentation_max=grading_data['documentation']['max_score'],
                documentation_feedback=grading_data['documentation']['feedback'],
                
                overall_feedback=grading_data['overall_feedback'],
                suggestions=grading_data['suggestions'],
                ai_model_used=self.model,
                processing_time=processing_time,
                
                # Store tool analysis results for transparency
                compilation_result=compilation_result,
                test_results=test_results,
                style_analysis=style_analysis
            )
            
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
        """Read content from a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            raise Exception(f"Could not read file {file_path}: {str(e)}")
    
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

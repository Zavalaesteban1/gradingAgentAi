"""
AI Agent Tools for C++ Code Analysis
These tools give the AI agent the ability to compile, test, and analyze C++ code
"""
import os
import subprocess
import tempfile
import json
from typing import Dict, List, Any
from django.conf import settings
import anthropic
import re

class CPPAnalysisTools:
    """Tools that the AI agent can use to analyze C++ code"""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp(prefix='cpp_grading_')
        self.claude_client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)
    
    def compile_code(self, code: str, filename: str = "student_code.cpp") -> Dict[str, Any]:
        """
        Tool: Compile C++ code and return compilation results
        """
        try:
            # Write code to temporary file
            cpp_file = os.path.join(self.temp_dir, filename)
            executable = os.path.join(self.temp_dir, "program")
            
            with open(cpp_file, 'w', encoding='utf-8') as f:
                f.write(code)
            
            # Compile with g++
            compile_cmd = [
                'g++', 
                '-std=c++17',  # Use modern C++ standard
                '-Wall',       # Enable warnings
                '-Wextra',     # Extra warnings
                '-o', executable,
                cpp_file
            ]
            
            result = subprocess.run(
                compile_cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "executable_path": executable if result.returncode == 0 else None,
                "warnings": result.stderr if result.returncode == 0 and result.stderr else "",
                "errors": result.stderr if result.returncode != 0 else "",
                "compiler_output": result.stderr
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "errors": "Compilation timed out (>30 seconds)",
                "compiler_output": "Timeout"
            }
        except Exception as e:
            return {
                "success": False,
                "errors": f"Compilation error: {str(e)}",
                "compiler_output": str(e)
            }
    
    def run_with_input(self, executable_path: str, test_input: str, timeout: int = 10) -> Dict[str, Any]:
        """
        Tool: Run compiled program with given input
        """
        try:
            if not os.path.exists(executable_path):
                return {
                    "success": False,
                    "error": "Executable not found"
                }
            
            result = subprocess.run(
                [executable_path],
                input=test_input,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "errors": result.stderr,
                "return_code": result.returncode,
                "execution_time": "< 10s"  # Could add actual timing
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Program execution timed out (>{timeout} seconds)",
                "output": "",
                "execution_time": f"> {timeout}s"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Runtime error: {str(e)}",
                "output": ""
            }
    
    def analyze_style(self, code: str) -> Dict[str, Any]:
        """
        Tool: Analyze C++ code style and best practices
        """
        style_issues = []
        suggestions = []
        
        lines = code.split('\n')
        
        # Check for basic style issues
        for i, line in enumerate(lines, 1):
            # Check indentation consistency
            if line.strip() and not line.startswith(' ') and not line.startswith('\t') and line.startswith(' '):
                if '    ' not in line[:8]:  # Should use 4-space indentation
                    style_issues.append(f"Line {i}: Inconsistent indentation")
            
            # Check for using namespace std
            if 'using namespace std' in line:
                suggestions.append("Consider avoiding 'using namespace std' in larger programs")
            
            # Check for magic numbers
            import re
            numbers = re.findall(r'\b\d+\b', line)
            for num in numbers:
                if int(num) > 1 and int(num) not in [0, 1]:  # Ignore 0 and 1
                    if 'for' in line or 'while' in line:
                        continue  # Skip loop counters
                    suggestions.append(f"Line {i}: Consider using named constants instead of magic number {num}")
        
        # Check for includes
        has_iostream = '#include <iostream>' in code
        has_vector = '#include <vector>' in code and 'vector' in code
        has_algorithm = '#include <algorithm>' in code and ('sort' in code or 'find' in code)
        
        if 'cout' in code and not has_iostream:
            style_issues.append("Missing #include <iostream> for cout usage")
        if 'vector' in code and not has_vector:
            style_issues.append("Missing #include <vector> for vector usage")
        if ('sort(' in code or 'find(' in code) and not has_algorithm:
            style_issues.append("Missing #include <algorithm> for algorithm functions")
        
        return {
            "style_score": max(0, 25 - len(style_issues) * 3),  # Out of 25 points
            "style_issues": style_issues,
            "suggestions": suggestions,
            "has_proper_includes": has_iostream and (not 'vector' in code or has_vector),
            "uses_modern_cpp": 'auto' in code or 'for (' in code  # Range-based for loops
        }
    
    def create_test_cases(self, reference_code: str, assignment_description: str) -> List[Dict[str, str]]:
        """
        Tool: Generate test cases using AI based on reference code and assignment description
        """
        print(f"   🤖 Generating AI-powered test cases...")
        print(f"   📋 Assignment: {assignment_description[:60]}...")
        
        try:
            # Use Claude AI to generate contextual test cases
            ai_test_cases = self._generate_ai_test_cases(reference_code, assignment_description)
            print(f"   ✅ Generated {len(ai_test_cases)} AI test cases")
            return ai_test_cases
        except Exception as e:
            print(f"   ⚠️ AI test generation failed: {str(e)}")
            print(f"   🔄 Falling back to basic test cases")
            # Fallback to basic tests if AI generation fails
            return self._get_fallback_test_cases()
    
    def _generate_ai_test_cases(self, reference_code: str, assignment_description: str) -> List[Dict[str, str]]:
        """
        Use Claude AI to generate contextual test cases for the assignment
        """
        prompt = f"""You are a C++ programming instructor creating comprehensive test cases for student code assessment.

ASSIGNMENT DESCRIPTION:
{assignment_description}

REFERENCE CODE:
{reference_code}

Please analyze the reference code and generate 5 diverse test cases that thoroughly test the functionality. Each test case should:
1. Test different aspects of the program (basic functionality, edge cases, boundary conditions, etc.)
2. Be appropriate for the assignment requirements
3. Include realistic input data that matches the program's expected input format
4. Have clear, descriptive names

Respond ONLY with a JSON array in this exact format:
[
  {{
    "name": "Basic Functionality Test",
    "input": "example input here",
    "description": "Brief description of what this tests"
  }},
  {{
    "name": "Edge Case Test", 
    "input": "edge case input",
    "description": "Tests boundary conditions"
  }}
]

Important:
- Analyze the input format from the reference code (does it read numbers until -999? Single line? Multiple lines?)
- Create inputs that match the actual program's expected format
- Include both typical cases and edge cases
- Make test names descriptive and specific to this assignment
- Ensure inputs will actually work with the reference code"""

        print(f"   📨 Sending test generation request to Claude...")
        
        response = self.claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[
                {
                    "role": "user", 
                    "content": prompt
                }
            ]
        )
        
        response_text = response.content[0].text.strip()
        print(f"   📄 Received AI response: {len(response_text)} characters")
        
        # Extract JSON from response
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if not json_match:
            raise Exception("No valid JSON found in AI response")
        
        json_text = json_match.group(0)
        test_cases = json.loads(json_text)
        
        print(f"   ✅ Successfully parsed {len(test_cases)} test cases")
        
        # Validate test case format
        for i, test_case in enumerate(test_cases):
            if not all(key in test_case for key in ['name', 'input', 'description']):
                raise Exception(f"Invalid test case format at index {i}")
        
        return test_cases
    
    def _get_fallback_test_cases(self) -> List[Dict[str, str]]:
        """
        Fallback test cases if AI generation fails
        """
        return [
            {
                "name": "Basic Input Test",
                "input": "5 3 8 1 9 -999",
                "description": "Test with basic integer input"
            },
            {
                "name": "Empty Input Test", 
                "input": "-999",
                "description": "Test with immediate termination"
            },
            {
                "name": "Single Number Test",
                "input": "42 -999", 
                "description": "Test with single number"
            }
        ]
    
    def run_comprehensive_tests(self, student_code: str, reference_code: str, assignment_description: str) -> Dict[str, Any]:
        """
        Tool: Run comprehensive testing of student code against reference
        """
        results = {
            "compilation": None,
            "reference_compilation": None,
            "test_results": [],
            "overall_correctness": 0,
            "detailed_feedback": []
        }
        
        # Compile student code
        student_compile = self.compile_code(student_code, "student.cpp")
        results["compilation"] = student_compile
        
        # Compile reference code
        reference_compile = self.compile_code(reference_code, "reference.cpp")
        results["reference_compilation"] = reference_compile
        
        if not student_compile["success"]:
            results["detailed_feedback"].append(f"❌ Code does not compile: {student_compile['errors']}")
            return results
        
        if not reference_compile["success"]:
            results["detailed_feedback"].append("⚠️ Reference code compilation failed - cannot run comparison tests")
            return results
        
        # Generate and run test cases
        test_cases = self.create_test_cases(reference_code, assignment_description)
        passed_tests = 0
        
        for i, test_case in enumerate(test_cases):
            # Run student code
            student_result = self.run_with_input(
                student_compile["executable_path"], 
                test_case["input"]
            )
            
            # Run reference code
            reference_result = self.run_with_input(
                reference_compile["executable_path"],
                test_case["input"]
            )
            
            # Compare outputs
            test_passed = (
                student_result["success"] and 
                reference_result["success"] and
                student_result["output"].strip() == reference_result["output"].strip()
            )
            
            if test_passed:
                passed_tests += 1
            
            test_result = {
                "test_name": test_case["name"],
                "input": test_case["input"],
                "expected_output": reference_result.get("output", "").strip(),
                "actual_output": student_result.get("output", "").strip(),
                "passed": test_passed,
                "student_errors": student_result.get("errors", ""),
                "execution_successful": student_result["success"]
            }
            
            results["test_results"].append(test_result)
            
            if not test_passed:
                if not student_result["success"]:
                    results["detailed_feedback"].append(
                        f"❌ {test_case['name']}: Runtime error - {student_result.get('error', 'Unknown error')}"
                    )
                else:
                    results["detailed_feedback"].append(
                        f"❌ {test_case['name']}: Output mismatch\n"
                        f"   Expected: '{reference_result['output'].strip()}'\n"
                        f"   Got: '{student_result['output'].strip()}'"
                    )
        
        # Calculate overall correctness score
        results["overall_correctness"] = (passed_tests / len(test_cases)) * 40  # Out of 40 points
        results["tests_passed"] = passed_tests
        results["total_tests"] = len(test_cases)
        
        if passed_tests == len(test_cases):
            results["detailed_feedback"].append("✅ All test cases passed! Code produces correct output.")
        else:
            results["detailed_feedback"].append(f"⚠️ {passed_tests}/{len(test_cases)} test cases passed.")
        
        return results
    
    def cleanup(self):
        """Clean up temporary files"""
        try:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        except Exception:
            pass
    
    def __del__(self):
        """Ensure cleanup on object destruction"""
        self.cleanup()

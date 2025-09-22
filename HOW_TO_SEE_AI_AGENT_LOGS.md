# 🔍 How to See Your AI Agent Backend Logs

## 📋 **Step-by-Step to See the Logs:**

### **1. 🖥️ Open Your Backend Terminal**
Your Django server is now running on port 8001. You need to watch the terminal where it's running.

**If you can't see the server terminal:**
```bash
cd /Users/estebanzavala/Desktop/aiProjects/gradingAi/backend
source virt/bin/activate
python manage.py runserver 8001
```

### **2. 🚀 Submit a Test Assignment**
Go to your frontend (http://localhost:3000) and:
1. Go to "Grade Student Submissions" page
2. Upload ANY C++ file (create a simple test file)
3. Click "Submit Assignment for Grading"

### **3. 👀 Watch the Backend Console**
As soon as you submit, you'll see detailed output like this:

```bash
🤖 AI AGENT GRADING STARTED for John Smith
   📝 Assignment: Assignment 1
======================================================================

📄 Student Code Loaded: 245 characters
📂 Reference Code Loaded: 456 characters

🔧 Initializing AI Agent Tools...
✅ Tools Initialized Successfully

🔨 TOOL 1: Compiling Student Code...
   📝 Writing code to temporary file...
   📁 Temp file: /tmp/tmpxyz123/student_code.cpp
   ⚡ Running compilation: -std=c++17 -Wall -Wextra -o
   ✅ COMPILATION SUCCESSFUL

🎨 TOOL 2: Analyzing Code Style...
   📊 Analyzing code style...
   📄 Analyzing 15 lines of code
   📈 Style Analysis Complete:
      Score: 22/25
      Issues: 2 found
      • Line 8: Consider adding spaces around '=' operator
      • Missing #include <iostream> for cout/cin usage

🧪 TOOL 3: Running Automated Tests...
   📋 Assignment: Simple C++ program with basic I/O...
   ✅ Code compiles - proceeding with functional tests...
   📊 Test Results Summary:
      ✅ PASS: Basic Functionality
      ✅ PASS: Input Validation
      ❌ FAIL: Edge Cases
      ✅ PASS: Performance
      ❌ FAIL: Output Format
   🏆 Testing Complete: 3/5 tests passed (60.0%)
   📈 Correctness Score: 24.0/40 points

🤖 TOOL 4: Creating Enhanced AI Prompt...
   📝 Enhanced prompt length: 1847 characters
   🧠 Prompt includes tool analysis data from all 3 tools

🧠 SENDING TO CLAUDE AI...
   🤖 Model: claude-3-5-sonnet-latest
   📨 Sending enhanced prompt with tool data...
   ✅ Claude AI Response received
   📄 Response length: 892 characters

🎯 FINAL GRADING SUMMARY:
   👤 Student: John Smith
   📝 Assignment: Assignment 1
   🏆 Final Score: 78/100 (78%)
   🔨 Compilation: ✅ Success
   🧪 Tests: 3/5 passed
   🎨 Style Score: 22/25
   ⏱️ Processing Time: 4.23s
======================================================================
✅ GRADING COMPLETE - Results saved to database
======================================================================
```

## 🧪 **Quick Test File**
Create this simple C++ file to test:

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}
```

## 🎯 **What You'll See:**
- **Real-time tool execution** as it happens
- **Compilation results** with success/failure
- **Style analysis** with specific issues found
- **Test execution** with pass/fail for each test
- **Claude AI interaction** with prompt/response sizes
- **Final grading summary** with all scores

**The logs show you EXACTLY what your AI agent is doing behind the scenes!** 🤖✨

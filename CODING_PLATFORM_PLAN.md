# 💻 Coding Practice Platform - Implementation Plan

## 🎯 Goal
Add an integrated coding practice platform with online compiler supporting:
- **Frontend**: HTML + CSS + JavaScript (live preview)
- **JavaScript**: Node.js runtime
- **Python**: Python 3.x
- **Java**: JDK compiler

---

## 🏗️ Architecture

### Frontend Components
```
src/pages/CodePractice.tsx         - Main coding page
src/components/CodeEditor.tsx      - Monaco editor wrapper
src/components/CodeOutput.tsx      - Output/console display
src/components/LanguageSelector.tsx - Language switcher
src/components/CodeTemplates.tsx   - Starter templates
src/components/TestCases.tsx       - Run test cases
```

### Backend APIs
```
POST /api/code/execute             - Execute code
POST /api/code/save                - Save code snippet
GET  /api/code/challenges          - Get coding challenges
GET  /api/code/templates           - Get code templates
POST /api/code/submit              - Submit solution
```

### Technology Stack
- **Editor**: Monaco Editor (VSCode's editor)
- **Execution**: Docker containers (sandboxed)
- **Alternative**: Judge0 API (easier, cloud-based)
- **Frontend Preview**: iframe sandboxing

---

## 🚀 Implementation Options

### Option 1: Judge0 CE (Recommended for MVP)
✅ **Pros**:
- Free & open-source
- Supports 60+ languages
- Production-ready
- Easy to deploy
- Secure sandboxing

❌ **Cons**:
- External dependency
- Need API key for cloud version

### Option 2: Custom Docker Execution
✅ **Pros**:
- Full control
- No external dependencies
- Custom security

❌ **Cons**:
- Complex setup
- Security concerns
- Resource management

**Decision**: Start with Judge0 CE (can self-host)

---

## 📋 Phase 1: Basic Code Editor (Day 1)

### Features
- Monaco editor integration
- Syntax highlighting
- Language selection
- Run button
- Output console
- Error handling

### Implementation Steps
1. Install Monaco Editor
2. Create CodeEditor component
3. Add language modes
4. Basic UI layout
5. Connect to backend

---

## 📋 Phase 2: Code Execution (Day 2)

### Languages Support
- JavaScript (Node.js)
- Python 3
- Java
- HTML/CSS/JS (live preview)

### Security Measures
- Request timeouts (5s max)
- Memory limits (128MB)
- CPU limits
- No file system access
- No network access
- Code length limits

---

## 📋 Phase 3: Coding Challenges (Day 3)

### Features
- Challenge library
- Test cases
- Difficulty levels
- Submit solutions
- Leaderboard
- Solutions history

---

## 🎨 UI Design

```
┌─────────────────────────────────────────────────────────┐
│  Coding Practice Platform                    [Run] [Save]│
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│  Language: [JS ▼]    │  Challenge: Two Sum Problem      │
│                      │  Difficulty: Easy                │
│  Theme: [Dark ▼]     │  Time Limit: 1s                  │
│                      │  Memory: 128MB                   │
├──────────────────────┼──────────────────────────────────┤
│                      │                                  │
│  CODE EDITOR         │  PROBLEM DESCRIPTION             │
│  (Monaco Editor)     │  Given an array of integers...   │
│                      │                                  │
│  function twoSum(){  │  Input: [2,7,11,15], target=9   │
│    // Your code      │  Output: [0,1]                   │
│  }                   │                                  │
│                      │  Test Cases:                     │
│                      │  ✓ Test 1: Passed                │
│                      │  ✗ Test 2: Failed                │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│  OUTPUT / CONSOLE                                       │
│  > Running...                                           │
│  > [0, 1]                                               │
│  > Execution time: 23ms                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Specs

### Code Execution Flow
```
User writes code
     ↓
Click "Run"
     ↓
POST /api/code/execute {
  language: "javascript",
  code: "console.log('Hello')",
  stdin: ""
}
     ↓
Backend sends to Judge0/Docker
     ↓
Execute in sandbox (timeout: 5s)
     ↓
Capture stdout/stderr
     ↓
Return results {
  stdout: "Hello\n",
  stderr: "",
  time: "0.023s",
  memory: "12.5MB",
  status: "success"
}
     ↓
Display in output console
```

---

## 💾 Database Schema

```sql
-- Coding challenges table
CREATE TABLE coding_challenges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  difficulty ENUM('easy', 'medium', 'hard'),
  category VARCHAR(100), -- 'arrays', 'strings', 'dp', etc.
  tags JSON, -- ['array', 'hash-table']
  starter_code JSON, -- { js: '...', python: '...', java: '...' }
  test_cases JSON, -- [{ input: '...', output: '...' }]
  constraints TEXT,
  time_limit INT DEFAULT 5, -- seconds
  memory_limit INT DEFAULT 128, -- MB
  difficulty_score INT, -- 1-10
  acceptance_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User code submissions
CREATE TABLE code_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  challenge_id INT,
  language VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  status ENUM('pending', 'running', 'accepted', 'wrong_answer', 'time_limit', 'runtime_error', 'compile_error'),
  execution_time DECIMAL(10,3), -- seconds
  memory_used DECIMAL(10,2), -- MB
  test_cases_passed INT,
  test_cases_total INT,
  output TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (challenge_id) REFERENCES coding_challenges(id)
);

-- User code snippets (saved code)
CREATE TABLE code_snippets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255),
  language VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Coding statistics
CREATE TABLE coding_stats (
  user_id INT PRIMARY KEY,
  total_submissions INT DEFAULT 0,
  accepted_submissions INT DEFAULT 0,
  easy_solved INT DEFAULT 0,
  medium_solved INT DEFAULT 0,
  hard_solved INT DEFAULT 0,
  favorite_language VARCHAR(50),
  total_execution_time DECIMAL(10,2) DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_submission_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🎯 Sample Coding Challenges

### 1. Two Sum (Easy)
```javascript
// Given an array of integers nums and an integer target,
// return indices of the two numbers that add up to target.

function twoSum(nums, target) {
  // Your code here
}

// Test cases
console.assert(JSON.stringify(twoSum([2,7,11,15], 9)) === JSON.stringify([0,1]));
console.assert(JSON.stringify(twoSum([3,2,4], 6)) === JSON.stringify([1,2]));
```

### 2. Reverse String (Easy)
### 3. Palindrome Check (Easy)
### 4. FizzBuzz (Easy)
### 5. Valid Parentheses (Medium)
### 6. Merge Two Sorted Lists (Medium)
### 7. Binary Search (Medium)
### 8. Fibonacci Sequence (Easy)
### 9. Find Duplicates (Easy)
### 10. Maximum Subarray (Medium)

---

## 🔐 Security Considerations

1. **Code Execution**
   - Run in isolated containers
   - No file system access
   - No network access
   - Memory limits
   - CPU limits
   - Timeout after 5 seconds

2. **Input Validation**
   - Max code length: 10,000 chars
   - Validate language
   - Sanitize output
   - Rate limiting

3. **Resource Protection**
   - Max 10 executions per minute per user
   - Queue system for heavy load
   - Auto-cleanup containers

---

## 📊 Integration with Interview System

### Live Coding Interview
```
Interview Mode + Code Editor
     ↓
Interviewer asks coding question
     ↓
Candidate writes code live
     ↓
AI evaluates code quality
     ↓
Provides feedback + next question
```

### Features
- Live code sharing
- Real-time execution
- Code quality analysis
- Time tracking
- Auto-save solutions

---

## 🎨 Language Templates

### JavaScript
```javascript
// JavaScript starter template
function solution() {
  // Write your code here
  console.log("Hello, World!");
}

solution();
```

### Python
```python
# Python starter template
def solution():
    # Write your code here
    print("Hello, World!")

if __name__ == "__main__":
    solution()
```

### Java
```java
// Java starter template
public class Solution {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello, World!");
    }
}
```

### Frontend (HTML/CSS/JS)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend Practice</title>
    <style>
        /* Your CSS here */
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
    </style>
</head>
<body>
    <h1>Hello, World!</h1>
    
    <script>
        // Your JavaScript here
        console.log('Hello from JS!');
    </script>
</body>
</html>
```

---

## 🚀 Quick Start Implementation

**This Week Goals**:
1. ✅ Setup Monaco Editor
2. ✅ Basic code execution (JS, Python)
3. ✅ Output console
4. ✅ Save/Load code

**Next Week**:
1. Add coding challenges
2. Test case runner
3. Leaderboard
4. Integration with interviews

---

**Ready to implement? I'll start building now! 🚀**


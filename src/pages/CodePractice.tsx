import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CodeEditor } from '@/components/CodeEditor';
import { Leaderboard } from '@/components/Leaderboard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/config/api';
import { 
  Play, 
  Save, 
  Code2, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MemoryStick,
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Language configurations
const LANGUAGES = {
  javascript: {
    name: 'JavaScript',
    mode: 'javascript',
    template: `// JavaScript Solution
function solution() {
  // Write your code here
  console.log("Hello, World!");
}

solution();`,
  },
  python: {
    name: 'Python',
    mode: 'python',
    template: `# Python Solution
def solution():
    # Write your code here
    print("Hello, World!")

if __name__ == "__main__":
    solution()`,
  },
  java: {
    name: 'Java',
    mode: 'java',
    template: `// Java Solution
public class Solution {
    public static void main(String[] args) {
        // Write your code here
        System.out.println("Hello, World!");
    }
}`,
  },
  html: {
    name: 'HTML/CSS/JS',
    mode: 'html',
    template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frontend Practice</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        button:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Frontend Practice</h1>
        <p>Build amazing web interfaces!</p>
        <button onclick="handleClick()">Click Me!</button>
        <p id="output"></p>
    </div>
    
    <script>
        function handleClick() {
            document.getElementById('output').textContent = 
                '✨ Great job! Keep building!';
        }
    </script>
</body>
</html>`,
  },
};

// Sample coding challenges
const CHALLENGES = [
  {
    id: 1,
    title: 'Hello World',
    difficulty: 'easy',
    category: 'basics',
    description: `Write a function that prints "Hello, World!" to the console.
    
This is your first coding challenge! Simply output the classic greeting.`,
    starterCode: {
      javascript: `function helloWorld() {
  // Write your code here
}

helloWorld();`,
      python: `def hello_world():
    # Write your code here
    pass

hello_world()`,
      java: `public class Solution {
    public static void helloWorld() {
        // Write your code here
    }
    
    public static void main(String[] args) {
        helloWorld();
    }
}`,
    },
    expectedOutput: 'Hello, World!',
  },
  {
    id: 2,
    title: 'Two Sum',
    difficulty: 'easy',
    category: 'arrays',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Write your code here
}

// Test cases
console.log(twoSum([2,7,11,15], 9)); // Expected: [0,1]
console.log(twoSum([3,2,4], 6)); // Expected: [1,2]`,
      python: `def two_sum(nums, target):
    # Write your code here
    pass

# Test cases
print(two_sum([2,7,11,15], 9))  # Expected: [0,1]
print(two_sum([3,2,4], 6))  # Expected: [1,2]`,
      java: `import java.util.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
    
    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2,7,11,15}, 9)));
        System.out.println(Arrays.toString(twoSum(new int[]{3,2,4}, 6)));
    }
}`,
    },
  },
  {
    id: 3,
    title: 'Reverse String',
    difficulty: 'easy',
    category: 'strings',
    description: `Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]`,
    starterCode: {
      javascript: `function reverseString(s) {
  // Write your code here
}

// Test cases
let test1 = ["h","e","l","l","o"];
reverseString(test1);
console.log(test1); // Expected: ["o","l","l","e","h"]`,
      python: `def reverse_string(s):
    # Write your code here
    pass

# Test cases
test1 = ["h","e","l","l","o"]
reverse_string(test1)
print(test1)  # Expected: ["o","l","l","e","h"]`,
      java: `public class Solution {
    public static void reverseString(char[] s) {
        // Write your code here
    }
    
    public static void main(String[] args) {
        char[] test1 = {'h','e','l','l','o'};
        reverseString(test1);
        System.out.println(test1); // Expected: olleh
    }
}`,
    },
  },
  {
    id: 4,
    title: 'FizzBuzz',
    difficulty: 'easy',
    category: 'logic',
    description: `Write a program that prints the numbers from 1 to n. But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".

Example:
Input: n = 15
Output: 1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz`,
    starterCode: {
      javascript: `function fizzBuzz(n) {
  // Write your code here
}

fizzBuzz(15);`,
      python: `def fizz_buzz(n):
    # Write your code here
    pass

fizz_buzz(15)`,
      java: `public class Solution {
    public static void fizzBuzz(int n) {
        // Write your code here
    }
    
    public static void main(String[] args) {
        fizzBuzz(15);
    }
}`,
    },
  },
  {
    id: 5,
    title: 'Print Numbers 1 to 10',
    difficulty: 'easy',
    category: 'loops',
    description: `Write a program that prints numbers from 1 to 10, each on a new line.

This is a basic loop exercise to practice iteration.

Example Output:
1
2
3
4
5
6
7
8
9
10`,
    starterCode: {
      javascript: `// Write your code here to print 1 to 10
for (let i = 1; i <= 10; i++) {
  // Your code here
}`,
      python: `# Write your code here to print 1 to 10
for i in range(1, 11):
    # Your code here
    pass`,
      java: `public class Solution {
    public static void main(String[] args) {
        // Write your code here to print 1 to 10
        for (int i = 1; i <= 10; i++) {
            // Your code here
        }
    }
}`,
    },
  },
  {
    id: 6,
    title: 'Sum of Numbers',
    difficulty: 'easy',
    category: 'loops',
    description: `Calculate the sum of numbers from 1 to n.

Example:
Input: n = 10
Output: 55
Explanation: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 = 55`,
    starterCode: {
      javascript: `function sumOfNumbers(n) {
  // Write your code here
  let sum = 0;
  // Use a loop
  return sum;
}

console.log(sumOfNumbers(10)); // Expected: 55
console.log(sumOfNumbers(5)); // Expected: 15`,
      python: `def sum_of_numbers(n):
    # Write your code here
    sum = 0
    # Use a loop
    return sum

print(sum_of_numbers(10))  # Expected: 55
print(sum_of_numbers(5))  # Expected: 15`,
      java: `public class Solution {
    public static int sumOfNumbers(int n) {
        // Write your code here
        int sum = 0;
        // Use a loop
        return sum;
    }
    
    public static void main(String[] args) {
        System.out.println(sumOfNumbers(10)); // Expected: 55
        System.out.println(sumOfNumbers(5)); // Expected: 15
    }
}`,
    },
  },
  {
    id: 7,
    title: 'Even or Odd',
    difficulty: 'easy',
    category: 'basics',
    description: `Write a function that checks if a number is even or odd.

Return "Even" if the number is even, "Odd" if it's odd.

Example:
Input: 4
Output: "Even"

Input: 7
Output: "Odd"`,
    starterCode: {
      javascript: `function evenOrOdd(num) {
  // Write your code here
}

console.log(evenOrOdd(4)); // Expected: "Even"
console.log(evenOrOdd(7)); // Expected: "Odd"
console.log(evenOrOdd(0)); // Expected: "Even"`,
      python: `def even_or_odd(num):
    # Write your code here
    pass

print(even_or_odd(4))  # Expected: "Even"
print(even_or_odd(7))  # Expected: "Odd"
print(even_or_odd(0))  # Expected: "Even"`,
      java: `public class Solution {
    public static String evenOrOdd(int num) {
        // Write your code here
        return "";
    }
    
    public static void main(String[] args) {
        System.out.println(evenOrOdd(4)); // Expected: "Even"
        System.out.println(evenOrOdd(7)); // Expected: "Odd"
        System.out.println(evenOrOdd(0)); // Expected: "Even"
    }
}`,
    },
  },
  {
    id: 8,
    title: 'Find Maximum',
    difficulty: 'easy',
    category: 'arrays',
    description: `Find the maximum number in an array.

Example:
Input: [3, 7, 2, 9, 1]
Output: 9

Input: [-5, -2, -10, -1]
Output: -1`,
    starterCode: {
      javascript: `function findMax(arr) {
  // Write your code here
}

console.log(findMax([3, 7, 2, 9, 1])); // Expected: 9
console.log(findMax([-5, -2, -10, -1])); // Expected: -1`,
      python: `def find_max(arr):
    # Write your code here
    pass

print(find_max([3, 7, 2, 9, 1]))  # Expected: 9
print(find_max([-5, -2, -10, -1]))  # Expected: -1`,
      java: `public class Solution {
    public static int findMax(int[] arr) {
        // Write your code here
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(findMax(new int[]{3, 7, 2, 9, 1})); // Expected: 9
        System.out.println(findMax(new int[]{-5, -2, -10, -1})); // Expected: -1
    }
}`,
    },
  },
  {
    id: 9,
    title: 'Count Vowels',
    difficulty: 'easy',
    category: 'strings',
    description: `Count the number of vowels (a, e, i, o, u) in a string. Case insensitive.

Example:
Input: "Hello World"
Output: 3
Explanation: e, o, o are the vowels

Input: "Programming"
Output: 3
Explanation: o, a, i are the vowels`,
    starterCode: {
      javascript: `function countVowels(str) {
  // Write your code here
}

console.log(countVowels("Hello World")); // Expected: 3
console.log(countVowels("Programming")); // Expected: 3`,
      python: `def count_vowels(str):
    # Write your code here
    pass

print(count_vowels("Hello World"))  # Expected: 3
print(count_vowels("Programming"))  # Expected: 3`,
      java: `public class Solution {
    public static int countVowels(String str) {
        // Write your code here
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(countVowels("Hello World")); // Expected: 3
        System.out.println(countVowels("Programming")); // Expected: 3
    }
}`,
    },
  },
  {
    id: 10,
    title: 'Multiplication Table',
    difficulty: 'easy',
    category: 'loops',
    description: `Print the multiplication table for a given number up to 10.

Example:
Input: n = 5
Output:
5 x 1 = 5
5 x 2 = 10
5 x 3 = 15
...
5 x 10 = 50`,
    starterCode: {
      javascript: `function multiplicationTable(n) {
  // Write your code here
}

multiplicationTable(5);`,
      python: `def multiplication_table(n):
    # Write your code here
    pass

multiplication_table(5)`,
      java: `public class Solution {
    public static void multiplicationTable(int n) {
        // Write your code here
    }
    
    public static void main(String[] args) {
        multiplicationTable(5);
    }
}`,
    },
  },
  {
    id: 11,
    title: 'Factorial',
    difficulty: 'easy',
    category: 'math',
    description: `Calculate the factorial of a number n.

Factorial of n (n!) = n × (n-1) × (n-2) × ... × 1

Example:
Input: 5
Output: 120
Explanation: 5! = 5 × 4 × 3 × 2 × 1 = 120

Input: 0
Output: 1
Explanation: 0! = 1 by definition`,
    starterCode: {
      javascript: `function factorial(n) {
  // Write your code here
}

console.log(factorial(5)); // Expected: 120
console.log(factorial(0)); // Expected: 1`,
      python: `def factorial(n):
    # Write your code here
    pass

print(factorial(5))  # Expected: 120
print(factorial(0))  # Expected: 1`,
      java: `public class Solution {
    public static int factorial(int n) {
        // Write your code here
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(factorial(5)); // Expected: 120
        System.out.println(factorial(0)); // Expected: 1
    }
}`,
    },
  },
  {
    id: 12,
    title: 'Array Sum',
    difficulty: 'easy',
    category: 'arrays',
    description: `Calculate the sum of all elements in an array.

Example:
Input: [1, 2, 3, 4, 5]
Output: 15

Input: [10, -5, 20]
Output: 25`,
    starterCode: {
      javascript: `function arraySum(arr) {
  // Write your code here
}

console.log(arraySum([1, 2, 3, 4, 5])); // Expected: 15
console.log(arraySum([10, -5, 20])); // Expected: 25`,
      python: `def array_sum(arr):
    # Write your code here
    pass

print(array_sum([1, 2, 3, 4, 5]))  # Expected: 15
print(array_sum([10, -5, 20]))  # Expected: 25`,
      java: `public class Solution {
    public static int arraySum(int[] arr) {
        // Write your code here
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(arraySum(new int[]{1, 2, 3, 4, 5})); // Expected: 15
        System.out.println(arraySum(new int[]{10, -5, 20})); // Expected: 25
    }
}`,
    },
  },
  {
    id: 13,
    title: 'Reverse Number',
    difficulty: 'easy',
    category: 'math',
    description: `Reverse the digits of a number.

Example:
Input: 12345
Output: 54321

Input: -123
Output: -321`,
    starterCode: {
      javascript: `function reverseNumber(num) {
  // Write your code here
}

console.log(reverseNumber(12345)); // Expected: 54321
console.log(reverseNumber(-123)); // Expected: -321`,
      python: `def reverse_number(num):
    # Write your code here
    pass

print(reverse_number(12345))  # Expected: 54321
print(reverse_number(-123))  # Expected: -321`,
      java: `public class Solution {
    public static int reverseNumber(int num) {
        // Write your code here
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(reverseNumber(12345)); // Expected: 54321
        System.out.println(reverseNumber(-123)); // Expected: -321
    }
}`,
    },
  },
  {
    id: 14,
    title: 'Palindrome Number',
    difficulty: 'easy',
    category: 'math',
    description: `Given an integer x, return true if x is a palindrome, and false otherwise.

Example:
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.

Example 2:
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.`,
    starterCode: {
      javascript: `function isPalindrome(x) {
  // Write your code here
}

console.log(isPalindrome(121)); // Expected: true
console.log(isPalindrome(-121)); // Expected: false
console.log(isPalindrome(10)); // Expected: false`,
      python: `def is_palindrome(x):
    # Write your code here
    pass

print(is_palindrome(121))  # Expected: True
print(is_palindrome(-121))  # Expected: False
print(is_palindrome(10))  # Expected: False`,
      java: `public class Solution {
    public static boolean isPalindrome(int x) {
        // Write your code here
        return false;
    }
    
    public static void main(String[] args) {
        System.out.println(isPalindrome(121)); // Expected: true
        System.out.println(isPalindrome(-121)); // Expected: false
        System.out.println(isPalindrome(10)); // Expected: false
    }
}`,
    },
  },
  {
    id: 15,
    title: 'Prime Number Check',
    difficulty: 'easy',
    category: 'math',
    description: `Check if a number is prime.

A prime number is a number greater than 1 that has no positive divisors other than 1 and itself.

Example:
Input: 7
Output: true

Input: 12
Output: false`,
    starterCode: {
      javascript: `function isPrime(num) {
  // Write your code here
}

console.log(isPrime(7)); // Expected: true
console.log(isPrime(12)); // Expected: false`,
      python: `def is_prime(num):
    # Write your code here
    pass

print(is_prime(7))  # Expected: True
print(is_prime(12))  # Expected: False`,
      java: `public class Solution {
    public static boolean isPrime(int num) {
        // Write your code here
        return false;
    }
    
    public static void main(String[] args) {
        System.out.println(isPrime(7)); // Expected: true
        System.out.println(isPrime(12)); // Expected: false
    }
}`,
    },
  },
];

export default function CodePractice() {
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof LANGUAGES>('javascript');
  const [code, setCode] = useState(LANGUAGES.javascript.template);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [memoryUsed, setMemoryUsed] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentChallenge, setCurrentChallenge] = useState(CHALLENGES[0]);
  const [showPreview, setShowPreview] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Load starter code for selected challenge and language
    if (currentChallenge.starterCode && currentChallenge.starterCode[selectedLanguage as keyof typeof currentChallenge.starterCode]) {
      setCode(currentChallenge.starterCode[selectedLanguage as keyof typeof currentChallenge.starterCode]);
    } else if (LANGUAGES[selectedLanguage]) {
      setCode(LANGUAGES[selectedLanguage].template);
    }
    setOutput('');
    setStatus('idle');
    setShowPreview(false);
  }, [selectedLanguage, currentChallenge]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang as keyof typeof LANGUAGES);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('');
    setStatus('idle');
    setExecutionTime(null);
    setMemoryUsed(null);

    try {
      // For HTML, show live preview
      if (selectedLanguage === 'html') {
        setShowPreview(true);
        setOutput('✓ Preview rendered successfully!');
        setStatus('success');
        setExecutionTime(0);
        setIsRunning(false);
        toast({
          title: 'Preview Ready!',
          description: 'Your HTML is rendered in the preview pane.',
        });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to run code.',
          variant: 'destructive',
        });
        setIsRunning(false);
        return;
      }

      const startTime = Date.now();
      
      const response = await apiRequest(
        'api/code/execute',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            language: selectedLanguage,
            code: code,
          }),
        },
        token
      );

      const data = await response.json();
      const endTime = Date.now();

      if (response.ok && data.status === 'success') {
        setOutput(data.output || '(No output)');
        setStatus('success');
        setExecutionTime(data.executionTime || (endTime - startTime) / 1000);
        setMemoryUsed(data.memoryUsed || null);
        toast({
          title: 'Success!',
          description: `Code executed successfully in ${((endTime - startTime) / 1000).toFixed(2)}s`,
        });
      } else {
        setOutput(data.error || data.output || 'Execution failed');
        setStatus('error');
        setExecutionTime(null);
        setMemoryUsed(null);
        toast({
          title: 'Execution Error',
          description: 'Your code encountered an error.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Code execution error:', error);
      setOutput(`Error: ${error.message}`);
      setStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to execute code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveCode = () => {
    // Save to localStorage for now (can be enhanced to save to backend)
    const savedCode = {
      language: selectedLanguage,
      code: code,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('saved_code', JSON.stringify(savedCode));
    toast({
      title: 'Code Saved!',
      description: 'Your code has been saved locally.',
    });
  };

  const handleChallengeChange = (direction: 'prev' | 'next') => {
    const currentIndex = CHALLENGES.findIndex(c => c.id === currentChallenge.id);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentChallenge(CHALLENGES[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < CHALLENGES.length - 1) {
      setCurrentChallenge(CHALLENGES[currentIndex + 1]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Code2 className="w-10 h-10 text-primary" />
              Code Practice Platform
            </h1>
            <p className="text-muted-foreground mt-2">
              Practice coding with our interactive online compiler
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGES).map(([key, lang]) => (
                  <SelectItem key={key} value={key}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSaveCode} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <Button 
              onClick={handleRunCode} 
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Problem Description */}
          <Card className="p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{currentChallenge.title}</h2>
                <Badge className={getDifficultyColor(currentChallenge.difficulty)}>
                  {currentChallenge.difficulty}
                </Badge>
                <Badge variant="outline">{currentChallenge.category}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChallengeChange('prev')}
                  disabled={CHALLENGES[0].id === currentChallenge.id}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChallengeChange('next')}
                  disabled={CHALLENGES[CHALLENGES.length - 1].id === currentChallenge.id}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="text-muted-foreground whitespace-pre-line">
                {currentChallenge.description}
              </div>
            </div>

            {currentChallenge.expectedOutput && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Expected Output:</h3>
                <code className="text-sm text-green-400">{currentChallenge.expectedOutput}</code>
              </div>
            )}

            {/* Output Console */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Output Console
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto font-mono text-sm">
                {output ? (
                  <div className="flex items-start gap-2">
                    {status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : status === 'error' ? (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : null}
                    <pre className={`whitespace-pre-wrap ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                      {output}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500">Run your code to see output here...</p>
                )}
              </div>

              {/* Execution Stats */}
              {(executionTime !== null || memoryUsed !== null) && (
                <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                  {executionTime !== null && executionTime !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Time: {executionTime.toFixed(3)}s</span>
                    </div>
                  )}
                  {memoryUsed !== null && memoryUsed !== undefined && (
                    <div className="flex items-center gap-2">
                      <MemoryStick className="w-4 h-4" />
                      <span>Memory: {memoryUsed.toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Right Panel - Code Editor */}
          <div className="space-y-4">
            <Card className="p-4 bg-card">
              <h3 className="text-lg font-semibold mb-3">Code Editor</h3>
              <CodeEditor
                language={LANGUAGES[selectedLanguage].mode}
                value={code}
                onChange={(value) => setCode(value || '')}
                height="600px"
              />
            </Card>

            {/* HTML Preview */}
            {selectedLanguage === 'html' && showPreview && (
              <Card className="p-4 bg-card">
                <h3 className="text-lg font-semibold mb-3">Live Preview</h3>
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={code}
                    title="HTML Preview"
                    sandbox="allow-scripts"
                    className="w-full h-[400px] bg-white"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="mt-8">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}


-- Migration: Add code practice tables
-- Date: 2026-01-13

-- Code submissions table
CREATE TABLE IF NOT EXISTS code_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  challenge_id INT NULL,
  language VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  status ENUM('pending', 'running', 'success', 'error', 'timeout') DEFAULT 'pending',
  execution_time DECIMAL(10,3) NULL COMMENT 'Execution time in seconds',
  memory_used DECIMAL(10,2) NULL COMMENT 'Memory used in MB',
  output TEXT NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_submissions (user_id, created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coding statistics table
CREATE TABLE IF NOT EXISTS coding_stats (
  user_id INT PRIMARY KEY,
  total_submissions INT DEFAULT 0,
  accepted_submissions INT DEFAULT 0,
  easy_solved INT DEFAULT 0,
  medium_solved INT DEFAULT 0,
  hard_solved INT DEFAULT 0,
  favorite_language VARCHAR(50) NULL,
  total_execution_time DECIMAL(10,2) DEFAULT 0 COMMENT 'Total execution time in seconds',
  streak_days INT DEFAULT 0,
  last_submission_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coding challenges table (for future use)
CREATE TABLE IF NOT EXISTS coding_challenges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
  category VARCHAR(100) NULL COMMENT 'arrays, strings, dp, etc.',
  tags JSON NULL COMMENT 'Array of tags',
  starter_code JSON NULL COMMENT 'Starter code for each language',
  test_cases JSON NULL COMMENT 'Array of test cases',
  constraints TEXT NULL,
  time_limit INT DEFAULT 5 COMMENT 'Time limit in seconds',
  memory_limit INT DEFAULT 128 COMMENT 'Memory limit in MB',
  difficulty_score INT DEFAULT 1 COMMENT 'Score from 1-10',
  acceptance_rate DECIMAL(5,2) DEFAULT 0.00,
  total_attempts INT DEFAULT 0,
  total_accepted INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_difficulty (difficulty),
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Code snippets table (for saving user code)
CREATE TABLE IF NOT EXISTS code_snippets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NULL,
  language VARCHAR(50) NOT NULL,
  code TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  tags JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_snippets (user_id, created_at),
  INDEX idx_public (is_public, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample challenges
INSERT INTO coding_challenges (title, slug, description, difficulty, category, tags, starter_code, test_cases, constraints) VALUES
('Hello World', 'hello-world', 'Write a function that prints "Hello, World!" to the console.\n\nThis is your first coding challenge! Simply output the classic greeting.', 'easy', 'basics', '["basics", "introduction"]', 
'{"javascript": "function helloWorld() {\n  // Write your code here\n}\n\nhelloWorld();", "python": "def hello_world():\n    # Write your code here\n    pass\n\nhello_world()", "java": "public class Solution {\n    public static void helloWorld() {\n        // Write your code here\n    }\n    \n    public static void main(String[] args) {\n        helloWorld();\n    }\n}"}',
'[{"input": "", "output": "Hello, World!"}]',
'Print exactly "Hello, World!" (case-sensitive)'),

('Two Sum', 'two-sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].', 'easy', 'arrays', '["arrays", "hash-table"]',
'{"javascript": "function twoSum(nums, target) {\n  // Write your code here\n}\n\nconsole.log(twoSum([2,7,11,15], 9)); // Expected: [0,1]", "python": "def two_sum(nums, target):\n    # Write your code here\n    pass\n\nprint(two_sum([2,7,11,15], 9))  # Expected: [0,1]", "java": "import java.util.*;\n\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n    \n    public static void main(String[] args) {\n        System.out.println(Arrays.toString(twoSum(new int[]{2,7,11,15}, 9)));\n    }\n}"}',
'[{"input": "[2,7,11,15], 9", "output": "[0,1]"}, {"input": "[3,2,4], 6", "output": "[1,2]"}]',
'2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.'),

('Reverse String', 'reverse-string', 'Write a function that reverses a string. The input string is given as an array of characters.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.\n\nExample:\nInput: s = ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]', 'easy', 'strings', '["strings", "two-pointers"]',
'{"javascript": "function reverseString(s) {\n  // Write your code here\n}\n\nlet test1 = [\\"h\\",\\"e\\",\\"l\\",\\"l\\",\\"o\\"];\nreverseString(test1);\nconsole.log(test1);", "python": "def reverse_string(s):\n    # Write your code here\n    pass\n\ntest1 = [\\"h\\",\\"e\\",\\"l\\",\\"l\\",\\"o\\"]\nreverse_string(test1)\nprint(test1)", "java": "public class Solution {\n    public static void reverseString(char[] s) {\n        // Write your code here\n    }\n    \n    public static void main(String[] args) {\n        char[] test1 = {\'h\',\'e\',\'l\',\'l\',\'o\'};\n        reverseString(test1);\n        System.out.println(test1);\n    }\n}"}',
'[{"input": "[\\"h\\",\\"e\\",\\"l\\",\\"l\\",\\"o\\"]", "output": "[\\"o\\",\\"l\\",\\"l\\",\\"e\\",\\"h\\"]"}]',
'1 <= s.length <= 10^5\ns[i] is a printable ascii character.');

-- Add indexes for performance
CREATE INDEX idx_language ON code_submissions(language);
CREATE INDEX idx_challenge ON code_submissions(challenge_id);

SELECT 'Code practice tables created successfully!' as result;


# Format for Interview Questions with Keyword-Based Routing

## Quick Answer: Use This Format

You should provide your questions in **JSON format** with the following structure. The system will automatically:
1. Convert user's speech to text (already working)
2. Analyze the answer for keywords
3. Route to the next question based on keywords found

## Required Format

```json
{
  "domain_name": {
    "difficulty_level": [
      {
        "id": 1,
        "question": "Your question text here",
        "expectedAnswers": [
          "Expected answer 1",
          "Expected answer 2"
        ],
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "routeKeywords": {
          "keyword_from_answer": next_question_id,
          "another_keyword": another_question_id
        },
        "defaultNextQuestionId": 2
      }
    ]
  }
}
```

## Example: React Questions

```json
{
  "frontend": {
    "beginner": [
      {
        "id": 1,
        "question": "What is React?",
        "expectedAnswers": [
          "React is a JavaScript library for building user interfaces",
          "React is a frontend framework"
        ],
        "keywords": ["react", "library", "javascript", "ui", "framework"],
        "routeKeywords": {
          "jsx": 2,
          "state": 2,
          "props": 2,
          "dom": 3,
          "css": 4
        },
        "defaultNextQuestionId": 2
      },
      {
        "id": 2,
        "question": "Explain state and props",
        "expectedAnswers": [
          "State is internal component data",
          "Props are passed from parent"
        ],
        "keywords": ["state", "props", "component", "data"],
        "routeKeywords": {
          "dom": 3,
          "css": 4
        },
        "defaultNextQuestionId": 3
      }
    ]
  }
}
```

## How It Works

### Scenario 1: Keyword Match
- **Question 1**: "What is React?"
- **User answers**: "React is a JavaScript library. I also know about JSX."
- **System detects**: keyword "jsx" in answer
- **routeKeywords** shows: "jsx" → Question 2
- **Result**: System asks Question 2 next

### Scenario 2: No Keyword Match
- **Question 1**: "What is React?"
- **User answers**: "It's a framework for building apps."
- **System detects**: No matching keywords in routeKeywords
- **Falls back to**: defaultNextQuestionId (Question 2)
- **Result**: System asks Question 2 next

## Field Explanation

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `id` | ✅ Yes | Unique question number | `1` |
| `question` | ✅ Yes | The question text | `"What is React?"` |
| `expectedAnswers` | ✅ Yes | Array of correct answers | `["React is a library", "..."]` |
| `keywords` | ✅ Yes | Keywords for scoring | `["react", "library"]` |
| `routeKeywords` | ❌ Optional | Maps keywords → next question IDs | `{"jsx": 2, "state": 2}` |
| `defaultNextQuestionId` | ❌ Optional | Default next question if no keywords match | `2` |

## What You Need to Provide

1. **All your questions** in the JSON format above
2. **For each question**, specify:
   - The question text
   - Expected answers (for evaluation)
   - Keywords (for scoring)
   - **routeKeywords** (which keywords should route to which next question)
   - **defaultNextQuestionId** (fallback next question)

## Tips for routeKeywords

- **Think about what the user might say**: If they mention "JSX" in their answer, where should the conversation go?
- **Map related topics**: If user talks about "state", maybe ask about "props" next (both are React concepts)
- **Use specific terms**: "virtual dom" is better than "dom" (more specific)
- **Multiple keywords can route to same question**: `{"jsx": 2, "state": 2, "props": 2}` all go to Question 2

## Where to Put Your Questions

Save your questions in: `server/data/interview-questions.json`

The system will automatically load and use them!

## Need Help?

See `QUESTION_FORMAT_GUIDE.md` for detailed documentation.


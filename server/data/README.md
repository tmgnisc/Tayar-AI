# Interview Questions Data

This directory contains static interview questions organized by domain and difficulty level.

## File Structure

- `interview-questions.json` - Contains all interview questions, expected answers, and keywords for evaluation

## JSON Structure

```json
{
  "domain_name": {
    "difficulty_level": [
      {
        "id": 1,
        "question": "Question text here",
        "expectedAnswers": [
          "Expected answer 1",
          "Expected answer 2"
        ],
        "keywords": ["keyword1", "keyword2"],
        "followUp": "Optional follow-up question"
      }
    ]
  }
}
```

## Adding Questions

To add questions for a new domain or level:

1. Open `interview-questions.json`
2. Add your domain (e.g., "fullstack", "devops", "mobile")
3. Add difficulty levels: "beginner", "intermediate", "advanced"
4. Add questions with:
   - `id`: Sequential number within the level
   - `question`: The question text
   - `expectedAnswers`: Array of acceptable answer variations
   - `keywords`: Important keywords that should appear in the answer
   - `followUp`: Optional follow-up question (not currently used)

## Answer Evaluation

The system evaluates answers by:
- **40%** based on keyword matches
- **60%** based on matching expected answer phrases

Scores range from 0-100, with feedback provided after each answer.


# Interview Questions Format Guide

This guide explains how to structure interview questions with keyword-based dynamic routing.

## Overview

The system now supports **keyword-based dynamic routing**, where the next question is selected based on keywords found in the user's answer. This allows for more natural, adaptive interview flows.

## JSON Structure

### Basic Question Format

```json
{
  "id": 1,
  "question": "What is React and why would you use it?",
  "expectedAnswers": [
    "React is a JavaScript library for building user interfaces",
    "It's a frontend framework for creating interactive web applications"
  ],
  "keywords": ["react", "library", "ui", "components", "javascript", "framework"],
  "followUp": "Can you explain what JSX is?",
  "routeKeywords": {
    "jsx": 2,
    "state": 2,
    "props": 2,
    "dom": 3,
    "css": 4
  },
  "defaultNextQuestionId": 2
}
```

### Field Descriptions

#### Required Fields

- **`id`** (number): Unique identifier for the question
- **`question`** (string): The question text that will be asked to the user
- **`expectedAnswers`** (array of strings): List of expected/correct answers (used for evaluation)
- **`keywords`** (array of strings): Keywords that indicate a good answer (used for scoring)

#### Optional Fields

- **`followUp`** (string): Optional follow-up question text (currently informational)
- **`routeKeywords`** (object): Maps keywords to next question IDs for dynamic routing
  - Format: `{ "keyword": questionId }`
  - When user mentions a keyword in their answer, the system routes to the specified question
  - Example: `{ "jsx": 2, "state": 2, "dom": 3 }` means:
    - If user says "jsx" → go to question ID 2
    - If user says "state" → go to question ID 2
    - If user says "dom" → go to question ID 3
- **`defaultNextQuestionId`** (number): Default next question if no routeKeywords match
  - If not specified, falls back to sequential order (next question by ID)

## How Keyword-Based Routing Works

1. **User answers a question** (speech-to-text converts it to text)
2. **System analyzes the answer** for keywords in `routeKeywords`
3. **If keyword found**: Routes to the question ID specified in `routeKeywords`
4. **If no keyword matches**: Uses `defaultNextQuestionId` (if specified)
5. **Final fallback**: Sequential order (next question by ID)

### Example Flow

**Question 1**: "What is React?"
- User answers: "React is a JavaScript library. I also know about JSX and state management."
- System detects keywords: "jsx" and "state"
- Both route to Question 2
- **Result**: System asks Question 2 next

**Question 2**: "Explain state and props"
- User answers: "State is internal data. I'm also familiar with the DOM."
- System detects keyword: "dom"
- Routes to Question 3
- **Result**: System asks Question 3 next

## Complete Example

```json
{
  "frontend": {
    "beginner": [
      {
        "id": 1,
        "question": "What is React and why would you use it?",
        "expectedAnswers": [
          "React is a JavaScript library for building user interfaces",
          "It's a frontend framework for creating interactive web applications",
          "React helps build reusable components"
        ],
        "keywords": ["react", "library", "ui", "components", "javascript", "framework"],
        "routeKeywords": {
          "jsx": 2,
          "state": 2,
          "props": 2,
          "component": 2,
          "dom": 3,
          "virtual dom": 3,
          "css": 4,
          "flexbox": 4,
          "styling": 4
        },
        "defaultNextQuestionId": 2
      },
      {
        "id": 2,
        "question": "Explain the difference between state and props in React.",
        "expectedAnswers": [
          "State is internal data that can change in a component",
          "Props are data passed from parent to child components"
        ],
        "keywords": ["state", "props", "mutable", "immutable", "component"],
        "routeKeywords": {
          "dom": 3,
          "virtual dom": 3,
          "render": 3,
          "css": 4,
          "flexbox": 4
        },
        "defaultNextQuestionId": 3
      },
      {
        "id": 3,
        "question": "What is the DOM and how does React interact with it?",
        "expectedAnswers": [
          "DOM stands for Document Object Model",
          "React uses a virtual DOM for efficiency"
        ],
        "keywords": ["dom", "virtual dom", "browser", "html", "elements"],
        "routeKeywords": {
          "css": 4,
          "flexbox": 4,
          "styling": 4,
          "layout": 4
        },
        "defaultNextQuestionId": 4
      }
    ]
  }
}
```

## Best Practices

1. **Use specific keywords**: Prefer specific terms like "jsx", "virtual dom" over generic ones like "code"
2. **Multiple routes to same question**: You can map multiple keywords to the same question ID
3. **Always set defaultNextQuestionId**: Ensures a fallback path if no keywords match
4. **Test keyword matching**: Keywords are matched case-insensitively and can match whole words or phrases
5. **Consider synonyms**: Add common synonyms/variations (e.g., "component" and "components")

## Keyword Matching Rules

- **Case-insensitive**: "React", "react", "REACT" all match
- **Whole word or phrase**: "jsx" matches "I know JSX" and "JSX is great"
- **Partial matches**: "virtual dom" matches "virtual DOM" and "virtual dom manipulation"
- **First match wins**: If multiple keywords match, the first one in `routeKeywords` is used

## Migration from Old Format

If you have existing questions without `routeKeywords`:
- They will work fine (sequential routing)
- Add `routeKeywords` gradually to enable dynamic routing
- `defaultNextQuestionId` is optional but recommended


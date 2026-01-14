# Setup Instructions

## 1. Copy Interview Questions File

Copy the interview questions JSON file from the Node.js backend:

```bash
cp "../server/data/interview-questions.json" "src/main/resources/data/interview-questions.json"
```

Or manually:
- Source: `server/data/interview-questions.json`
- Destination: `java backend/src/main/resources/data/interview-questions.json`

## 2. Database Setup

Ensure MySQL database `tayar_ai` exists and matches the schema from the Node.js backend.

## 3. Environment Variables

Create a `.env` file or set environment variables:

```bash
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-change-in-production
```

## 4. Build and Run

```bash
mvn clean install
mvn spring-boot:run
```

The server will run on `http://localhost:3001`

## 5. Test

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Tayar AI Backend is running"
}
```


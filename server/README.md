# Tayar AI Backend Server

Express.js + TypeScript backend server with MySQL database for Tayar AI interview coaching platform.

## Setup Instructions

### 1. Database Configuration

Create a `.env` file in the `server` directory with the following configuration:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=tayar_ai
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Install Dependencies

All dependencies are installed in the root `package.json`. No separate installation needed.

### 3. Start the Server

```bash
# Production mode
npm run server

# Development mode with auto-reload
npm run server:dev
```

The server will automatically:
- Create the `tayar_ai` database if it doesn't exist
- Create all necessary tables
- Seed an admin user: `admin@tayar.ai` / `admin123`

### 4. Verify Server is Running

Visit: http://localhost:3000/api/health

You should see:
```json
{
  "status": "ok",
  "message": "Tayar AI Backend is running"
}
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
  - Body: `{ name, email, password }`
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: JWT token and user data
  
- `GET /api/auth/me` - Get current user (requires auth)

### User Endpoints (`/api/user`) - Requires Authentication

- `GET /api/user/dashboard` - Get user dashboard stats
- `GET /api/user/interviews` - Get user's interviews with pagination
- `GET /api/user/interviews/:id` - Get specific interview details
- `POST /api/user/interviews` - Start new interview

### Admin Endpoints (`/api/admin`) - Requires Admin Role

- `GET /api/admin/dashboard` - Get admin dashboard overview
- `GET /api/admin/users` - Get all users with search and pagination
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id/subscription` - Update user subscription
- `GET /api/admin/interviews` - Get all interviews
- `GET /api/admin/activity` - Get activity logs

## Default Admin Account

```
Email: admin@tayar.ai
Password: admin123
```

**⚠️ Change this immediately in production!**

## Database Schema

### Tables Created

1. **users** - User accounts with roles and subscriptions
2. **interviews** - Interview sessions
3. **interview_feedback** - Feedback for each interview
4. **activity_logs** - Activity tracking
5. **subscriptions** - Subscription management

## Development

The server uses:
- **Express.js** for API framework
- **MySQL2** for database connectivity
- **bcryptjs** for password hashing
- **jsonwebtoken** for authentication
- **TypeScript** for type safety
- **tsx** for running TypeScript directly

## Testing the Backend

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tayar.ai",
    "password": "admin123"
  }'
```

Save the token from the response and use it in subsequent requests:

```bash
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### MySQL Connection Issues

1. Ensure phpMyAdmin/MySQL is running on localhost
2. Check your `.env` credentials
3. Verify database server is accessible

### Port Already in Use

Change the PORT in `.env` or kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

### Database Tables Not Created

Delete the `tayar_ai` database in phpMyAdmin and restart the server. Tables will be recreated automatically.


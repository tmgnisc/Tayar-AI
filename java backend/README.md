# Tayar AI - Spring Boot Backend

This is the Spring Boot MVC backend implementation for the Tayar AI platform, mirroring the Node.js backend structure.

## Project Structure

```
java backend/
├── src/
│   ├── main/
│   │   ├── java/com/tayarai/
│   │   │   ├── config/          # Configuration classes (JWT, Security, CORS)
│   │   │   ├── controller/      # REST Controllers (mirroring Node.js routes)
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   ├── model/           # JPA Entity models
│   │   │   ├── repository/      # JPA Repositories
│   │   │   ├── service/         # Business logic services
│   │   │   └── TayarAiApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── data/            # Interview questions JSON (copy from Node.js backend)
│   └── test/
└── pom.xml
```

## Features

- **Spring Boot 3.2.0** with Java 17
- **Spring Security** with JWT authentication
- **Spring Data JPA** for database operations
- **MySQL** database connection
- **MVC Pattern** - Controllers, Services, Repositories
- **CORS** configuration for frontend integration
- **Password encryption** with BCrypt

## Setup

1. **Prerequisites:**
   - Java 17 or higher
   - Maven 3.6+
   - MySQL 8.0+

2. **Database Setup:**
   - Create database: `tayar_ai`
   - Update `application.properties` with your database credentials

3. **Environment Variables:**
   - `DB_USER` - MySQL username (default: root)
   - `DB_PASSWORD` - MySQL password
   - `JWT_SECRET` - JWT secret key
   - Other API keys (OpenAI, Gemini, Stripe, etc.)

4. **Build and Run:**
   ```bash
   cd "java backend"
   mvn clean install
   mvn spring-boot:run
   ```

5. **Server:**
   - Runs on `http://localhost:3001` (different port from Node.js backend)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User
- `GET /api/user/dashboard` - Get user dashboard data
- `GET /api/user/profile` - Get user profile

### Interviews
- `POST /api/user/interviews` - Create new interview
- `GET /api/user/interviews/{id}` - Get interview details

### Health
- `GET /api/health` - Health check endpoint

## Architecture

### MVC Pattern
- **Model**: JPA Entities (`model/` package)
- **View**: JSON responses (REST API)
- **Controller**: REST Controllers (`controller/` package)
- **Service**: Business logic (`service/` package)
- **Repository**: Data access layer (`repository/` package)

### Security
- JWT-based authentication
- Spring Security filter chain
- Password encryption with BCrypt
- Role-based access control (USER, ADMIN)

## Notes

- This backend is **not integrated with the frontend** yet (as per requirements)
- It mirrors the Node.js backend structure and API endpoints
- Database schema matches the Node.js backend
- All entities, repositories, and basic services are implemented
- Additional services (interview evaluation, code execution, etc.) can be added as needed

## Next Steps

1. Copy `interview-questions.json` from Node.js backend to `src/main/resources/data/`
2. Implement remaining services (code execution, email, etc.)
3. Add more controllers for admin, code practice, CV builder, etc.
4. Test API endpoints
5. Integrate with frontend when ready


# Tayar AI - AI-Powered Interview Coaching Platform

A modern, full-stack web application for AI-powered interview preparation with separate user and admin dashboards.

## 🚀 Features

### User Features
- **AI-Powered Interview Practice** - Realistic voice-based interview simulations
- **Real-time Feedback** - Instant analysis and actionable improvements
- **Progress Tracking** - Monitor improvement over time with detailed analytics
- **Customizable Interviews** - Role-specific, difficulty-based practice sessions
- **Multi-language Support** - Practice in multiple languages

### Admin Features
- **User Management** - Monitor all registered users and their activity
- **Analytics Dashboard** - Track growth, revenue, and engagement metrics
- **Subscription Management** - Manage user subscriptions and billing
- **Activity Logs** - Complete audit trail of user actions
- **Growth Tracking** - Visualize user growth over time

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful UI components
- **Framer Motion** for animations
- **React Router** for navigation
- **TanStack Query** for data fetching

### Backend
- **Express.js** REST API
- **TypeScript** for type safety
- **MySQL** database with phpMyAdmin
- **JWT** authentication
- **bcryptjs** for password hashing
- **Node.js** runtime

## 📋 Prerequisites

- Node.js 18+ installed
- MySQL/phpMyAdmin running on localhost
- npm or yarn package manager

## ⚙️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install all dependencies
npm install
```

### 2. Setup Backend

Create a `.env` file in the `server` directory:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tayar_ai
JWT_SECRET=your-super-secret-jwt-key
```

### 3. Start the Backend Server

```bash
# Development mode with auto-reload
npm run server:dev
```

The server will automatically:
- Create the `tayar_ai` database
- Set up all necessary tables
- Seed an admin user (admin@tayar.ai / admin123)

### 4. Start the Frontend

```bash
# In a new terminal
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Admin Dashboard: http://localhost:5173/admin

## 🔐 Default Credentials

### Admin Account
- Email: `admin@tayar.ai`
- Password: `admin123`

**⚠️ Change these credentials immediately in production!**

## 📁 Project Structure

```
Tayar AI/
├── src/                    # Frontend React application
│   ├── pages/             # Page components
│   │   ├── Landing.tsx
│   │   ├── About.tsx
│   │   ├── Features.tsx
│   │   ├── Pricing.tsx
│   │   ├── Contact.tsx
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   ├── Dashboard.tsx      # User dashboard
│   │   ├── AdminDashboard.tsx # Admin dashboard
│   │   └── ...
│   ├── components/        # Reusable components
│   ├── hooks/            # Custom React hooks
│   └── App.tsx           # Main app component
│
├── server/               # Backend Express server
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth middleware
│   ├── routes/         # API routes
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── admin.ts
│   └── index.ts        # Server entry point
│
└── package.json
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### User Endpoints (Authenticated)
- `GET /api/user/dashboard` - Dashboard stats
- `GET /api/user/interviews` - List interviews
- `POST /api/user/interviews` - Start interview

### Admin Endpoints (Admin Only)
- `GET /api/admin/dashboard` - Admin overview
- `GET /api/admin/users` - List all users
- `GET /api/admin/interviews` - All interviews
- `GET /api/admin/activity` - Activity logs

See [server/README.md](server/README.md) for detailed API documentation.

## 🎨 Design

- **White Background** with modern, clean aesthetic
- **Purple/Blue Gradient** color scheme
- **Glass-morphism** effects
- **Smooth Animations** with Framer Motion
- **Fully Responsive** - Mobile-first design
- **Dark Mode Ready** - Theme system in place

## 🔒 Security

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- SQL injection protection with prepared statements
- CORS configuration
- Input validation

## 📊 Database Schema

### Tables
- **users** - User accounts with roles
- **interviews** - Interview sessions
- **interview_feedback** - Detailed feedback
- **activity_logs** - Audit trail
- **subscriptions** - Subscription management

## 🚦 Running in Development

```bash
# Terminal 1: Start backend
npm run server:dev

# Terminal 2: Start frontend
npm run dev
```

## 📦 Building for Production

```bash
# Build frontend
npm run build

# The build will be in dist/
```

## 🤝 Contributing

This is a private project. For contributions, please contact the project maintainer.

## 📝 License

Private - All rights reserved

## 🙏 Acknowledgments

- shadcn/ui for the component library
- Vercel for deployment inspiration
- The open-source community


# Quick Start Guide - Tayar AI

Follow these steps to get the application running locally.

## Step 1: Prerequisites ✅

Ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ MySQL/phpMyAdmin running on localhost
- ✅ npm or yarn installed

## Step 2: Install Dependencies 📦

```bash
npm install
```

This installs all frontend and backend dependencies.

## Step 3: Setup Environment Variables 🔐

Create a file called `.env` in the `server` folder:

```bash
cd server
touch .env
```

Add these contents to `server/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=tayar_ai
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Note:** If your MySQL has a password, update `DB_PASSWORD` accordingly.

## Step 4: Start the Backend Server 🚀

```bash
# From project root
npm run server:dev
```

You should see:
```
📊 Initializing database...
✅ Database created/verified
✅ Tables created/verified
✅ Initial data seeded
👤 Admin user created: admin@tayar.ai / admin123
🚀 Server running on http://localhost:3000
```

**Keep this terminal running!**

## Step 5: Start the Frontend 🎨

Open a **new terminal** and run:

```bash
# From project root
npm run dev
```

You should see:
```
  VITE ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 6: Access the Application 🌐

Open your browser to: **http://localhost:5173**

### Try These:

1. **Landing Page** - Beautiful homepage with features
2. **Sign Up** - Create a new user account
3. **Sign In** - Login with:
   - User: `admin@tayar.ai` / `admin123` (Admin)
   - Or any account you create
4. **Admin Dashboard** - Visit http://localhost:5173/admin (requires admin login)
5. **User Dashboard** - Visit http://localhost:5173/dashboard (requires login)

## 🎯 Main Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/about` | About page |
| `/features` | Features page |
| `/pricing` | Pricing page |
| `/contact` | Contact page |
| `/auth/signin` | Sign in |
| `/auth/signup` | Sign up |
| `/dashboard` | User dashboard |
| `/admin` | Admin dashboard |
| `/interview/setup` | Setup interview |
| `/interview/session` | Interview session |
| `/interview/result` | Interview results |

## 🐛 Troubleshooting

### Backend won't start

**Error:** "Can't connect to MySQL"

**Solution:** 
- Make sure MySQL is running: `sudo service mysql start` (Linux) or use MAMP/XAMPP
- Check `.env` credentials in `server/` folder

### Database errors

**Error:** "Unknown database 'tayar_ai'"

**Solution:**
- The server auto-creates the database on first run
- If it fails, manually create `tayar_ai` in phpMyAdmin
- Then restart the server

### Port already in use

**Error:** "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in server/.env
```

### Frontend can't connect to backend

**Error:** CORS or connection errors

**Solution:**
- Make sure backend is running on http://localhost:3000
- Check `src/pages/SignIn.tsx` and other API calls use correct URL
- Verify API health: http://localhost:3000/api/health

## ✅ Verify Everything Works

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"status":"ok","message":"Tayar AI Backend is running"}`

2. **Database:**
   - Open phpMyAdmin
   - You should see `tayar_ai` database
   - Should have 5 tables: users, interviews, interview_feedback, activity_logs, subscriptions

3. **Login Test:**
   - Go to http://localhost:5173/auth/signin
   - Login with admin@tayar.ai / admin123
   - Should redirect to admin dashboard

## 🎉 You're All Set!

Your Tayar AI platform is now running locally. Start exploring the features!

## 📚 Next Steps

- Create a normal user account to test the user dashboard
- Try creating an interview
- Check the admin dashboard for analytics
- Explore the API endpoints

## 💡 Tips

- Both servers run in **watch mode** - code changes auto-reload
- Check browser console for frontend errors
- Check terminal for backend logs
- Admin password should be changed in production

## 🆘 Need Help?

Check the main README.md for detailed documentation.


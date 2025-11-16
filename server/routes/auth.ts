import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const connection = await pool.getConnection();
    
    try {
      // Check if user exists
      const [existingUsers]: any = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with explicit role='user' (normal user, not admin)
      const [result]: any = await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'user']
      );

      const userId = result.insertId;

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'user_registered', `New user registered: ${email}`]
      );

      res.status(201).json({
        message: 'User created successfully',
        userId: userId,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();
    
    try {
      const [users]: any = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = users[0];

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await connection.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description, ip_address) VALUES (?, ?, ?, ?)',
        [user.id, 'user_login', `User logged in: ${email}`, req.ip]
      );

      // Generate JWT with longer expiration (30 days)
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Get domain info if user has one
      let domain = null;
      if (user.domain_id) {
        const [domains]: any = await connection.query(
          'SELECT * FROM domains WHERE id = ?',
          [user.domain_id]
        );
        domain = domains[0] || null;
      }

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          domain_id: user.domain_id,
          domain: domain,
          level: user.level,
          avatar_url: user.avatar_url || null,
          subscription_type: user.subscription_type,
          subscription_status: user.subscription_status,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Try query with domain join first
      let users: any;
      
      try {
        const [result]: any = await connection.query(
          `SELECT u.id, u.name, u.email, u.role, u.domain_id, u.level, 
           u.subscription_type, u.subscription_status, u.created_at, u.last_login,
           d.id as d_id, d.name as domain_name, d.description as domain_description
          FROM users u
          LEFT JOIN domains d ON u.domain_id = d.id
          WHERE u.id = ?`,
          [req.userId]
        );
        users = result;
      } catch (joinError: any) {
        // If JOIN fails (columns might not exist), use simpler query
        console.warn('Domain join failed in /me, using simple query:', joinError.message);
        const [result]: any = await connection.query(
          `SELECT u.id, u.name, u.email, u.role, 
           u.subscription_type, u.subscription_status, u.created_at, u.last_login
          FROM users u
          WHERE u.id = ?`,
          [req.userId]
        );
        users = result;
      }

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = users[0];
      res.json({ 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          domain_id: user.domain_id || null,
          domain: (user.domain_id && user.d_id) ? {
            id: user.d_id,
            name: user.domain_name || null,
            description: user.domain_description || null,
          } : null,
          level: user.level || null,
          subscription_type: user.subscription_type,
          subscription_status: user.subscription_status,
          created_at: user.created_at,
          last_login: user.last_login,
        }
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const connection = await pool.getConnection();
    
    try {
      const [users]: any = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        // Don't reveal if email exists for security
        return res.json({ 
          message: 'If an account with that email exists, we have sent a password reset OTP' 
        });
      }

      const user = users[0];

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database (you might want to create a password_resets table)
      // For now, we'll store it in a simple way
      await connection.query(
        'UPDATE users SET password_reset_otp = ?, password_reset_otp_expiry = ? WHERE id = ?',
        [otp, otpExpiry, user.id]
      );

      // Send OTP email
      const { sendOTPEmail } = await import('../services/email');
      await sendOTPEmail(email, otp);

      res.json({ 
        message: 'OTP has been sent to your email',
        // In production, don't send OTP in response
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password - Verify OTP and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const connection = await pool.getConnection();
    
    try {
      const [users]: any = await connection.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = users[0];

      // Check OTP
      if (user.password_reset_otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Check OTP expiry
      if (!user.password_reset_otp_expiry || new Date() > new Date(user.password_reset_otp_expiry)) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear OTP
      await connection.query(
        'UPDATE users SET password = ?, password_reset_otp = NULL, password_reset_otp_expiry = NULL WHERE id = ?',
        [hashedPassword, user.id]
      );

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [user.id, 'password_reset', 'User reset their password']
      );

      res.json({ message: 'Password has been reset successfully' });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


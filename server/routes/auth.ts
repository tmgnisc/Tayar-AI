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
      const [users]: any = await connection.query(
        `SELECT u.id, u.name, u.email, u.role, u.domain_id, u.level, 
         u.subscription_type, u.subscription_status, u.created_at, u.last_login,
         d.id as d_id, d.name as domain_name, d.description as domain_description
         FROM users u
         LEFT JOIN domains d ON u.domain_id = d.id
         WHERE u.id = ?`,
        [req.userId]
      );

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
          domain_id: user.domain_id,
          domain: user.domain_id ? {
            id: user.domain_id,
            name: user.domain_name,
            description: user.domain_description,
          } : null,
          level: user.level,
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


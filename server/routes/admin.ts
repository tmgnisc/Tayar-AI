import express from 'express';
import { pool } from '../config/database';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard overview
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Total users
      const [usersCount]: any = await connection.query(
        'SELECT COUNT(*) as total FROM users WHERE role = "user"'
      );

      // Active users (last 30 days)
      const [activeUsers]: any = await connection.query(
        'SELECT COUNT(DISTINCT user_id) as total FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );

      // Total interviews
      const [interviewsCount]: any = await connection.query(
        'SELECT COUNT(*) as total FROM interviews WHERE status = "completed"'
      );

      // Interviews in last 30 days
      const [recentInterviews]: any = await connection.query(
        'SELECT COUNT(*) as total FROM interviews WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );

      // Revenue data
      const [revenue]: any = await connection.query(
        `SELECT 
          SUM(CASE WHEN plan_type = 'pro' THEN amount ELSE 0 END) as pro_revenue,
          SUM(CASE WHEN plan_type = 'enterprise' THEN amount ELSE 0 END) as enterprise_revenue,
          SUM(amount) as total_revenue
        FROM subscriptions 
        WHERE status = 'active'`
      );

      // Subscription breakdown
      const [subscriptions]: any = await connection.query(
        `SELECT plan_type, COUNT(*) as count 
         FROM users 
         WHERE subscription_type IN ('pro', 'enterprise') 
         GROUP BY plan_type`
      );

      // Recent users growth
      const [growthData]: any = await connection.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC`
      );

      res.json({
        overview: {
          total_users: usersCount[0].total,
          active_users: activeUsers[0].total,
          total_interviews: interviewsCount[0].total,
          recent_interviews: recentInterviews[0].total,
        },
        revenue: {
          pro: revenue[0].pro_revenue || 0,
          enterprise: revenue[0].enterprise_revenue || 0,
          total: revenue[0].total_revenue || 0,
        },
        subscriptions: subscriptions,
        growth: growthData,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      let query = `SELECT u.id, u.name, u.email, u.role, u.subscription_type, 
                   u.subscription_status, u.created_at, u.last_login,
                   COUNT(i.id) as interview_count
                   FROM users u
                   LEFT JOIN interviews i ON u.id = i.user_id
                   WHERE u.role = 'user'`;
      
      const params: any[] = [];

      if (search) {
        query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), offset);

      const [users]: any = await connection.query(query, params);

      const [count]: any = await connection.query(
        `SELECT COUNT(*) as total FROM users WHERE role = 'user'${search ? ' AND (name LIKE ? OR email LIKE ?)' : ''}`,
        search ? [`%${search}%`, `%${search}%`] : []
      );

      res.json({
        users,
        pagination: {
          total: count[0].total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count[0].total / Number(limit)),
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user details
router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.params.id;

    try {
      const [users]: any = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const [interviews]: any = await connection.query(
        'SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [userId]
      );

      const [subscriptions]: any = await connection.query(
        'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      const [activity]: any = await connection.query(
        'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );

      res.json({
        user: users[0],
        interviews,
        subscriptions,
        activity,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user subscription
router.patch('/users/:id/subscription', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.params.id;
    const { subscription_type, subscription_status, subscription_end_date } = req.body;

    try {
      await connection.query(
        `UPDATE users 
         SET subscription_type = ?, subscription_status = ?, subscription_end_date = ?
         WHERE id = ?`,
        [subscription_type, subscription_status, subscription_end_date, userId]
      );

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'subscription_updated', `Subscription updated by admin: ${subscription_type}`]
      );

      res.json({ message: 'Subscription updated successfully' });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all interviews
router.get('/interviews', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const [interviews]: any = await connection.query(
        `SELECT i.*, u.name as user_name, u.email as user_email
         FROM interviews i
         JOIN users u ON i.user_id = u.id
         ORDER BY i.created_at DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), offset]
      );

      const [count]: any = await connection.query(
        'SELECT COUNT(*) as total FROM interviews'
      );

      res.json({
        interviews,
        pagination: {
          total: count[0].total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count[0].total / Number(limit)),
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get activity logs
router.get('/activity', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const { page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const [logs]: any = await connection.query(
        `SELECT al.*, u.name as user_name, u.email as user_email
         FROM activity_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), offset]
      );

      const [count]: any = await connection.query(
        'SELECT COUNT(*) as total FROM activity_logs'
      );

      res.json({
        logs,
        pagination: {
          total: count[0].total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count[0].total / Number(limit)),
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


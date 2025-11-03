import express from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user dashboard stats
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const userId = req.userId!;

      // Get interview stats
      const [interviewStats]: any = await connection.query(
        `SELECT 
          COUNT(*) as total_interviews,
          AVG(overall_score) as avg_score,
          SUM(duration_minutes) as total_minutes
        FROM interviews 
        WHERE user_id = ? AND status = 'completed'`,
        [userId]
      );

      // Get recent interviews
      const [recentInterviews]: any = await connection.query(
        `SELECT id, role, difficulty, language, overall_score, duration_minutes, completed_at
         FROM interviews 
         WHERE user_id = ? 
         ORDER BY completed_at DESC 
         LIMIT 10`,
        [userId]
      );

      // Get user info
      const [users]: any = await connection.query(
        'SELECT subscription_type, subscription_status FROM users WHERE id = ?',
        [userId]
      );

      res.json({
        stats: {
          total_interviews: interviewStats[0]?.total_interviews || 0,
          avg_score: parseFloat(interviewStats[0]?.avg_score || 0).toFixed(1),
          total_minutes: interviewStats[0]?.total_minutes || 0,
          achievements: 0, // Can be calculated based on milestones
        },
        recent_interviews: recentInterviews,
        subscription: {
          type: users[0]?.subscription_type || 'free',
          status: users[0]?.subscription_status || 'active',
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get interview history
router.get('/interviews', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const [interviews]: any = await connection.query(
        `SELECT id, role, difficulty, language, overall_score, status, 
         started_at, completed_at, duration_minutes
         FROM interviews 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, Number(limit), offset]
      );

      const [count]: any = await connection.query(
        'SELECT COUNT(*) as total FROM interviews WHERE user_id = ?',
        [userId]
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

// Get interview details
router.get('/interviews/:id', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const interviewId = req.params.id;

    try {
      const [interviews]: any = await connection.query(
        `SELECT * FROM interviews WHERE id = ? AND user_id = ?`,
        [interviewId, userId]
      );

      if (interviews.length === 0) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      const [feedback]: any = await connection.query(
        'SELECT * FROM interview_feedback WHERE interview_id = ?',
        [interviewId]
      );

      res.json({
        interview: interviews[0],
        feedback: feedback,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get interview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start new interview
router.post('/interviews', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const { role, difficulty, language } = req.body;

    if (!role || !difficulty || !language) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      const [result]: any = await connection.query(
        'INSERT INTO interviews (user_id, role, difficulty, language) VALUES (?, ?, ?, ?)',
        [userId, role, difficulty, language]
      );

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'interview_started', `Started interview for role: ${role}`]
      );

      res.status(201).json({
        message: 'Interview started',
        interviewId: result.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


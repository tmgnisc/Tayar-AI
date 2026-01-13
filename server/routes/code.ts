import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { executeCode } from '../services/codeExecutionService.js';
import { pool } from '../config/database.js';

const router = Router();

// Execute code
router.post('/execute', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { language, code } = req.body;
    const userId = req.userId!;

    if (!language || !code) {
      return res.status(400).json({ 
        message: 'Language and code are required',
        status: 'error'
      });
    }

    // Validate language
    const supportedLanguages = ['javascript', 'python', 'java'];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({ 
        message: `Unsupported language: ${language}. Supported: ${supportedLanguages.join(', ')}`,
        status: 'error'
      });
    }

    // Check code length limit (10,000 chars)
    if (code.length > 10000) {
      return res.status(400).json({ 
        message: 'Code too long. Maximum 10,000 characters allowed.',
        status: 'error'
      });
    }

    console.log(`[Code Execution] User ${userId} executing ${language} code (${code.length} chars)`);

    // Execute code
    const result = await executeCode(language, code);

    // Store submission in database
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `INSERT INTO code_submissions 
         (user_id, language, code, status, execution_time, memory_used, output, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          language,
          code,
          result.status,
          result.executionTime || null,
          result.memoryUsed || null,
          result.output || null,
          result.error || null,
        ]
      );

      // Update coding stats
      await connection.query(
        `INSERT INTO coding_stats (user_id, total_submissions, accepted_submissions, last_submission_date)
         VALUES (?, 1, ${result.status === 'success' ? 1 : 0}, CURDATE())
         ON DUPLICATE KEY UPDATE 
         total_submissions = total_submissions + 1,
         accepted_submissions = accepted_submissions + ${result.status === 'success' ? 1 : 0},
         last_submission_date = CURDATE()`,
        [userId]
      );
    } finally {
      connection.release();
    }

    res.json(result);
  } catch (error: any) {
    console.error('Code execution error:', error);
    res.status(500).json({
      message: 'Failed to execute code',
      error: error.message,
      status: 'error',
    });
  }
});

// Get user's code submission history
router.get('/submissions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const connection = await pool.getConnection();

    try {
      const [submissions]: any = await connection.query(
        `SELECT id, language, status, execution_time, memory_used, created_at
         FROM code_submissions
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      res.json({ submissions });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      message: 'Failed to get submissions',
      error: error.message,
    });
  }
});

// Get user's coding stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const connection = await pool.getConnection();

    try {
      const [stats]: any = await connection.query(
        `SELECT * FROM coding_stats WHERE user_id = ?`,
        [userId]
      );

      if (stats.length === 0) {
        return res.json({
          total_submissions: 0,
          accepted_submissions: 0,
          easy_solved: 0,
          medium_solved: 0,
          hard_solved: 0,
        });
      }

      res.json(stats[0]);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      message: 'Failed to get stats',
      error: error.message,
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const connection = await pool.getConnection();

    try {
      const [leaderboard]: any = await connection.query(
        `SELECT 
          cs.user_id,
          u.name,
          u.email,
          u.avatar_url,
          cs.total_submissions,
          cs.accepted_submissions,
          cs.easy_solved,
          cs.medium_solved,
          cs.hard_solved,
          cs.favorite_language,
          cs.streak_days,
          cs.last_submission_date,
          (cs.easy_solved + cs.medium_solved * 2 + cs.hard_solved * 3) as total_score
         FROM coding_stats cs
         INNER JOIN users u ON cs.user_id = u.id
         WHERE cs.total_submissions > 0
         ORDER BY total_score DESC, cs.accepted_submissions DESC, cs.total_submissions DESC
         LIMIT ?`,
        [limit]
      );

      // Add rank
      const rankedLeaderboard = leaderboard.map((user: any, index: number) => ({
        ...user,
        rank: index + 1,
      }));

      res.json({ leaderboard: rankedLeaderboard });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      message: 'Failed to get leaderboard',
      error: error.message,
    });
  }
});

export default router;


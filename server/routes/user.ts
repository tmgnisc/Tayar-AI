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
      // Get user info for interview
      const [users]: any = await connection.query(
        'SELECT name, email FROM users WHERE id = ?',
        [userId]
      );
      const user = users[0];

      // Create interview record
      const [result]: any = await connection.query(
        'INSERT INTO interviews (user_id, role, difficulty, language) VALUES (?, ?, ?, ?)',
        [userId, role, difficulty, language]
      );

      const interviewId = result.insertId;

      // Initialize Vapi call for web-based interview
      let vapiCallId = null;
      let vapiAssistantId = null;

      try {
        const { createVapiAssistant, createVapiWebCall } = await import('../services/vapi');
        
        // First create the assistant
        vapiAssistantId = await createVapiAssistant({
          interviewId,
          userId,
          role,
          difficulty,
          userName: user.name,
        });

        // Then create the call with the assistant
        const vapiCall = await createVapiWebCall({
          interviewId,
          userId,
          role,
          difficulty,
          userName: user.name,
          assistantId: vapiAssistantId,
        });

        vapiCallId = vapiCall.id;

        // Update interview with Vapi call ID and assistant ID
        await connection.query(
          'UPDATE interviews SET vapi_call_id = ?, vapi_assistant_id = ? WHERE id = ?',
          [vapiCallId, vapiAssistantId, interviewId]
        );
      } catch (vapiError: any) {
        console.error('Vapi initialization error:', vapiError);
        // Continue even if Vapi fails - interview can still be created
      }

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'interview_started', `Started interview for role: ${role}`]
      );

      res.status(201).json({
        message: 'Interview started',
        interviewId,
        vapiCallId,
        vapiStatus: vapiCallId ? 'initialized' : 'failed',
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Vapi call info for frontend
router.get('/interviews/:id/vapi-info', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const interviewId = req.params.id;

    try {
      const [interviews]: any = await connection.query(
        'SELECT vapi_call_id, vapi_assistant_id, role, difficulty FROM interviews WHERE id = ? AND user_id = ?',
        [interviewId, userId]
      );

      if (interviews.length === 0) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      const interview = interviews[0];

      if (!interview.vapi_call_id) {
        return res.status(400).json({ message: 'Vapi call not initialized' });
      }

      res.json({
        callId: interview.vapi_call_id,
        assistantId: interview.vapi_assistant_id,
        // Public API key can be used client-side
        publicKey: process.env.VAPI_API_KEY,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get Vapi info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save transcript manually (for client-side integration without webhooks)
router.post('/interviews/:id/transcript', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const interviewId = req.params.id;
    const { transcript, recordingUrl, duration } = req.body;

    try {
      // Verify interview belongs to user
      const [interviews]: any = await connection.query(
        'SELECT * FROM interviews WHERE id = ? AND user_id = ?',
        [interviewId, userId]
      );

      if (interviews.length === 0) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      const interview = interviews[0];

      // Update interview with transcript
      await connection.query(
        `UPDATE interviews 
         SET conversation_transcript = ?,
             vapi_recording_url = ?,
             duration_minutes = ?,
             completed_at = NOW(),
             status = 'completed'
         WHERE id = ?`,
        [transcript || null, recordingUrl || null, duration || null, interviewId]
      );

      // Generate feedback using Gemini if transcript is available
      if (transcript) {
        try {
          const { generateInterviewFeedback } = await import('../services/gemini');
          const feedback = await generateInterviewFeedback(transcript, {
            role: interview.role,
            difficulty: interview.difficulty,
            language: interview.language,
          });

          // Update overall score
          await connection.query(
            'UPDATE interviews SET overall_score = ? WHERE id = ?',
            [feedback.overallScore, interviewId]
          );

          // Save feedback categories
          for (const item of feedback.feedback) {
            await connection.query(
              `INSERT INTO interview_feedback (interview_id, category, score, feedback)
               VALUES (?, ?, ?, ?)`,
              [interviewId, item.category, item.score, item.comment]
            );
          }

          console.log('✅ Interview feedback generated for interview:', interviewId);
        } catch (error: any) {
          console.error('Error generating feedback:', error);
        }
      }

      res.json({ message: 'Transcript saved successfully' });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Save transcript error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;

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
          [userId]
        );
        users = result;
      } catch (joinError: any) {
        // If JOIN fails (domains table might not exist), use simpler query
        console.warn('Domain join failed, using simple query:', joinError.message);
        const [result]: any = await connection.query(
          `SELECT u.id, u.name, u.email, u.role, u.domain_id, u.level, 
           u.subscription_type, u.subscription_status, u.created_at, u.last_login
          FROM users u
          WHERE u.id = ?`,
          [userId]
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
        },
      });
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      throw dbError;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all available domains
router.get('/domains', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [domains]: any = await connection.query(
        'SELECT * FROM domains WHERE is_active = TRUE ORDER BY name ASC'
      );

      res.json({ domains });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get domains error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.patch('/profile', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const { name, domain_id, level } = req.body;

    try {
      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }

      if (domain_id !== undefined) {
        // Validate domain exists if provided
        if (domain_id !== null) {
          const [domains]: any = await connection.query(
            'SELECT * FROM domains WHERE id = ? AND is_active = TRUE',
            [domain_id]
          );
          if (domains.length === 0) {
            return res.status(400).json({ message: 'Invalid domain' });
          }
        }
        updates.push('domain_id = ?');
        values.push(domain_id);
      }

      if (level !== undefined) {
        const validLevels = ['beginner', 'intermediate', 'senior', 'principal', 'lead'];
        if (level !== null && !validLevels.includes(level)) {
          return res.status(400).json({ message: 'Invalid level' });
        }
        updates.push('level = ?');
        values.push(level);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      values.push(userId);

      await connection.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'profile_updated', 'User updated their profile']
      );

      // Get updated user
      const [users]: any = await connection.query(
        `SELECT u.id, u.name, u.email, u.role, u.domain_id, u.level, 
         u.subscription_type, u.subscription_status, u.created_at, u.last_login,
         d.id as d_id, d.name as domain_name, d.description as domain_description
         FROM users u
         LEFT JOIN domains d ON u.domain_id = d.id
         WHERE u.id = ?`,
        [userId]
      );

      const user = users[0];
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          domain_id: user.domain_id,
          domain: user.domain_id ? {
            id: user.d_id,
            name: user.domain_name,
            description: user.domain_description,
          } : null,
          level: user.level,
          subscription_type: user.subscription_type,
          subscription_status: user.subscription_status,
          created_at: user.created_at,
          last_login: user.last_login,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


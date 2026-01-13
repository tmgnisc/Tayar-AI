import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { pool } from '../config/database.js';

const router = Router();

// Get user's CV
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const connection = await pool.getConnection();

    try {
      const [cvs]: any = await connection.query(
        `SELECT * FROM user_cvs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );

      if (cvs.length === 0) {
        return res.json({ cv: null });
      }

      // Parse JSON fields
      const cv = cvs[0];
      cv.personal_info = typeof cv.personal_info === 'string' ? JSON.parse(cv.personal_info) : cv.personal_info;
      cv.experience = typeof cv.experience === 'string' ? JSON.parse(cv.experience) : cv.experience;
      cv.education = typeof cv.education === 'string' ? JSON.parse(cv.education) : cv.education;
      cv.skills = typeof cv.skills === 'string' ? JSON.parse(cv.skills) : cv.skills;
      cv.projects = typeof cv.projects === 'string' ? JSON.parse(cv.projects) : cv.projects;
      cv.certifications = typeof cv.certifications === 'string' ? JSON.parse(cv.certifications) : cv.certifications;
      cv.languages = typeof cv.languages === 'string' ? JSON.parse(cv.languages) : cv.languages;

      res.json({ cv });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get CV error:', error);
    res.status(500).json({
      message: 'Failed to get CV',
      error: error.message,
    });
  }
});

// Save/Update CV
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const {
      template,
      personal_info,
      summary,
      experience,
      education,
      skills,
      projects,
      certifications,
      languages,
    } = req.body;

    const connection = await pool.getConnection();

    try {
      // Check if user already has a CV
      const [existing]: any = await connection.query(
        `SELECT id FROM user_cvs WHERE user_id = ?`,
        [userId]
      );

      if (existing.length > 0) {
        // Update existing CV
        await connection.query(
          `UPDATE user_cvs 
           SET template = ?,
               personal_info = ?,
               summary = ?,
               experience = ?,
               education = ?,
               skills = ?,
               projects = ?,
               certifications = ?,
               languages = ?,
               updated_at = NOW()
           WHERE user_id = ?`,
          [
            template || 'modern',
            JSON.stringify(personal_info),
            summary,
            JSON.stringify(experience || []),
            JSON.stringify(education || []),
            JSON.stringify(skills || []),
            JSON.stringify(projects || []),
            JSON.stringify(certifications || []),
            JSON.stringify(languages || []),
            userId,
          ]
        );

        res.json({ message: 'CV updated successfully', cvId: existing[0].id });
      } else {
        // Create new CV
        const [result]: any = await connection.query(
          `INSERT INTO user_cvs 
           (user_id, template, personal_info, summary, experience, education, skills, projects, certifications, languages)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            template || 'modern',
            JSON.stringify(personal_info),
            summary,
            JSON.stringify(experience || []),
            JSON.stringify(education || []),
            JSON.stringify(skills || []),
            JSON.stringify(projects || []),
            JSON.stringify(certifications || []),
            JSON.stringify(languages || []),
          ]
        );

        res.json({ message: 'CV created successfully', cvId: result.insertId });
      }
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Save CV error:', error);
    res.status(500).json({
      message: 'Failed to save CV',
      error: error.message,
    });
  }
});

// Delete CV
router.delete('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const connection = await pool.getConnection();

    try {
      await connection.query(`DELETE FROM user_cvs WHERE user_id = ?`, [userId]);
      res.json({ message: 'CV deleted successfully' });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Delete CV error:', error);
    res.status(500).json({
      message: 'Failed to delete CV',
      error: error.message,
    });
  }
});

export default router;


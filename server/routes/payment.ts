import express from 'express';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createCheckoutSession, getCheckoutSession, stripe } from '../services/stripe';

const router = express.Router();

// Create checkout session (requires authentication)
router.post('/create-checkout-session', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { planType = 'pro' } = req.body;

    if (!['pro', 'enterprise'].includes(planType)) {
      return res.status(400).json({ message: 'Invalid plan type. Must be "pro" or "enterprise"' });
    }

    // Get user email
    const connection = await pool.getConnection();
    try {
      const [users]: any = await connection.query(
        'SELECT email FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userEmail = users[0].email;

      // Create checkout session
      const session = await createCheckoutSession(userId, userEmail, planType);

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'checkout_session_created', `Created Stripe checkout session for ${planType} plan`]
      );

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ 
      message: 'Failed to create checkout session', 
      error: error.message 
    });
  }
});

// Get checkout session status
router.get('/checkout-session/:sessionId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getCheckoutSession(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Verify session belongs to user
    const userId = parseInt(session.metadata?.userId || '0');
    if (userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
    });
  } catch (error: any) {
    console.error('Get checkout session error:', error);
    res.status(500).json({ 
      message: 'Failed to get checkout session', 
      error: error.message 
    });
  }
});

export default router;


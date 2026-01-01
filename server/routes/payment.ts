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

// Manually activate subscription if webhook hasn't fired (fallback)
router.post('/activate-subscription/:sessionId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId!;
    const connection = await pool.getConnection();

    try {
      // Get checkout session from Stripe
      const session = await getCheckoutSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Verify session belongs to user
      const sessionUserId = parseInt(session.metadata?.userId || '0');
      if (sessionUserId !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Check if payment was successful
      if (session.payment_status !== 'paid' || session.status !== 'complete') {
        return res.status(400).json({ 
          message: 'Payment not completed', 
          paymentStatus: session.payment_status,
          status: session.status 
        });
      }

      // Check if subscription already activated
      const [existingSubs]: any = await connection.query(
        'SELECT * FROM subscriptions WHERE transaction_id = ?',
        [session.id]
      );

      if (existingSubs.length > 0) {
        console.log(`[Payment] Subscription already activated for session ${sessionId}`);
        return res.json({ 
          message: 'Subscription already activated',
          alreadyActivated: true 
        });
      }

      // Activate subscription (same logic as webhook)
      const planType = (session.metadata?.planType || 'pro') as 'pro' | 'enterprise';
      const amountFromMetadata = session.metadata?.amount ? Number(session.metadata.amount) : undefined;
      const amount = amountFromMetadata ?? (session.amount_total ? session.amount_total / 100 : planType === 'pro' ? 29 : 40);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Update user subscription
      await connection.query(
        `UPDATE users 
         SET subscription_type = ?,
             subscription_status = 'active',
             subscription_start_date = ?,
             subscription_end_date = ?
         WHERE id = ?`,
        [planType, startDate, endDate, userId]
      );

      // Insert subscription record
      const [insertResult]: any = await connection.query(
        `INSERT INTO subscriptions 
         (user_id, plan_type, amount, status, start_date, end_date, payment_method, transaction_id)
         VALUES (?, ?, ?, 'active', ?, ?, 'stripe', ?)`,
        [
          userId,
          planType,
          amount || (planType === 'pro' ? 29 : 40),
          startDate,
          endDate,
          session.payment_intent?.toString() || session.id,
        ]
      );

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'subscription_activated', `Subscription activated manually: ${planType} plan via Stripe - Session: ${session.id}`]
      );

      console.log(`[Payment] ✅ Manually activated subscription for user ${userId}, plan: ${planType}, amount: $${amount}`);

      res.json({ 
        message: 'Subscription activated successfully',
        planType,
        amount,
        subscriptionId: insertResult.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Activate subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to activate subscription', 
      error: error.message 
    });
  }
});

export default router;


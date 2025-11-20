import express from 'express';
import { pool } from '../config/database';
import { generateInterviewFeedback } from '../services/groq';
import { stripe } from '../services/stripe';

const router = express.Router();

// Vapi webhook endpoint
router.post('/vapi', async (req, res) => {
  try {
    const event = req.body;
    console.log('📞 Vapi webhook event:', event.type);

    // Verify webhook secret if needed
    const webhookSecret = req.headers['x-vapi-secret'];
    if (process.env.VAPI_WEBHOOK_SECRET && webhookSecret !== process.env.VAPI_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (event.type) {
      case 'status-update':
        await handleStatusUpdate(event);
        break;
      case 'function-call':
        await handleFunctionCall(event);
        break;
      case 'end-of-call-report':
        await handleEndOfCallReport(event);
        break;
      case 'conversation-update':
        await handleConversationUpdate(event);
        break;
      default:
        console.log('Unknown event type:', event.type);
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleStatusUpdate(event: any) {
  const { call } = event;
  if (!call?.id) return;

  const connection = await pool.getConnection();
  try {
    // Update interview status based on call status
    await connection.query(
      `UPDATE interviews 
       SET status = CASE 
         WHEN ? = 'ended' THEN 'completed'
         WHEN ? = 'failed' THEN 'cancelled'
         ELSE status
       END
       WHERE vapi_call_id = ?`,
      [call.status, call.status, call.id]
    );
  } finally {
    connection.release();
  }
}

async function handleFunctionCall(event: any) {
  // Handle function calls from Vapi if needed
  console.log('Function call:', event);
}

async function handleEndOfCallReport(event: any) {
  const { call } = event;
  if (!call?.id) return;

  const connection = await pool.getConnection();
  try {
    // Get interview associated with this call
    const [interviews]: any = await connection.query(
      'SELECT * FROM interviews WHERE vapi_call_id = ?',
      [call.id]
    );

    if (interviews.length === 0) {
      console.warn('No interview found for call:', call.id);
      return;
    }

    const interview = interviews[0];
    const transcript = call.transcript || call.recording?.transcript || '';

    // Update interview with transcript and recording URL
    await connection.query(
      `UPDATE interviews 
       SET conversation_transcript = ?,
           vapi_recording_url = ?,
           duration_minutes = ?,
           completed_at = NOW(),
           status = 'completed'
       WHERE id = ?`,
      [
        transcript,
        call.recordingUrl || null,
        Math.round((call.endedAt - call.startedAt) / 60000), // Duration in minutes
        interview.id,
      ]
    );

    // Generate feedback using Gemini if transcript is available
    if (transcript) {
      try {
        const feedback = await generateInterviewFeedback(transcript, {
          role: interview.role,
          difficulty: interview.difficulty,
          language: interview.language,
        });

        // Update overall score
        await connection.query(
          'UPDATE interviews SET overall_score = ? WHERE id = ?',
          [feedback.overallScore, interview.id]
        );

        // Save feedback categories
        for (const item of feedback.feedback) {
          await connection.query(
            `INSERT INTO interview_feedback (interview_id, category, score, feedback)
             VALUES (?, ?, ?, ?)`,
            [interview.id, item.category, item.score, item.comment]
          );
        }

        console.log('✅ Interview feedback generated for interview:', interview.id);
      } catch (error: any) {
        console.error('Error generating feedback:', error);
      }
    }
  } finally {
    connection.release();
  }
}

async function handleConversationUpdate(event: any) {
  const { call, message } = event;
  if (!call?.id || !message) return;

  // Optionally store conversation updates in real-time
  console.log('Conversation update:', message);
}

// Stripe webhook endpoint
// Note: This endpoint must use raw body for signature verification
// The raw body middleware is applied in server/index.ts
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('💳 Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log('Unhandled Stripe event type:', event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Stripe webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleCheckoutSessionCompleted(session: any) {
  const userId = parseInt(session.metadata?.userId || '0');
  const planType = (session.metadata?.planType || 'pro') as 'pro' | 'enterprise';

  if (!userId) {
    console.error('User ID not found in session metadata');
    return;
  }

  const connection = await pool.getConnection();
  try {
    // Calculate subscription dates (monthly subscription)
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

    // Create subscription record
    await connection.query(
      `INSERT INTO subscriptions 
       (user_id, plan_type, amount, status, start_date, end_date, payment_method, transaction_id)
       VALUES (?, ?, ?, 'active', ?, ?, 'stripe', ?)`,
      [
        userId,
        planType,
        29.00, // $29 for pro plan
        startDate,
        endDate,
        session.id,
      ]
    );

    // Log activity
    await connection.query(
      'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
      [userId, 'subscription_activated', `Subscription activated: ${planType} plan via Stripe`]
    );

    console.log(`✅ Subscription activated for user ${userId}, plan: ${planType}`);
  } finally {
    connection.release();
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  const userId = parseInt(subscription.metadata?.userId || '0');
  const planType = (subscription.metadata?.planType || 'pro') as 'pro' | 'enterprise';

  if (!userId) {
    console.error('User ID not found in subscription metadata');
    return;
  }

  const connection = await pool.getConnection();
  try {
    const startDate = new Date(subscription.current_period_start * 1000);
    const endDate = new Date(subscription.current_period_end * 1000);
    const status = subscription.status === 'active' ? 'active' : 'cancelled';

    // Update user subscription
    await connection.query(
      `UPDATE users 
       SET subscription_type = ?,
           subscription_status = ?,
           subscription_start_date = ?,
           subscription_end_date = ?
       WHERE id = ?`,
      [planType, status, startDate, endDate, userId]
    );

    console.log(`✅ Subscription updated for user ${userId}, status: ${status}`);
  } finally {
    connection.release();
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  const userId = parseInt(subscription.metadata?.userId || '0');

  if (!userId) {
    console.error('User ID not found in subscription metadata');
    return;
  }

  const connection = await pool.getConnection();
  try {
    // Update user subscription to cancelled
    await connection.query(
      `UPDATE users 
       SET subscription_status = 'cancelled'
       WHERE id = ?`,
      [userId]
    );

    // Update subscription record
    await connection.query(
      `UPDATE subscriptions 
       SET status = 'cancelled'
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    // Log activity
    await connection.query(
      'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
      [userId, 'subscription_cancelled', 'Subscription cancelled via Stripe']
    );

    console.log(`✅ Subscription cancelled for user ${userId}`);
  } finally {
    connection.release();
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) {
    return;
  }

  // Retrieve subscription to get user ID
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = parseInt(subscription.metadata?.userId || '0');
    const planType = (subscription.metadata?.planType || 'pro') as 'pro' | 'enterprise';

    if (!userId) {
      return;
    }

    const connection = await pool.getConnection();
    try {
      // Update subscription end date (renewal)
      const endDate = new Date(subscription.current_period_end * 1000);
      
      await connection.query(
        `UPDATE users 
         SET subscription_end_date = ?,
             subscription_status = 'active'
         WHERE id = ?`,
        [endDate, userId]
      );

      // Create new subscription record for renewal
      await connection.query(
        `INSERT INTO subscriptions 
         (user_id, plan_type, amount, status, start_date, end_date, payment_method, transaction_id)
         VALUES (?, ?, ?, 'active', NOW(), ?, 'stripe', ?)`,
        [
          userId,
          planType,
          29.00,
          endDate,
          invoice.id,
        ]
      );

      console.log(`✅ Subscription renewed for user ${userId}`);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) {
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = parseInt(subscription.metadata?.userId || '0');

    if (!userId) {
      return;
    }

    const connection = await pool.getConnection();
    try {
      // Log payment failure
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'payment_failed', 'Subscription payment failed via Stripe']
      );

      console.log(`⚠️ Payment failed for user ${userId}`);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error handling invoice payment failed:', error);
  }
}

export default router;


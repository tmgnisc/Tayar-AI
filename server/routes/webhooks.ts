import express from 'express';
import { pool } from '../config/database';
import { generateInterviewFeedback } from '../services/gemini';

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

export default router;


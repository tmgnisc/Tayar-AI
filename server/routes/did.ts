import express from 'express';
import { generateTalkingHead, checkTalkStatus } from '../services/didService.js';

const router = express.Router();

/**
 * POST /api/did/generate
 * Generate a talking head video
 */
router.post('/generate', async (req, res) => {
  try {
    const { text, sourceImage, voice } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('[D-ID Route] Generating video for text length:', text.length);

    const result = await generateTalkingHead(text, sourceImage, voice);

    if (result.status === 'error') {
      return res.status(500).json({
        error: result.error || 'Failed to generate video',
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('[D-ID Route] Generate error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/did/status/:talkId
 * Check status of video generation
 */
router.get('/status/:talkId', async (req, res) => {
  try {
    const { talkId } = req.params;

    if (!talkId) {
      return res.status(400).json({ error: 'Talk ID is required' });
    }

    const result = await checkTalkStatus(talkId);

    if (result.status === 'error') {
      return res.status(500).json({
        error: result.error || 'Failed to check status',
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('[D-ID Route] Status check error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

export default router;


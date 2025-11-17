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
        'SELECT subscription_type, subscription_status, avatar_url FROM users WHERE id = ?',
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
        user: {
          avatar_url: users[0]?.avatar_url || null,
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
      // Get user info including domain and level for interview
      const [users]: any = await connection.query(
        `SELECT u.name, u.email, u.domain_id, u.level,
         d.name as domain_name, d.description as domain_description
         FROM users u
         LEFT JOIN domains d ON u.domain_id = d.id
         WHERE u.id = ?`,
        [userId]
      );
      const user = users[0];

      // Use user's domain and level if available, otherwise use provided role/difficulty
      const interviewRole = user.domain_name || role;
      
      // Map user level to interview difficulty
      let interviewDifficulty = difficulty;
      if (user.level) {
        const levelMap: Record<string, string> = {
          'beginner': 'beginner',
          'intermediate': 'intermediate',
          'senior': 'advanced',
          'principal': 'expert',
          'lead': 'expert',
        };
        interviewDifficulty = levelMap[user.level] || difficulty;
      }

      // Create interview record
      const [result]: any = await connection.query(
        'INSERT INTO interviews (user_id, role, difficulty, language) VALUES (?, ?, ?, ?)',
        [userId, interviewRole, interviewDifficulty, language]
      );

      const interviewId = result.insertId;

      // Log activity
      await connection.query(
        'INSERT INTO activity_logs (user_id, activity_type, description) VALUES (?, ?, ?)',
        [userId, 'interview_started', `Started interview for role: ${role}`]
      );

      res.status(201).json({
        message: 'Interview started',
        interviewId,
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

      // If Vapi call is not initialized, return a response indicating that
      // The frontend can handle this gracefully
      if (!interview.vapi_call_id) {
        return res.status(200).json({
          callId: null,
          assistantId: null,
          publicKey: process.env.VAPI_API_KEY, // Still return API key so frontend can try to create call
          message: 'Vapi call not initialized - may still be in progress',
        });
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

// Retry/Initialize Vapi call for an existing interview
router.post('/interviews/:id/initialize-vapi', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const interviewId = parseInt(req.params.id);

    try {
      // Get interview details
      const [interviews]: any = await connection.query(
        `SELECT i.*, u.name as user_name, u.email, d.name as domain_name, d.description as domain_description
         FROM interviews i
         JOIN users u ON i.user_id = u.id
         LEFT JOIN domains d ON u.domain_id = d.id
         WHERE i.id = ? AND i.user_id = ?`,
        [interviewId, userId]
      );

      if (interviews.length === 0) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      const interview = interviews[0];

      // Validate interview data
      if (!interview.role || !interview.difficulty) {
        return res.status(400).json({
          message: 'Interview data incomplete',
          error: 'Missing role or difficulty',
          interview: {
            id: interview.id,
            role: interview.role,
            difficulty: interview.difficulty,
          },
        });
      }

      // Check if Vapi call already exists
      if (interview.vapi_call_id) {
        return res.json({
          message: 'Vapi call already initialized',
          callId: interview.vapi_call_id,
          assistantId: interview.vapi_assistant_id,
        });
      }

      // Check if VAPI_API_KEY is configured
      if (!process.env.VAPI_API_KEY) {
        return res.status(500).json({
          message: 'Vapi API key not configured',
          error: 'VAPI_API_KEY environment variable is missing',
        });
      }

      // Initialize Vapi call
      let vapiCallId: string | null = null;
      let vapiAssistantId: string | null = null;

      try {
        const { createVapiAssistant, createVapiWebCall } = await import('../services/vapi');
        
        console.log(`[Vapi] Retrying initialization for interview ${interviewId}...`);
        console.log(`[Vapi] Interview data:`, {
          role: interview.role,
          difficulty: interview.difficulty,
          userName: interview.user_name,
          domainName: interview.domain_name,
          domainDescription: interview.domain_description,
        });
        
        // Create assistant
        const assistantId = await createVapiAssistant({
          interviewId,
          userId,
          role: interview.role || 'Software Engineer',
          difficulty: interview.difficulty || 'intermediate',
          userName: interview.user_name || null,
          domainName: interview.domain_name || interview.role,
          domainDescription: interview.domain_description || null,
        });

        console.log(`[Vapi] Assistant created: ${assistantId}`);

        // Create call
        const vapiCall = await createVapiWebCall({
          interviewId,
          userId,
          role: interview.role,
          difficulty: interview.difficulty,
          userName: interview.user_name,
          assistantId: assistantId,
        });

        vapiCallId = vapiCall.id;
        vapiAssistantId = assistantId;

        console.log(`[Vapi] Call created: ${vapiCallId}`);

        // Update interview with Vapi call ID and assistant ID
        await connection.query(
          'UPDATE interviews SET vapi_call_id = ?, vapi_assistant_id = ? WHERE id = ?',
          [vapiCallId, vapiAssistantId, interviewId]
        );

        res.json({
          message: 'Vapi call initialized successfully',
          callId: vapiCallId,
          assistantId: vapiAssistantId,
        });
      } catch (vapiError: any) {
        console.error('[Vapi] Retry initialization error:', vapiError.message || vapiError);
        console.error('[Vapi] Error details:', vapiError.response?.data || vapiError.stack);
        console.error('[Vapi] Full error object:', JSON.stringify(vapiError, null, 2));
        
        // Get more detailed error information
        let errorMessage = vapiError.message || 'Unknown error';
        let errorDetails = null;
        
        if (vapiError.response) {
          errorDetails = vapiError.response.data || {
            status: vapiError.response.status,
            statusText: vapiError.response.statusText,
            headers: vapiError.response.headers,
          };
          
          // Format error message better
          if (typeof vapiError.response.data === 'object') {
            errorMessage = vapiError.response.data.message || 
                          vapiError.response.data.error || 
                          errorMessage;
          } else if (typeof vapiError.response.data === 'string') {
            errorMessage = vapiError.response.data;
          }
        }
        
        res.status(500).json({
          message: 'Failed to initialize Vapi call',
          error: errorMessage,
          details: errorDetails,
          stack: process.env.NODE_ENV === 'development' ? vapiError.stack : undefined,
        });
      }
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('[Initialize Vapi] Outer catch error:', error);
    console.error('[Initialize Vapi] Error stack:', error.stack);
    console.error('[Initialize Vapi] Full error:', JSON.stringify(error, null, 2));
    
    // Check if connection was released
    if (!error.connectionReleased) {
      try {
        const connection = await pool.getConnection();
        connection.release();
      } catch (releaseError) {
        // Ignore release errors
      }
    }
    
    res.status(500).json({ 
      message: 'Server error during Vapi initialization', 
      error: error.message,
      type: error.name || 'Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Start interview conversation - get first question
router.post('/interviews/:id/start-conversation', async (req: AuthRequest, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const userId = req.userId!;
    const interviewId = parseInt(req.params.id);

    // console.log(`[Start Conversation] Starting conversation for interview ${interviewId}, user ${userId}`);

    // Get interview details
    // Note: interviews.role contains the domain name, not a domain_id
    const [interviews]: any = await connection.query(
      `SELECT i.*
       FROM interviews i
       WHERE i.id = ? AND i.user_id = ?`,
      [interviewId, userId]
    );

    if (interviews.length === 0) {
      console.log(`[Start Conversation] Interview ${interviewId} not found for user ${userId}`);
      return res.status(404).json({ message: 'Interview not found' });
    }

    const interview = interviews[0];
    // console.log(`[Start Conversation] Interview found:`, {
    //   role: interview.role,
    //   difficulty: interview.difficulty,
    //   language: interview.language,
    // });

    // Get user name
    const [users]: any = await connection.query(
      'SELECT name FROM users WHERE id = ?',
      [userId]
    );
    const userName = users[0]?.name || null;

    // Get domain information by name (interview.role contains the domain name)
    let domainName = interview.role;
    let domainDescription = null;
    
    if (interview.role) {
      const [domains]: any = await connection.query(
        'SELECT name, description FROM domains WHERE name = ?',
        [interview.role]
      );
      if (domains.length > 0) {
        domainName = domains[0].name;
        domainDescription = domains[0].description;
      }
    }

    // Get first question from static JSON data
    // console.log('[Start Conversation] Loading questions from JSON...');
    const { getFirstQuestion, getGreetingMessage } = await import('../services/interviewService');
    
    const firstQuestion = getFirstQuestion(domainName || interview.role, interview.difficulty);
    
    if (!firstQuestion) {
      return res.status(404).json({
        message: 'No questions found for this domain and level',
        error: `No questions available for ${domainName || interview.role} at ${interview.difficulty} level`,
      });
    }

    const greeting = getGreetingMessage(userName, domainName, interview.difficulty);
    const message = `${greeting} ${firstQuestion.question}`;
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[Start Conversation] Success! Question ID: ${firstQuestion.id}`);

    res.json({
      message,
      conversationId,
      questionId: firstQuestion.id,
      question: firstQuestion.question,
    });
  } catch (error: any) {
    console.error('[Start Conversation] Error:', error);
    console.error('[Start Conversation] Error stack:', error.stack);
    console.error('[Start Conversation] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    // Provide more specific error messages
    let errorMessage = error.message || 'Unknown error';
    if (error.message?.includes('keyNumber')) {
      errorMessage = 'Configuration error: Please restart the server.';
    } else if (error.code === 'ENOENT') {
      errorMessage = 'Questions file not found. Please ensure interview-questions.json exists.';
    } else if (error.message?.includes('JSON')) {
      errorMessage = 'Invalid questions file format. Please check interview-questions.json.';
    }
    
    res.status(500).json({
      message: 'Failed to start interview conversation',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Continue interview conversation - process answer and get next question
router.post('/interviews/:id/continue-conversation', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const interviewId = parseInt(req.params.id);
    const { conversationHistory } = req.body;

    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({ message: 'conversationHistory must be an array' });
    }

    try {
      // Get interview details
      // Note: interviews.role contains the domain name, not a domain_id
      const [interviews]: any = await connection.query(
        `SELECT i.*
         FROM interviews i
         WHERE i.id = ? AND i.user_id = ?`,
        [interviewId, userId]
      );

      if (interviews.length === 0) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      const interview = interviews[0];

      // Get user name
      const [users]: any = await connection.query(
        'SELECT name FROM users WHERE id = ?',
        [userId]
      );
      const userName = users[0]?.name || null;

      // Get domain information by name (interview.role contains the domain name)
      let domainName = interview.role;
      let domainDescription = null;
      
      if (interview.role) {
        const [domains]: any = await connection.query(
          'SELECT name, description FROM domains WHERE name = ?',
          [interview.role]
        );
        if (domains.length > 0) {
          domainName = domains[0].name;
          domainDescription = domains[0].description;
        }
      }

      // Process answer and get next question from static JSON
      const { 
        getNextQuestionByKeywords, 
        evaluateAnswer, 
        getQuestions,
        checkProfanity,
        checkOffTopic,
        checkLowKnowledge,
      } = await import('../services/interviewService');
      
      // Get the last user message (their answer)
      const lastUserMessage = conversationHistory
        .filter(msg => msg.role === 'user')
        .pop()?.text || '';
      
      // Get the current question ID from request
      const { currentQuestionId } = req.body;
      
      if (!currentQuestionId) {
        return res.status(400).json({ 
          message: 'Current question ID is required',
          error: 'Please provide currentQuestionId in the request body'
        });
      }

      // Count questions asked so far
      // Count user answers - each user answer means a question was asked and answered
      // The current answer being processed is included in the count
      const userAnswers = conversationHistory.filter(msg => msg.role === 'user').length;
      const questionsAnswered = userAnswers; // This includes the current answer being processed
      const MAX_QUESTIONS = 5;

      // Get questions list first (needed for report generation)
      const questions = getQuestions(domainName || interview.role, interview.difficulty);

      // Check if we've reached the maximum number of questions
      // If we've answered 5 questions, we're done (the 5th answer is being processed now)
      if (questionsAnswered >= MAX_QUESTIONS) {
        // Generate and return report
        const { generateInterviewReport } = await import('../services/reportService');
        
        // Get all stored answers from interview_feedback
        const [feedbacks]: any = await connection.query(
          'SELECT * FROM interview_feedback WHERE interview_id = ? ORDER BY id',
          [interviewId]
        );
        
        // Reconstruct answer analysis
        const answers = feedbacks.map((fb: any) => {
          const qId = parseInt(fb.category.replace('Question ', '')) || 0;
          const question = questions.find(q => q.id === qId);
          const isOffTopic = fb.feedback?.includes('Off-topic') || false;
          const keywordsMatched = fb.feedback?.match(/Keywords matched: (.+)/)?.[1]?.split(', ') || [];
          
          return {
            questionId: qId,
            question: question?.question || '',
            answer: '',
            score: parseFloat(fb.score),
            keywordsMatched: keywordsMatched.filter((k: string) => k && k !== 'None'),
            isOffTopic,
            isLowKnowledge: false,
            hasProfanity: false,
            feedback: fb.feedback || '',
          };
        });
        
        const report = await generateInterviewReport(interviewId, userId, answers);
        
        return res.json({
          message: "Thank you for your time today! You've completed all 5 questions. Great job on the interview practice!",
          questionId: null,
          evaluation: {
            score: report.averageScore,
            feedback: `Overall Rating: ${report.overallRating}`,
          },
          interviewComplete: true,
          report: report,
        });
      }

      // Get current question to evaluate answer
      const currentQuestion = questions.find(q => q.id === currentQuestionId);
      
      if (!currentQuestion) {
        return res.status(404).json({ 
          message: 'Question not found',
          error: `Question with ID ${currentQuestionId} not found`
        });
      }

      // Check for profanity/abusive language
      if (checkProfanity(lastUserMessage)) {
        return res.json({
          message: "I understand you may be frustrated, but let's keep our conversation professional. Please focus on answering the technical questions. Let me ask you again: " + currentQuestion.question,
          questionId: currentQuestionId, // Ask the same question again
          question: currentQuestion.question,
          evaluation: {
            score: 0,
            feedback: 'Please maintain a professional tone during the interview.',
          },
          interviewComplete: false,
        });
      }

      // Check if answer is off-topic (if answer doesn't contain ANY keywords)
      const isOffTopic = checkOffTopic(lastUserMessage, currentQuestion.keywords);
      
      if (isOffTopic) {
        // Store this answer as off-topic for report
        await connection.query(
          `INSERT INTO interview_feedback (interview_id, category, score, feedback)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE score = ?, feedback = ?`,
          [
            interviewId,
            `Question ${currentQuestionId}`,
            0,
            'Off-topic: Answer did not contain relevant keywords',
            0,
            'Off-topic: Answer did not contain relevant keywords',
          ]
        );
        
        return res.json({
          message: "I appreciate your question, but let's focus on the current topic. Please answer the question I asked about the technical concepts. ",
          questionId: currentQuestionId, // Ask the same question again
          question: currentQuestion.question,
          evaluation: {
            score: 0,
            feedback: 'Please stay on topic and answer the question asked. Your answer should include relevant keywords from the question.',
          },
          interviewComplete: false,
        });
      }

      // Evaluate the answer
      const evaluation = evaluateAnswer(
        lastUserMessage,
        currentQuestion.expectedAnswers,
        currentQuestion.expectedSummary,
        currentQuestion.keywords
      );
      
      // Check which keywords were matched
      const answerLower = lastUserMessage.toLowerCase();
      const keywordsMatched = currentQuestion.keywords.filter(keyword =>
        answerLower.includes(keyword.toLowerCase())
      );
      
      // Store answer analysis for report generation
      const hasProfanity = checkProfanity(lastUserMessage);
      const isLowKnowledgeAnswer = checkLowKnowledge(
        lastUserMessage,
        currentQuestion.lowKnowledgePhrases
      );
      
      await connection.query(
        `INSERT INTO interview_feedback (interview_id, category, score, feedback)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE score = ?, feedback = ?`,
        [
          interviewId,
          `Question ${currentQuestionId}`,
          evaluation.score,
          `${evaluation.feedback} Keywords matched: ${keywordsMatched.join(', ') || 'None'}`,
          evaluation.score,
          `${evaluation.feedback} Keywords matched: ${keywordsMatched.join(', ') || 'None'}`,
        ]
      );

      // Get next question based on keywords in user's answer (keyword-based routing)
      const nextQuestionResult = getNextQuestionByKeywords(
        domainName || interview.role,
        interview.difficulty,
        currentQuestionId,
        lastUserMessage
      );

      const { question: nextQuestion, isLowKnowledge: nextIsLowKnowledge, lowKnowledgeReply } = nextQuestionResult;

      // Check if we've reached max questions (after answering this one)
      // We've already answered questionsAnswered questions, so after this answer we'll have answered questionsAnswered questions
      // But we check if the NEXT question would exceed max
      const willExceedMax = questionsAnswered >= MAX_QUESTIONS;

      if (!nextQuestion || willExceedMax) {
        // Interview is complete - generate report
        const { generateInterviewReport } = await import('../services/reportService');
        
        // Get all stored answers from interview_feedback
        const [feedbacks]: any = await connection.query(
          'SELECT * FROM interview_feedback WHERE interview_id = ? ORDER BY id',
          [interviewId]
        );
        
        // Reconstruct answer analysis from stored data
        const answers = feedbacks.map((fb: any) => {
          const qId = parseInt(fb.category.replace('Question ', '')) || 0;
          const question = questions.find(q => q.id === qId);
          const isOffTopic = fb.feedback?.includes('Off-topic') || false;
          const keywordsMatched = fb.feedback?.match(/Keywords matched: (.+)/)?.[1]?.split(', ') || [];
          
          return {
            questionId: qId,
            question: question?.question || '',
            answer: '', // Not stored, but we have the feedback
            score: parseFloat(fb.score),
            keywordsMatched: keywordsMatched.filter((k: string) => k && k !== 'None'),
            isOffTopic,
            isLowKnowledge: false, // Would need to store this
            hasProfanity: false, // Would need to store this
            feedback: fb.feedback || '',
          };
        });
        
        // Add current answer
        const answerLower = lastUserMessage.toLowerCase();
        const keywordsMatched = currentQuestion.keywords.filter(keyword =>
          answerLower.includes(keyword.toLowerCase())
        );
        
        answers.push({
          questionId: currentQuestionId,
          question: currentQuestion.question,
          answer: lastUserMessage,
          score: evaluation.score,
          keywordsMatched,
          isOffTopic: false,
          isLowKnowledge: isLowKnowledgeAnswer,
          hasProfanity: checkProfanity(lastUserMessage),
          feedback: evaluation.feedback,
        });
        
        const report = await generateInterviewReport(interviewId, userId, answers);
        
        let completionMessage = "Thank you for your time today! You've completed all 5 questions. Great job on the interview practice!";
        
        // If low knowledge was detected and there's a reply, use it
        if (nextIsLowKnowledge && lowKnowledgeReply) {
          completionMessage = lowKnowledgeReply;
        }

        res.json({
          message: completionMessage,
          questionId: null,
          evaluation: {
            score: evaluation.score,
            feedback: evaluation.feedback,
          },
          interviewComplete: true,
          report: report,
        });
        return;
      }

      // Build the message
      let message = '';
      if (nextIsLowKnowledge && lowKnowledgeReply) {
        // Use low knowledge reply and then ask next question
        message = `${lowKnowledgeReply} ${nextQuestion.question}`;
      } else {
        // Use normal feedback and ask next question
        const feedbackMessage = evaluation.feedback;
        message = `${feedbackMessage} ${nextQuestion.question}`;
      }

      res.json({
        message,
        questionId: nextQuestion.id,
        question: nextQuestion.question,
        evaluation: {
          score: evaluation.score,
          feedback: evaluation.feedback,
        },
        interviewComplete: false,
      });
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Continue conversation error:', error);
    res.status(500).json({
      message: 'Failed to continue interview conversation',
      error: error.message,
    });
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
      const { overallScore: providedScore } = req.body;

      // Update interview with transcript
      await connection.query(
        `UPDATE interviews 
         SET conversation_transcript = ?,
             vapi_recording_url = ?,
             duration_minutes = ?,
             overall_score = ?,
             completed_at = NOW(),
             status = 'completed'
         WHERE id = ?`,
        [transcript || null, recordingUrl || null, duration || null, providedScore || null, interviewId]
      );

      // Note: Feedback is already calculated from static question evaluation
      // The overallScore is provided by the frontend based on question scores
      // No AI feedback generation needed for static interview system
      console.log('✅ Interview transcript saved for interview:', interviewId);

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
          `SELECT u.id, u.name, u.email, u.role, u.domain_id, u.level, u.avatar_url,
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
      console.log('[Profile API] Returning user avatar_url:', user.avatar_url);
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
          avatar_url: user.avatar_url || null,
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
    const { name, domain_id, level, avatar_url } = req.body;

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

      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatar_url);
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
        `SELECT u.id, u.name, u.email, u.role, u.domain_id, u.level, u.avatar_url,
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
          avatar_url: user.avatar_url,
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

// Upload profile image to Cloudinary
router.post('/profile/upload-image', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { image } = req.body; // Base64 image string

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing. Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
      return res.status(500).json({ 
        message: 'Image upload service not configured', 
        error: 'Please configure Cloudinary environment variables' 
      });
    }

    // Upload to Cloudinary
    const { uploadImageFromBase64 } = await import('../services/cloudinary');
    
    try {
      const result = await uploadImageFromBase64(image, 'sdc');
      
      // Update user's avatar_url in database
      const connection = await pool.getConnection();
      try {
        const [updateResult]: any = await connection.query(
          'UPDATE users SET avatar_url = ? WHERE id = ?',
          [result.url, userId]
        );
        
        res.json({
          message: 'Image uploaded successfully',
          avatar_url: result.url,
        });
      } finally {
        connection.release();
      }
    } catch (error: any) {
      res.status(500).json({ 
        message: 'Failed to upload image', 
        error: error.message 
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get interview report
router.get('/interviews/:id/report', async (req: AuthRequest, res) => {
  try {
    const connection = await pool.getConnection();
    const userId = req.userId!;
    const interviewId = parseInt(req.params.id);

    try {
      // Verify interview belongs to user
      const [interviews]: any = await connection.query(
        'SELECT * FROM interviews WHERE id = ? AND user_id = ?',
        [interviewId, userId]
      );

      if (interviews.length === 0) {
        return res.status(404).json({ message: 'Interview not found' });
      }

      const { getInterviewReport } = await import('../services/reportService');
      const report = await getInterviewReport(interviewId, userId);

      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }

      res.json(report);
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


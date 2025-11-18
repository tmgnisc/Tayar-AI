import { pool } from '../config/database';

interface AnswerAnalysis {
  questionId: number;
  question: string;
  answer: string;
  score: number;
  keywordsMatched: string[];
  expectedKeywords: string[];
  accuracy?: number;
  isOffTopic: boolean;
  isLowKnowledge: boolean;
  hasProfanity: boolean;
  feedback: string;
}

interface InterviewReport {
  interviewId: number;
  totalQuestions: number;
  questionsAnswered: number;
  averageScore: number;
  offTopicCount: number;
  lowKnowledgeCount: number;
  profanityCount: number;
  keywordAccuracy: number; // Percentage of questions with keyword matches
  overallRating: string; // Excellent, Good, Fair, Poor
  detailedAnalysis: AnswerAnalysis[];
  recommendations: string[];
  topicsToCover: string[];
}

/**
 * Generate comprehensive interview report
 */
export async function generateInterviewReport(
  interviewId: number,
  userId: number,
  answers: AnswerAnalysis[]
): Promise<InterviewReport> {
  const connection = await pool.getConnection();
  
  try {
    // Get interview details
    const [interviews]: any = await connection.query(
      `SELECT i.*, d.name as domain_name, d.description as domain_description
       FROM interviews i
       LEFT JOIN domains d ON i.role = d.name
       WHERE i.id = ? AND i.user_id = ?`,
      [interviewId, userId]
    );

    if (interviews.length === 0) {
      throw new Error('Interview not found');
    }

    const interview = interviews[0];
    const totalQuestions = answers.length || 5; // Default to 5 if no answers yet
    const enrichedAnswers = answers.map(answer => {
      const expectedKeywords = answer.expectedKeywords || [];
      const matchedCount = answer.keywordsMatched?.length || 0;
      const accuracy = expectedKeywords.length > 0
        ? Math.round((matchedCount / expectedKeywords.length) * 100)
        : (matchedCount > 0 ? 100 : 0);
      return {
        ...answer,
        expectedKeywords,
        accuracy,
      };
    });
    
    // Calculate statistics
    const totalScore = enrichedAnswers.reduce((sum, a) => sum + a.score, 0);
    const averageScore = enrichedAnswers.length > 0 ? Math.round(totalScore / enrichedAnswers.length) : 0;
    
    const offTopicCount = enrichedAnswers.filter(a => a.isOffTopic).length;
    const lowKnowledgeCount = enrichedAnswers.filter(a => a.isLowKnowledge).length;
    const profanityCount = enrichedAnswers.filter(a => a.hasProfanity).length;
    
    // Calculate keyword accuracy (average percentage of keywords matched)
    const keywordAccuracy = enrichedAnswers.length > 0 
      ? Math.round(
          enrichedAnswers.reduce((sum, a) => sum + (a.accuracy || 0), 0) / enrichedAnswers.length
        )
      : 0;

    // Determine overall rating
    let overallRating: string;
    if (averageScore >= 80 && keywordAccuracy >= 80 && offTopicCount === 0) {
      overallRating = 'Excellent';
    } else if (averageScore >= 60 && keywordAccuracy >= 60 && offTopicCount <= 1) {
      overallRating = 'Good';
    } else if (averageScore >= 40 && keywordAccuracy >= 40) {
      overallRating = 'Fair';
    } else {
      overallRating = 'Poor';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (offTopicCount > 0) {
      recommendations.push(
        `You went off-topic ${offTopicCount} time(s). Focus on answering the specific question asked and include relevant keywords.`
      );
    }
    
    if (lowKnowledgeCount > 0) {
      recommendations.push(
        `You indicated low knowledge on ${lowKnowledgeCount} question(s). Consider reviewing the fundamentals of this domain.`
      );
    }
    
    if (profanityCount > 0) {
      recommendations.push(
        `Please maintain a professional tone during interviews. Inappropriate language was detected ${profanityCount} time(s).`
      );
    }
    
    if (keywordAccuracy < 50) {
      recommendations.push(
        `Your answers lacked relevant keywords. Try to include technical terms and concepts related to the questions.`
      );
    }
    
    if (averageScore < 60) {
      recommendations.push(
        `Your average score was ${averageScore}%. Focus on providing more detailed and accurate answers.`
      );
    } else if (averageScore >= 80) {
      recommendations.push(
        `Great job! You scored ${averageScore}% on average. Keep up the good work!`
      );
    }

    // Identify topics to cover based on low scores and missing keywords
    const topicsToCover: string[] = [];
    const lowScoreAnswers = enrichedAnswers.filter(a => a.score < 60 && !a.isOffTopic);
    
    for (const answer of lowScoreAnswers) {
      // Extract topic from question
      const questionWords = answer.question.toLowerCase().split(/\s+/);
      const importantWords = questionWords.filter(w => 
        w.length > 4 && 
        !['what', 'is', 'are', 'the', 'and', 'for', 'with', 'about', 'how', 'why'].includes(w)
      );
      
      if (importantWords.length > 0) {
        const topic = importantWords[0].charAt(0).toUpperCase() + importantWords[0].slice(1);
        if (!topicsToCover.includes(topic)) {
          topicsToCover.push(topic);
        }
      }
    }

    // If no specific topics identified, suggest general improvement
    if (topicsToCover.length === 0 && averageScore < 70) {
      topicsToCover.push(interview.role || 'General technical concepts');
    }

    const report: InterviewReport = {
      interviewId,
      totalQuestions,
      questionsAnswered: totalQuestions,
      averageScore,
      offTopicCount,
      lowKnowledgeCount,
      profanityCount,
      keywordAccuracy,
      overallRating,
      detailedAnalysis: enrichedAnswers,
      recommendations,
      topicsToCover,
    };

    // Save report to database (store in interview metadata or separate table)
    // For now, we'll update the interview with overall score
    await connection.query(
      `UPDATE interviews 
       SET overall_score = ?,
           status = 'completed',
           completed_at = NOW()
       WHERE id = ?`,
      [averageScore, interviewId]
    );

    return report;
  } finally {
    connection.release();
  }
}

/**
 * Get interview report
 */
export async function getInterviewReport(
  interviewId: number,
  userId: number
): Promise<InterviewReport | null> {
  const connection = await pool.getConnection();
  
  try {
    // Get interview
    const [interviews]: any = await connection.query(
      'SELECT * FROM interviews WHERE id = ? AND user_id = ?',
      [interviewId, userId]
    );

    if (interviews.length === 0) {
      return null;
    }

    // Get feedback entries (these represent the answers)
    const [feedbacks]: any = await connection.query(
      'SELECT * FROM interview_feedback WHERE interview_id = ? ORDER BY id',
      [interviewId]
    );

    // Reconstruct answers from feedback
    const answers: AnswerAnalysis[] = feedbacks.map((fb: any) => {
      let details: any = {};
      if (fb.details) {
        try {
          details = typeof fb.details === 'string' ? JSON.parse(fb.details) : fb.details;
        } catch (error) {
          console.warn('Failed to parse feedback details JSON:', error);
          details = {};
        }
      }

      return {
        questionId: parseInt(fb.category.replace('Question ', '')) || 0,
        question: details.question || '',
        answer: details.answer || '',
        score: parseFloat(fb.score),
        keywordsMatched: Array.isArray(details.keywordsMatched) ? details.keywordsMatched : [],
        expectedKeywords: Array.isArray(details.expectedKeywords) ? details.expectedKeywords : [],
        isOffTopic: !!details.isOffTopic,
        isLowKnowledge: !!details.isLowKnowledge,
        hasProfanity: !!details.hasProfanity,
        feedback: fb.feedback || '',
      };
    });

    // Generate report
    return await generateInterviewReport(interviewId, userId, answers);
  } finally {
    connection.release();
  }
}


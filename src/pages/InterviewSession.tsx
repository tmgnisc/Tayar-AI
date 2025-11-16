import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Square, Phone, Loader2, Volume2, Video, VideoOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";
import { VoiceInterviewService } from "@/services/voiceInterview";

type InterviewStatus = 'idle' | 'connecting' | 'active' | 'ended';
type VoiceStatus = 'idle' | 'listening' | 'speaking' | 'processing';

export default function InterviewSession() {
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>('idle');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState("");
  const [interviewData, setInterviewData] = useState<any>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [questionScores, setQuestionScores] = useState<Array<{ questionId: number; score: number }>>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceServiceRef = useRef<VoiceInterviewService | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get('interviewId');
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (interviewId && token) {
      loadInterviewData();
    }
  }, [interviewId, token]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (interviewStatus === 'active') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [interviewStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.end();
      }
      // Stop camera stream
      if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localVideoStream]);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && localVideoStream) {
      videoRef.current.srcObject = localVideoStream;
    } else if (videoRef.current && !localVideoStream) {
      videoRef.current.srcObject = null;
    }
  }, [localVideoStream]);

  const loadInterviewData = async () => {
    try {
      const response = await apiRequest(`api/user/interviews/${interviewId}`, {}, token);
      if (response.ok) {
        const data = await response.json();
        setInterviewData(data.interview);
      }
    } catch (error) {
      console.error('Error loading interview:', error);
      toast({
        title: "Error",
        description: "Failed to load interview data",
        variant: "destructive",
      });
    }
  };

  const startInterview = async () => {
    if (!interviewId || !token) return;

    try {
      setInterviewStatus('active');
      setIsProcessing(true);

      // Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (mediaError) {
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to start the interview",
          variant: "destructive",
        });
        setInterviewStatus('idle');
        setIsProcessing(false);
        return;
      }

      // Initialize voice service
      const voiceService = new VoiceInterviewService({
        onTranscript: (text: string, isUser: boolean) => {
          setTranscript((prev) => {
            const prefix = isUser ? 'Candidate: ' : 'Interviewer: ';
            return prev + (prev ? '\n\n' : '') + prefix + text;
          });

          // If it's a user message, mark as answering (but don't auto-process)
          // User must click "Done Answering" button to submit
          if (isUser && !isAnswering) {
            setIsAnswering(true);
          }
        },
        onStatusChange: (status) => {
          if (status === 'listening') setVoiceStatus('listening');
          else if (status === 'speaking') setVoiceStatus('speaking');
          else if (status === 'processing') setVoiceStatus('processing');
          else if (status === 'ended') {
            setVoiceStatus('idle');
            setInterviewStatus('ended');
          }
        },
        onError: (error) => {
          console.error('Voice service error:', error);
          toast({
            title: "Error",
            description: error.message || "An error occurred during the interview",
            variant: "destructive",
          });
        },
      });

      voiceServiceRef.current = voiceService;

      // Start voice service
      await voiceService.start();

      // Get first question from backend
      const response = await apiRequest(
        `api/user/interviews/${interviewId}/start-conversation`,
        { method: 'POST' },
        token
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to start interview conversation';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const firstMessage = data.message;
      const questionId = data.questionId;

      // Store current question ID
      if (questionId) {
        setCurrentQuestionId(questionId);
      }

      // Add assistant message to history
      voiceService.addAssistantMessage(firstMessage);

      // Speak the first question
      await voiceService.speak(firstMessage);

      setInterviewStatus('active');
      setIsProcessing(false);
    } catch (error: any) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start interview",
        variant: "destructive",
      });
      setInterviewStatus('idle');
      setIsProcessing(false);
      if (voiceServiceRef.current) {
        voiceServiceRef.current.end();
      }
    }
  };

  const handleDoneAnswering = async () => {
    if (!interviewId || !token || !voiceServiceRef.current || !currentQuestionId || !isAnswering) return;

    setIsAnswering(false);
    setIsProcessing(true);
    setVoiceStatus('processing');

    // Get the last user message from conversation history
    const conversationHistory = voiceServiceRef.current.getConversationHistory();
    const lastUserMessage = conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()?.text || '';

    if (!lastUserMessage) {
      setIsProcessing(false);
      return;
    }

    await processAnswer(lastUserMessage);
  };

  const processAnswer = async (userAnswer: string) => {
    if (!interviewId || !token || !voiceServiceRef.current || !currentQuestionId) return;

    try {

      // Get conversation history
      const conversationHistory = voiceServiceRef.current.getConversationHistory();

      // Send to backend to evaluate answer and get next question
      const response = await apiRequest(
        `api/user/interviews/${interviewId}/continue-conversation`,
        {
          method: 'POST',
          body: JSON.stringify({ 
            conversationHistory,
            currentQuestionId: currentQuestionId,
          }),
        },
        token
      );

      if (!response.ok) {
        throw new Error('Failed to get next question');
      }

      const data = await response.json();
      const nextMessage = data.message;
      const nextQuestionId = data.questionId;
      const evaluation = data.evaluation;
      const interviewComplete = data.interviewComplete;

      // Store score for current question (no toast notification)
      if (evaluation && evaluation.score !== undefined) {
        setQuestionScores(prev => [...prev, { questionId: currentQuestionId, score: evaluation.score }]);
      }

      // Add assistant message to history
      voiceServiceRef.current.addAssistantMessage(nextMessage);

      // Update current question ID
      if (nextQuestionId) {
        setCurrentQuestionId(nextQuestionId);
      }

      // Check if interview is complete
      if (interviewComplete) {
        // Interview is ending
        await voiceServiceRef.current.speak(nextMessage);
        setTimeout(() => {
          handleEndInterview();
        }, 3000);
      } else {
        // Speak the next question
        await voiceServiceRef.current.speak(nextMessage);
        // Reset answering state for the next question
        setIsAnswering(false);
      }

      setIsProcessing(false);
    } catch (error: any) {
      console.error('Error processing answer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process your answer",
        variant: "destructive",
      });
      setIsProcessing(false);
      setVoiceStatus('listening');
      setIsAnswering(false);
    }
  };

  const toggleCamera = async () => {
    try {
      if (isCameraOn) {
        // Turn off camera
        if (localVideoStream) {
          localVideoStream.getTracks().forEach(track => track.stop());
          setLocalVideoStream(null);
        }
        setIsCameraOn(false);
      } else {
        // Turn on camera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            } 
          });
          setLocalVideoStream(stream);
          setIsCameraOn(true);
        } catch (error: any) {
          toast({
            title: "Camera Access Denied",
            description: "Please allow camera access to enable video",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Error toggling camera:', error);
      toast({
        title: "Error",
        description: "Failed to toggle camera",
        variant: "destructive",
      });
    }
  };

  const handleEndInterview = async () => {
    try {
      setInterviewStatus('ended');
      setIsProcessing(true);

      if (voiceServiceRef.current) {
        // Get transcript
        const fullTranscript = voiceServiceRef.current.getTranscript();
        
        // Calculate overall score from question scores
        const overallScore = questionScores.length > 0
          ? Math.round(questionScores.reduce((sum, q) => sum + q.score, 0) / questionScores.length)
          : 0;
        
        // End voice service
        voiceServiceRef.current.end();

        // Save transcript to backend
        if (fullTranscript) {
          try {
            const response = await apiRequest(
              `api/user/interviews/${interviewId}/transcript`,
              {
                method: 'POST',
                body: JSON.stringify({
                  transcript: fullTranscript,
                  duration: Math.floor(duration / 60), // duration in minutes
                  overallScore: overallScore, // Include calculated score
                }),
              },
              token
            );

            if (response.ok) {
              toast({
                title: "Interview Completed",
                description: `Your interview has been saved. Overall Score: ${overallScore}/100. Redirecting to results...`,
              });
            }
          } catch (error) {
            console.error('Error saving transcript:', error);
          }
        }
      }

      setTimeout(() => {
        navigate(`/interview/result?interviewId=${interviewId}`);
      }, 2000);
    } catch (error) {
      console.error('Error ending interview:', error);
      setIsProcessing(false);
    }
  };

  const toggleMute = () => {
    if (!voiceServiceRef.current) return;

    if (isMuted) {
      voiceServiceRef.current.startListening();
      setIsMuted(false);
    } else {
      voiceServiceRef.current.stopListening();
      setIsMuted(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!interviewData) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <div className="text-2xl font-bold mb-2">Loading Interview...</div>
          <div className="text-muted-foreground">Preparing your interview session</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar showAuth={false} showProfile={true} />
      
      {/* Google Meet-like Video Call Interface */}
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Main Video Area - Grid Layout for Interviewer and Candidate */}
        <div className="flex-1 relative bg-black">
          {interviewStatus === 'idle' ? (
            <div className="h-full flex items-center justify-center text-white">
              <div className="space-y-6 text-center">
                <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mx-auto">
                  <Phone className="w-16 h-16 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Ready to start interview</h2>
                  <p className="text-gray-400 mb-6">
                    Role: {interviewData.role} • Difficulty: {interviewData.difficulty}
                  </p>
                  <Button 
                    onClick={startInterview}
                    disabled={isProcessing}
                    size="lg"
                    className="h-12 px-8"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      'Start Interview'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full grid grid-cols-2 gap-1">
              {/* Interviewer (AI) Side - Left */}
              <div className="relative bg-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-40 h-40 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-4">
                    <span className="text-5xl text-white font-semibold">AI</span>
                  </div>
                  <p className="text-gray-400 text-sm">AI Interviewer</p>
                  {voiceStatus === 'speaking' && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-blue-400 text-xs">Speaking...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Candidate Side - Right */}
              <div className="relative bg-gray-800 flex items-center justify-center">
                {isCameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-40 h-40 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl text-white font-semibold">
                        {interviewData?.userName?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">You</p>
                    {voiceStatus === 'listening' && isAnswering && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs">Speaking...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Overlay - Only show when active */}
          {interviewStatus === 'active' && (
            <>
              {/* Timer and Info */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 z-10">
                <div className="text-white text-sm font-medium">{formatDuration(duration)}</div>
                <div className="text-gray-400 text-xs">{interviewData.role} • {interviewData.difficulty}</div>
              </div>

              {/* Processing Indicator */}
              {voiceStatus === 'processing' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 z-10">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span className="text-white text-sm">Processing your answer...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Controls Bar (Google Meet Style) - Always visible when interview is active */}
        {interviewStatus === 'active' && (
          <div className="bg-gray-900 border-t border-gray-800 py-4">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center gap-3">
                {/* Mic Toggle */}
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="lg"
                  className={`rounded-full w-12 h-12 p-0 ${
                    isMuted 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  disabled={isProcessing}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>

                {/* Camera Toggle */}
                <Button
                  onClick={toggleCamera}
                  variant="ghost"
                  size="lg"
                  className={`rounded-full w-12 h-12 p-0 ${
                    isCameraOn 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  disabled={isProcessing}
                  title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                >
                  {isCameraOn ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </Button>

                {/* Done Answering Button - Only show when answering */}
                {isAnswering && (
                  <Button
                    onClick={handleDoneAnswering}
                    size="lg"
                    className="rounded-full bg-green-600 hover:bg-green-700 text-white px-6 h-12"
                    disabled={isProcessing}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Done Answering
                  </Button>
                )}

                {/* End Interview */}
                <Button
                  onClick={handleEndInterview}
                  variant="ghost"
                  size="lg"
                  className="rounded-full w-12 h-12 p-0 bg-red-600 hover:bg-red-700 text-white"
                  disabled={isProcessing}
                  title="End interview"
                >
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Transcript Panel (Collapsible) */}
        {transcript && interviewStatus === 'active' && (
          <div className="bg-gray-800 border-t border-gray-700 max-h-48 overflow-y-auto">
            <div className="container mx-auto px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Live Transcript</h3>
              <div className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                {transcript}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

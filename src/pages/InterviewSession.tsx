import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Square, Phone, Loader2, Volume2 } from "lucide-react";
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
  const [isProcessing, setIsProcessing] = useState(false);
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
    };
  }, []);

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
      setInterviewStatus('connecting');
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

          // If it's a user message, process it and get next question
          if (isUser) {
            handleUserAnswer(text);
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

      // Add assistant message to history
      voiceService.addAssistantMessage(firstMessage);

      // Speak the first question
      await voiceService.speak(firstMessage);

      setInterviewStatus('active');
      setIsProcessing(false);
      toast({
        title: "Interview Started",
        description: "The AI interviewer will ask you questions. Speak clearly!",
      });
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

  const handleUserAnswer = async (userAnswer: string) => {
    if (!interviewId || !token || !voiceServiceRef.current) return;

    try {
      setIsProcessing(true);
      setVoiceStatus('processing');

      // Get conversation history
      const conversationHistory = voiceServiceRef.current.getConversationHistory();

      // Send to backend to get next question
      const response = await apiRequest(
        `api/user/interviews/${interviewId}/continue-conversation`,
        {
          method: 'POST',
          body: JSON.stringify({ conversationHistory }),
        },
        token
      );

      if (!response.ok) {
        throw new Error('Failed to get next question');
      }

      const data = await response.json();
      const nextMessage = data.message;

      // Add assistant message to history
      voiceServiceRef.current.addAssistantMessage(nextMessage);

      // Check if interview is ending
      const lowerMessage = nextMessage.toLowerCase();
      if (lowerMessage.includes('thank you') && 
          (lowerMessage.includes('good luck') || lowerMessage.includes('practice'))) {
        // Interview is ending
        await voiceServiceRef.current.speak(nextMessage);
        setTimeout(() => {
          handleEndInterview();
        }, 3000);
      } else {
        // Speak the next question
        await voiceServiceRef.current.speak(nextMessage);
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
    }
  };

  const handleEndInterview = async () => {
    try {
      setInterviewStatus('ended');
      setIsProcessing(true);

      if (voiceServiceRef.current) {
        // Get transcript
        const fullTranscript = voiceServiceRef.current.getTranscript();
        
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
                }),
              },
              token
            );

            if (response.ok) {
              toast({
                title: "Interview Completed",
                description: "Your interview has been saved. Redirecting to results...",
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
    <div className="min-h-screen gradient-mesh">
      <Navbar showAuth={false} showProfile={true} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Interview Info Card */}
          <Card className="glass-card mb-8 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Technical Interview</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {formatDuration(duration)}
                </span>
              </CardTitle>
              <CardDescription>
                Role: {interviewData.role} | Difficulty: {interviewData.difficulty}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Interview Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="glass-card p-6 border-border/50">
              <div className="flex items-center justify-center gap-4">
                {interviewStatus === 'idle' && (
                  <>
                    <Phone className="w-6 h-6 text-muted-foreground" />
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-lg">Ready to start interview</p>
                      <Button 
                        onClick={startInterview}
                        disabled={isProcessing}
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
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        The AI will ask you questions based on your selected domain and level. 
                        Make sure your microphone is working!
                      </p>
                    </div>
                  </>
                )}
                {interviewStatus === 'connecting' && (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-lg">Connecting to interview...</p>
                  </>
                )}
                {interviewStatus === 'active' && (
                  <>
                    <div className="relative">
                      {voiceStatus === 'listening' && (
                        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                      )}
                      {voiceStatus === 'speaking' && (
                        <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse opacity-75" />
                      )}
                      {voiceStatus === 'listening' ? (
                        <Mic className="w-6 h-6 text-green-500 relative z-10" />
                      ) : voiceStatus === 'speaking' ? (
                        <Volume2 className="w-6 h-6 text-blue-500 relative z-10" />
                      ) : (
                        <Phone className="w-6 h-6 text-primary relative z-10" />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-lg font-semibold">
                        {voiceStatus === 'listening' && 'Listening...'}
                        {voiceStatus === 'speaking' && 'AI is speaking...'}
                        {voiceStatus === 'processing' && 'Processing your answer...'}
                        {voiceStatus === 'idle' && 'Interview Active'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {voiceStatus === 'listening' && 'Speak your answer now'}
                        {voiceStatus === 'speaking' && 'Wait for the AI to finish'}
                        {voiceStatus === 'processing' && 'Getting next question...'}
                      </p>
                    </div>
                  </>
                )}
                {interviewStatus === 'ended' && (
                  <>
                    <Phone className="w-6 h-6 text-muted-foreground" />
                    <p className="text-lg">Interview ended</p>
                  </>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Transcript Area */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="glass-card p-6 border-border/50">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Live Transcript</h3>
                  <div className="text-base leading-relaxed whitespace-pre-wrap">{transcript}</div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Control Buttons */}
          {interviewStatus === 'active' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-4 mb-8"
            >
              <Button
                onClick={toggleMute}
                variant="outline"
                className="h-12 px-8 rounded-2xl"
                disabled={isProcessing}
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Mute
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleEndInterview}
                variant="outline"
                className="border-destructive/50 hover:bg-destructive/10 text-destructive h-12 px-8 rounded-2xl"
                disabled={isProcessing}
              >
                <Square className="w-4 h-4 mr-2" />
                End Interview
              </Button>
            </motion.div>
          )}

          {/* Helpful Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <Card className="glass-card p-4 border-border/50 inline-block">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Pro Tip:</strong> Speak clearly, take your time, and think before answering. 
                The AI interviewer is here to help you practice!
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

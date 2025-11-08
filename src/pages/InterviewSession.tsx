import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Square, Phone, PhoneOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";

export default function InterviewSession() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [interviewData, setInterviewData] = useState<any>(null);
  const [vapiCallId, setVapiCallId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
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
    if (callStatus === 'active') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  const loadInterviewData = async () => {
    try {
      const response = await apiRequest(`api/user/interviews/${interviewId}`, {}, token);
      if (response.ok) {
        const data = await response.json();
        setInterviewData(data.interview);
        setVapiCallId(data.interview.vapi_call_id);
        
        if (data.interview.status === 'in_progress' && data.interview.vapi_call_id) {
          setCallStatus('connecting');
          initializeVapiCall(data.interview.vapi_call_id);
        }
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

  const initializeVapiCall = async (callId: string) => {
    try {
      // In a real implementation, you would initialize the Vapi call here
      // For now, we'll simulate the call connection
      setCallStatus('connecting');
      
      // Simulate connection delay
      setTimeout(() => {
        setCallStatus('active');
        setIsCallActive(true);
        toast({
          title: "Call Connected",
          description: "Your interview has started. Good luck!",
        });
      }, 2000);
      
      // TODO: Integrate Vapi React SDK or widget here
      // Example:
      // import { Vapi } from '@vapi-ai/react';
      // const vapi = new Vapi({ apiKey: 'your-key', callId });
      // vapi.start();
      
    } catch (error) {
      console.error('Error initializing Vapi call:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the interview call",
        variant: "destructive",
      });
      setCallStatus('idle');
    }
  };

  const handleEndInterview = async () => {
    try {
      setCallStatus('ended');
      setIsCallActive(false);
      
      // TODO: End Vapi call
      // vapi.end();
      
      toast({
        title: "Interview Ended",
        description: "Redirecting to results...",
      });
      
      setTimeout(() => {
        navigate(`/interview/result?interviewId=${interviewId}`);
      }, 1500);
    } catch (error) {
      console.error('Error ending interview:', error);
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

          {/* Call Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="glass-card p-6 border-border/50">
              <div className="flex items-center justify-center gap-4">
                {callStatus === 'idle' && (
                  <>
                    <Phone className="w-6 h-6 text-muted-foreground" />
                    <p className="text-lg">Ready to start interview</p>
                    <Button onClick={() => initializeVapiCall(vapiCallId || '')}>
                      Start Call
                    </Button>
                  </>
                )}
                {callStatus === 'connecting' && (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-lg">Connecting to interview...</p>
                  </>
                )}
                {callStatus === 'active' && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                      <Phone className="w-6 h-6 text-green-500 relative z-10" />
                    </div>
                    <p className="text-lg font-semibold text-green-500">Interview in Progress</p>
                  </>
                )}
                {callStatus === 'ended' && (
                  <>
                    <PhoneOff className="w-6 h-6 text-muted-foreground" />
                    <p className="text-lg">Interview ended</p>
                  </>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Vapi Call Widget Placeholder */}
          {callStatus === 'active' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="glass-card p-8 border-border/50">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Mic className="w-16 h-16 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Interview Active</h3>
                    <p className="text-muted-foreground">
                      Your AI interviewer is ready. Speak clearly and take your time.
                    </p>
                  </div>
                  
                  {/* TODO: Replace with actual Vapi widget/component */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      📞 Vapi Integration Required
                    </p>
                    <p className="text-xs text-muted-foreground">
                      To enable voice calls, integrate the Vapi React SDK or widget here.
                      See server/README_VAPI_GEMINI.md for integration instructions.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

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
                  <p className="text-base leading-relaxed">{transcript}</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Control Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-4"
          >
            {callStatus === 'active' && (
              <Button
                onClick={() => setIsCallActive(!isCallActive)}
                variant="outline"
                className="h-12 px-8 rounded-2xl"
              >
                {isCallActive ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Mute
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Unmute
                  </>
                )}
              </Button>
            )}
            
            <Button
              onClick={handleEndInterview}
              variant="outline"
              className="border-destructive/50 hover:bg-destructive/10 text-destructive h-12 px-8 rounded-2xl"
              disabled={callStatus === 'ended'}
            >
              <Square className="w-4 h-4 mr-2" />
              End Interview
            </Button>
          </motion.div>

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

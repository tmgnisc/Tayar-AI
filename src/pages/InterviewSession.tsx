import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Square, Phone, PhoneOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";
import VapiClient from "@/services/vapiClient";

export default function InterviewSession() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [interviewData, setInterviewData] = useState<any>(null);
  const [vapiCallId, setVapiCallId] = useState<string | null>(null);
  const [vapiApiKey, setVapiApiKey] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isInitializingVapi, setIsInitializingVapi] = useState(false);
  const [vapiInitError, setVapiInitError] = useState<string | null>(null);
  const vapiClientRef = useRef<VapiClient | null>(null);
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

  // Auto-retry loading Vapi call info if call ID exists but API key is missing
  useEffect(() => {
    if (vapiCallId && !vapiApiKey && interviewId && token) {
      // Retry after a short delay
      const timer = setTimeout(() => {
        loadVapiCallInfo(vapiCallId).catch(console.error);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [vapiCallId, vapiApiKey, interviewId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for Vapi call ID if it's missing (in case it's still being created)
  useEffect(() => {
    if (!vapiCallId && interviewId && token && callStatus === 'idle') {
      const pollInterval = setInterval(async () => {
        try {
          const response = await apiRequest(`api/user/interviews/${interviewId}`, {}, token);
          if (response.ok) {
            const data = await response.json();
            if (data.interview.vapi_call_id) {
              setVapiCallId(data.interview.vapi_call_id);
              await loadVapiCallInfo(data.interview.vapi_call_id);
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error('Error polling for Vapi call ID:', error);
        }
      }, 3000); // Poll every 3 seconds

      // Stop polling after 30 seconds
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
      }, 30000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [vapiCallId, interviewId, token, callStatus]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setVapiCallId(data.interview.vapi_call_id || null);
        
        // Always try to load Vapi call info (even if call ID is missing, we can get the API key)
        await loadVapiCallInfo(data.interview.vapi_call_id);
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

  const loadVapiCallInfo = async (callId?: string) => {
    try {
      const response = await apiRequest(`api/user/interviews/${interviewId}/vapi-info`, {}, token);
      if (response.ok) {
        const data = await response.json();
        setVapiApiKey(data.publicKey || null);
        
        // If call ID is missing but we got the API key, the call might still be initializing
        if (!data.callId && data.publicKey) {
          console.log('Vapi API key available, but call ID is missing - call may still be initializing');
        } else if (data.callId && data.callId !== vapiCallId) {
          // Update call ID if we got a new one
          setVapiCallId(data.callId);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Vapi call info not available:', errorData.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error loading Vapi call info:', error);
      // Don't block the user - we'll try to initialize anyway
    }
  };

  const initializeVapiCallForInterview = async () => {
    if (!interviewId || !token) return;

    setIsInitializingVapi(true);
    setVapiInitError(null);

    try {
      const response = await apiRequest(
        `api/user/interviews/${interviewId}/initialize-vapi`,
        { method: 'POST' },
        token
      );

      if (response.ok) {
        const data = await response.json();
        setVapiCallId(data.callId);
        toast({
          title: "Vapi Initialized",
          description: "Vapi call has been successfully initialized. You can now start the interview.",
        });
        // Reload interview data to get updated call ID
        await loadInterviewData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to initialize Vapi call';
        setVapiInitError(errorMessage);
        toast({
          title: "Initialization Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize Vapi call';
      setVapiInitError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitializingVapi(false);
    }
  };

  const initializeVapiCall = async (callId: string) => {
    // If no call ID, try to create one or show helpful message
    if (!callId) {
      toast({
        title: "Vapi Call Not Available",
        description: "The interview was created but Vapi initialization failed. Please try refreshing the page or start a new interview.",
        variant: "destructive",
      });
      return;
    }

    // Try to load Vapi API key if not available
    if (!vapiApiKey) {
      try {
        await loadVapiCallInfo(callId);
        // If still no API key after retry, show error
        if (!vapiApiKey) {
          toast({
            title: "Vapi Configuration Missing",
            description: "Unable to retrieve Vapi API key. Please check server configuration.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load Vapi configuration. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setCallStatus('connecting');
      
      // Request microphone permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (mediaError) {
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to start the interview",
          variant: "destructive",
        });
        setCallStatus('idle');
        return;
      }

      // Create Vapi client
      const vapiClient = new VapiClient({
        callId: callId,
        apiKey: vapiApiKey,
        onTranscript: (text: string) => {
          setTranscript((prev) => prev + (prev ? ' ' : '') + text);
        },
        onStatusChange: (status: string) => {
          console.log('[InterviewSession] Vapi status:', status);
          if (status === 'connected' || status === 'active') {
            setCallStatus('active');
            setIsCallActive(true);
            toast({
              title: "Call Connected",
              description: "Your interview has started. Good luck!",
            });
          } else if (status === 'disconnected' || status === 'ended') {
            setCallStatus('ended');
            setIsCallActive(false);
          }
        },
        onError: (error: Error) => {
          console.error('[InterviewSession] Vapi error:', error);
          toast({
            title: "Connection Error",
            description: error.message || "Failed to connect to the interview call",
            variant: "destructive",
          });
          setCallStatus('idle');
        },
      });

      vapiClientRef.current = vapiClient;

      // Start the call
      await vapiClient.start();
      
    } catch (error: any) {
      console.error('Error initializing Vapi call:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to the interview call",
        variant: "destructive",
      });
      setCallStatus('idle');
    }
  };

  const handleEndInterview = async () => {
    try {
      setCallStatus('ended');
      setIsCallActive(false);
      
      // End Vapi call
      if (vapiClientRef.current) {
        await vapiClientRef.current.end();
        vapiClientRef.current = null;
      }
      
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiClientRef.current) {
        vapiClientRef.current.end().catch(console.error);
      }
    };
  }, []);

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
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-lg">Ready to start interview</p>
                      <Button 
                        onClick={() => {
                          if (vapiCallId) {
                            initializeVapiCall(vapiCallId);
                          } else {
                            toast({
                              title: "Vapi Call Not Initialized",
                              description: "The interview was created but Vapi call initialization is still in progress. Please wait a moment and refresh the page.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={callStatus !== 'idle'}
                      >
                        Start Call
                      </Button>
                      {!vapiCallId && (
                        <div className="flex flex-col items-center gap-3 mt-2">
                          <p className="text-sm text-muted-foreground text-center max-w-md">
                            Vapi call is being initialized. This may take a few moments.
                          </p>
                          <Button
                            onClick={initializeVapiCallForInterview}
                            disabled={isInitializingVapi}
                            variant="outline"
                            size="sm"
                          >
                            {isInitializingVapi ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Initializing...
                              </>
                            ) : (
                              'Retry Vapi Initialization'
                            )}
                          </Button>
                          {vapiInitError && (
                            <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-md">
                              {vapiInitError}
                            </p>
                          )}
                        </div>
                      )}
                      {vapiCallId && !vapiApiKey && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center max-w-md">
                          Loading Vapi configuration...
                        </p>
                      )}
                    </div>
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
                  
                  <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                      🎤 Voice Call Active
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your microphone is enabled and the AI interviewer can hear you. 
                      Speak clearly and wait for the AI to finish speaking before responding.
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
                onClick={() => {
                  const muted = vapiClientRef.current?.toggleMute();
                  setIsCallActive(muted ?? true);
                }}
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

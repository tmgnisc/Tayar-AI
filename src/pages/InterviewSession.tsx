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

  const initializeVapiCallForInterview = async (): Promise<string | null> => {
    if (!interviewId || !token) return null;

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
        const newCallId = data.callId;
        
        if (newCallId) {
          setVapiCallId(newCallId);
          // Also load the API key to make sure we have it
          await loadVapiCallInfo(newCallId);
          
          toast({
            title: "Vapi Initialized",
            description: "Vapi call has been successfully initialized. Starting call...",
          });
          
          // Reload interview data to get updated call ID
          await loadInterviewData();
          
          return newCallId;
        } else {
          setVapiInitError('Vapi initialization completed but no call ID was returned');
          toast({
            title: "Initialization Failed",
            description: "Vapi initialized but call ID is missing. Please try again.",
            variant: "destructive",
          });
          return null;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to initialize Vapi call';
        const errorDetails = errorData.details || errorData.error || '';
        
        // Build detailed error message
        let detailedError = errorMessage;
        if (errorDetails) {
          if (typeof errorDetails === 'string') {
            detailedError += `: ${errorDetails}`;
          } else if (typeof errorDetails === 'object') {
            const detailsStr = errorDetails.message || errorDetails.error || JSON.stringify(errorDetails);
            detailedError += `: ${detailsStr}`;
          }
        }
        
        setVapiInitError(detailedError);
        
        console.error('[Frontend] Vapi initialization error:', errorData);
        
        toast({
          title: "Initialization Failed",
          description: detailedError.length > 100 ? detailedError.substring(0, 100) + '...' : detailedError,
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize Vapi call';
      setVapiInitError(errorMessage);
      
      console.error('[Frontend] Vapi initialization exception:', error);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsInitializingVapi(false);
    }
  };

  const initializeVapiCall = async (callId: string) => {
    // If no call ID, try to initialize Vapi automatically
    if (!callId) {
      console.log('[InterviewSession] No call ID, attempting to initialize Vapi...');
      
      // Check if we have API key - if yes, try to initialize Vapi
      if (vapiApiKey && interviewId) {
        toast({
          title: "Initializing Vapi Call",
          description: "Setting up your interview call. This may take a few moments...",
        });
        
        // Try to initialize Vapi automatically and get the call ID directly
        const newCallId = await initializeVapiCallForInterview();
        
        // If initialization succeeded, use the returned call ID directly
        if (newCallId) {
          // Recursively call with the new call ID
          await initializeVapiCall(newCallId);
          return;
        } else {
          // Initialization failed
          return;
        }
      } else {
        // No API key either - need to load it first
        await loadVapiCallInfo();
        
        if (!vapiApiKey) {
          toast({
            title: "Vapi Not Configured",
            description: "Unable to retrieve Vapi configuration. Please click 'Retry Vapi Initialization' or contact support.",
            variant: "destructive",
          });
          return;
        }
        
        // Now try to initialize with API key and get call ID directly
        if (interviewId && !isInitializingVapi) {
          const newCallId = await initializeVapiCallForInterview();
          if (newCallId) {
            await initializeVapiCall(newCallId);
          }
        }
        return;
      }
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
                        onClick={async () => {
                          // Always try to initialize - the function will handle missing call ID
                          if (vapiCallId) {
                            await initializeVapiCall(vapiCallId);
                          } else {
                            // No call ID - try to initialize automatically
                            if (vapiApiKey && !isInitializingVapi) {
                              // We have API key but no call ID - try to initialize and start call
                              const newCallId = await initializeVapiCallForInterview();
                              if (newCallId) {
                                // Use the returned call ID directly
                                await initializeVapiCall(newCallId);
                              }
                            } else if (!vapiApiKey) {
                              // Try to load API key first
                              await loadVapiCallInfo();
                              
                              if (vapiApiKey && !isInitializingVapi) {
                                // Initialize and start call
                                const newCallId = await initializeVapiCallForInterview();
                                if (newCallId) {
                                  await initializeVapiCall(newCallId);
                                }
                              } else if (!vapiApiKey) {
                                toast({
                                  title: "Vapi Not Configured",
                                  description: "Unable to load Vapi configuration. Please check server settings.",
                                  variant: "destructive",
                                });
                              }
                            } else {
                              toast({
                                title: "Please Wait",
                                description: "Vapi is still initializing. Please wait a moment...",
                                variant: "default",
                              });
                            }
                          }
                        }}
                        disabled={callStatus !== 'idle' || isInitializingVapi}
                      >
                        {isInitializingVapi ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Initializing...
                          </>
                        ) : (
                          'Start Call'
                        )}
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

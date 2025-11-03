import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Square } from "lucide-react";

export default function InterviewSession() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const navigate = useNavigate();

  const currentQuestion = "Tell me about a challenging project you worked on and how you overcame the obstacles.";

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate transcription after a delay
      setTimeout(() => {
        setTranscript(
          "Well, I worked on a large-scale e-commerce platform where we had to handle Black Friday traffic..."
        );
      }, 2000);
    }
  };

  const handleEndInterview = () => {
    navigate("/interview/result");
  };

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar showAuth={false} showProfile={true} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question 3 of 10</span>
              <span>15:30 elapsed</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "30%" }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
          </div>

          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card p-8 mb-8 border-border/50">
              <h2 className="text-2xl font-semibold mb-4 text-center">Current Question</h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-center text-muted-foreground"
              >
                {currentQuestion}
              </motion.p>
            </Card>
          </motion.div>

          {/* Microphone Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleRecording}
              className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                isRecording
                  ? "bg-gradient-to-br from-destructive to-destructive/70 animate-glow"
                  : "bg-gradient-to-br from-primary to-accent"
              }`}
            >
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="recording"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <MicOff className="w-12 h-12 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Mic className="w-12 h-12 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-destructive"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.8, 0, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.button>
          </motion.div>

          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">
              {isRecording ? "Recording... Click to stop" : "Click to start recording your answer"}
            </p>
          </div>

          {/* Transcript Area */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="glass-card p-6 mb-8 border-border/50">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Live Transcript</h3>
                  <p className="text-base leading-relaxed">{transcript}</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* End Interview Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleEndInterview}
              variant="outline"
              className="border-destructive/50 hover:bg-destructive/10 text-destructive h-12 px-8 rounded-2xl"
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
                💡 <strong>Pro Tip:</strong> Take your time to think before answering. Quality over speed!
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Target, Globe, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";

export default function InterviewSetup() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();

  const handleStart = async () => {
    if (!role || !difficulty || !language) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields to start the interview",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest('api/user/interviews', {
        method: 'POST',
        body: JSON.stringify({ role, difficulty, language }),
      }, token);

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Interview started!",
          description: "Good luck with your interview practice!",
        });
        // Navigate to session with interview ID
        navigate(`/interview/session?interviewId=${data.interviewId}`);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to start interview",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar showAuth={false} showProfile={true} />
      
      <div className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        <FloatingParticles />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl relative z-10"
        >
          <Card className="glass-card border-border/50">
            <CardHeader className="text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-3xl font-bold">Setup Your Interview</CardTitle>
              <CardDescription className="text-base">
                Configure your practice session to match your target role
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <Label htmlFor="role" className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Target Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className="h-14 text-base bg-background/50 border-border/50">
                    <SelectValue placeholder="Select your target role" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover backdrop-blur-xl border-border/50">
                    <SelectItem value="software-engineer">Software Engineer</SelectItem>
                    <SelectItem value="senior-software-engineer">Senior Software Engineer</SelectItem>
                    <SelectItem value="frontend-developer">Frontend Developer</SelectItem>
                    <SelectItem value="backend-developer">Backend Developer</SelectItem>
                    <SelectItem value="full-stack-developer">Full Stack Developer</SelectItem>
                    <SelectItem value="product-manager">Product Manager</SelectItem>
                    <SelectItem value="data-scientist">Data Scientist</SelectItem>
                    <SelectItem value="devops-engineer">DevOps Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Label htmlFor="difficulty" className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Difficulty Level
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty" className="h-14 text-base bg-background/50 border-border/50">
                    <SelectValue placeholder="Choose difficulty level" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover backdrop-blur-xl border-border/50">
                    <SelectItem value="beginner">Beginner - Entry Level</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Mid Level</SelectItem>
                    <SelectItem value="advanced">Advanced - Senior Level</SelectItem>
                    <SelectItem value="expert">Expert - Lead/Principal</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Label htmlFor="language" className="text-base flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Interview Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language" className="h-14 text-base bg-background/50 border-border/50">
                    <SelectValue placeholder="Select interview language" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover backdrop-blur-xl border-border/50">
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                    <SelectItem value="mandarin">Mandarin Chinese</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleStart}
                  disabled={!role || !difficulty || !language || loading}
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 rounded-2xl group"
                >
                  <motion.span
                    whileHover={!loading ? { scale: 1.05 } : {}}
                    className="flex items-center gap-2"
                  >
                    {loading ? "Starting Interview..." : "Start Interview"}
                    {!loading && <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                  </motion.span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-sm text-muted-foreground"
              >
                <p>💡 Tip: Choose a role and difficulty that matches your target position</p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

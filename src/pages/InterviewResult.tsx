import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, MessageCircle, Award, RefreshCw, Home } from "lucide-react";
import confetti from "canvas-confetti";

export default function InterviewResult() {
  const [showConfetti, setShowConfetti] = useState(false);
  
  const overallScore = 8.5;
  const feedback = [
    {
      category: "Communication",
      score: 9.0,
      icon: MessageCircle,
      color: "from-primary to-accent",
      feedback: "Excellent clarity and articulation. Your responses were well-structured and easy to follow.",
    },
    {
      category: "Confidence",
      score: 8.5,
      icon: Trophy,
      color: "from-secondary to-primary",
      feedback: "Strong confidence displayed throughout. Minor hesitations on technical questions.",
    },
    {
      category: "Content Quality",
      score: 8.0,
      icon: Award,
      color: "from-accent to-secondary",
      feedback: "Good technical depth. Consider providing more specific examples in your answers.",
    },
  ];

  useEffect(() => {
    if (overallScore >= 8) {
      setShowConfetti(true);
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#8B5CF6", "#6366F1", "#3B82F6"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#8B5CF6", "#6366F1", "#3B82F6"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [overallScore]);

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar showAuth={false} showProfile={true} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-4"
            >
              Interview Complete! 🎉
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-block"
            >
              <div className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                {overallScore}/10
              </div>
              <p className="text-muted-foreground mt-2">Overall Performance Score</p>
            </motion.div>
          </div>

          {/* Score Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <Card className="glass-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Performance</span>
                  <span className="text-sm text-muted-foreground">{overallScore * 10}%</span>
                </div>
                <Progress value={overallScore * 10} className="h-3" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Feedback */}
          <div className="grid gap-6 mb-12">
            {feedback.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Card className="glass-card border-border/50 hover:shadow-[var(--shadow-card)] transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{item.category}</CardTitle>
                      </div>
                      <div className="text-3xl font-bold text-primary">{item.score}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={item.score * 10} className="h-2 mb-4" />
                    <p className="text-muted-foreground">{item.feedback}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Key Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="glass-card border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Award className="w-5 h-5" />
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="text-sm">Clear and concise communication style</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="text-sm">Strong technical knowledge demonstrated</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span className="text-sm">Good use of real-world examples</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card className="glass-card border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <TrendingUp className="w-5 h-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">→</span>
                      <span className="text-sm">Provide more quantifiable metrics in answers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">→</span>
                      <span className="text-sm">Work on reducing filler words</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-1">→</span>
                      <span className="text-sm">Practice behavioral question responses</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/interview/setup" className="flex-1 sm:flex-initial">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 h-14 px-8 rounded-2xl"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Practice Again
              </Button>
            </Link>
            <Link to="/dashboard" className="flex-1 sm:flex-initial">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10 h-14 px-8 rounded-2xl"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Motivational Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 text-center"
          >
            <Card className="glass-card border-border/50 inline-block p-6">
              <p className="text-muted-foreground">
                🌟 <strong>Great job!</strong> You're making excellent progress. Keep practicing to refine your skills!
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

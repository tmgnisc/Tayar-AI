import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trophy,
  TrendingUp,
  MessageCircle,
  Award,
  RefreshCw,
  Home,
  AlertTriangle,
  ShieldOff,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";

interface DetailedAnalysis {
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
  keywordAccuracy: number;
  overallRating: string;
  detailedAnalysis: DetailedAnalysis[];
  recommendations: string[];
  topicsToCover: string[];
}

export default function InterviewResult() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("interviewId");

  const fetchReport = async (id: string) => {
    try {
      const response = await apiRequest(`api/user/interviews/${id}/report`, {}, token);
      if (!response.ok) {
        throw new Error("Failed to fetch report");
      }
      const data = await response.json();
      setReport(data);
      localStorage.setItem("latestReport", JSON.stringify(data));
      localStorage.setItem("latestInterviewId", id);
    } catch (error: any) {
      console.error("Error fetching report:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to load interview report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedReport = localStorage.getItem("latestReport");
    const cachedInterviewId = localStorage.getItem("latestInterviewId");
    if (cachedReport && (!interviewId || cachedInterviewId === interviewId)) {
      try {
        const parsed = JSON.parse(cachedReport);
        setReport(parsed);
        setLoading(false);
        return;
      } catch {
        // ignore parse errors and refetch
      }
    }

    if (interviewId && token) {
      fetchReport(interviewId);
    } else {
      setLoading(false);
    }
  }, [interviewId, token]);

  useEffect(() => {
    if (report && report.averageScore >= 80) {
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
  }, [report]);

  const overallScore = report?.averageScore ?? 0;
  const keywordAccuracy = report?.keywordAccuracy ?? 0;

  const summaryCards = useMemo(() => [
    {
      label: "Average Score",
      value: `${overallScore.toFixed(0)}%`,
      icon: Trophy,
      color: "from-primary to-accent",
    },
    {
      label: "Keyword Accuracy",
      value: `${keywordAccuracy.toFixed(0)}%`,
      icon: TrendingUp,
      color: "from-secondary to-primary",
    },
    {
      label: "Off-topic Answers",
      value: report ? report.offTopicCount.toString() : "0",
      icon: AlertTriangle,
      color: "from-accent to-secondary",
    },
    {
      label: "Low Knowledge",
      value: report ? report.lowKnowledgeCount.toString() : "0",
      icon: Info,
      color: "from-primary to-secondary",
    },
  ], [overallScore, keywordAccuracy, report]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Generating Report...</div>
          <div className="text-muted-foreground">Analyzing your performance</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen gradient-mesh">
        <Navbar showAuth={false} showProfile={true} />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <Card className="glass-card border-border/50 inline-block p-6">
            <p className="text-muted-foreground mb-4">
              We couldn’t find a recent interview report. Start a new practice session to get fresh feedback.
            </p>
            <Link to="/interview/setup">
              <Button>Start Interview</Button>
            </Link>
          </Card>
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
          className="max-w-5xl mx-auto"
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
                {overallScore.toFixed(0)}%
              </div>
              <p className="text-muted-foreground mt-2">Average Performance Score</p>
              <p className="text-sm text-muted-foreground mt-1">Overall Rating: {report.overallRating}</p>
            </motion.div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {summaryCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Card className="glass-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{card.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Progress Bars */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Performance</span>
                  <span className="text-sm text-muted-foreground">{overallScore.toFixed(0)}%</span>
                </div>
                <Progress value={overallScore} className="h-3" />
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Keyword Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Coverage</span>
                  <span className="text-sm text-muted-foreground">{keywordAccuracy.toFixed(0)}%</span>
                </div>
                <Progress value={keywordAccuracy} className="h-3" />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <div className="mb-12">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Question-by-Question Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.detailedAnalysis.map((item) => (
                  <div key={item.questionId} className="p-4 rounded-xl bg-background/40 border border-border/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Question {item.questionId}</p>
                        <p className="font-semibold">{item.question}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase text-muted-foreground">Score</p>
                        <p className="text-2xl font-bold text-primary">{item.score.toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {item.isOffTopic && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Off-topic
                        </Badge>
                      )}
                      {item.isLowKnowledge && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Low knowledge
                        </Badge>
                      )}
                      {item.hasProfanity && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <ShieldOff className="w-3 h-3" />
                          Inappropriate language
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Accuracy: {item.accuracy?.toFixed(0) ?? 0}%
                      </Badge>
                    </div>
                    {item.answer && (
                      <div className="mb-2">
                        <p className="text-xs uppercase text-muted-foreground">Your answer</p>
                        <p className="text-sm">{item.answer}</p>
                      </div>
                    )}
                    <div className="mb-2">
                      <p className="text-xs uppercase text-muted-foreground">Keywords mentioned</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.keywordsMatched.length > 0 ? (
                          item.keywordsMatched.map((keyword) => (
                            <Badge key={keyword} variant="secondary">{keyword}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No keywords detected</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.feedback}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
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
                  {report.recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Great job! Keep up the strong performance.</p>
                  ) : (
                    <ul className="space-y-2">
                      {report.recommendations.filter(rec => rec.toLowerCase().includes('great job')).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                      {report.recommendations.filter(rec => !rec.toLowerCase().includes('great job')).length === 0 && (
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span className="text-sm">Clear and concise communication</span>
                        </li>
                      )}
                    </ul>
                  )}
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
                    {report.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-accent mt-1">→</span>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                    {report.topicsToCover.length > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-accent mt-1">→</span>
                        <span className="text-sm">
                          Review topics: {report.topicsToCover.join(", ")}
                        </span>
                      </li>
                    )}
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

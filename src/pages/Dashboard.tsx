import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Award, Clock, Play, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";

export default function Dashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_interviews: 0,
    avg_score: "0.0",
    total_minutes: 0,
    achievements: 0,
  });
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);

  useEffect(() => {
    if (token && user) {
      fetchDashboardData();
    }
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest('api/user/dashboard', {}, token);

      if (response.ok) {
        const data = await response.json();
        setStats({
          total_interviews: data.stats.total_interviews || 0,
          avg_score: data.stats.avg_score || "0.0",
          total_minutes: data.stats.total_minutes || 0,
          achievements: data.stats.achievements || 0,
        });
        setRecentInterviews(data.recent_interviews || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { icon: Target, label: "Total Interviews", value: stats.total_interviews.toString(), color: "from-primary to-accent" },
    { icon: TrendingUp, label: "Average Score", value: stats.avg_score, color: "from-secondary to-primary" },
    { icon: Award, label: "Achievements", value: stats.achievements.toString(), color: "from-accent to-secondary" },
    { icon: Clock, label: "Practice Hours", value: Math.round(stats.total_minutes / 60).toString(), color: "from-primary to-secondary" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-muted-foreground">Fetching your dashboard data</div>
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
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.name || 'User'}! 👋</h1>
          <p className="text-muted-foreground">Ready to ace your next interview?</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card border-border/50 hover:shadow-[var(--shadow-card)] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Link to="/interview/setup">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 h-14 px-8 text-lg rounded-2xl group"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start New Interview
            </Button>
          </Link>
        </motion.div>

        {/* Recent Interviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Recent Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              {recentInterviews.length > 0 ? (
                <div className="space-y-4">
                  {recentInterviews.map((interview, i) => (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-background/50 hover:bg-background/70 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {interview.role}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {interview.completed_at ? new Date(interview.completed_at).toLocaleDateString() : new Date(interview.started_at).toLocaleDateString()}
                            </span>
                            {interview.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {interview.duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {interview.overall_score && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{interview.overall_score}</div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No interviews yet. Start your first interview to see your progress here!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p>Your performance is improving over time!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

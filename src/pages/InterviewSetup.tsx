import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";

interface Domain {
  id: number;
  name: string;
  description?: string;
}

export default function InterviewSetup() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [language] = useState("english"); // Fixed to English for now
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [userProfile, setUserProfile] = useState<{ domain?: Domain | null; level?: string | null } | null>(null);
  const [dailyLimit, setDailyLimit] = useState<{ is_free_user: boolean; interviews_today: number; daily_limit: number; remaining: number } | null>(null);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();

  // Map user level to interview difficulty
  const mapLevelToDifficulty = (level: string | undefined | null): string => {
    if (!level) return "";
    switch (level) {
      case "beginner":
        return "beginner";
      case "intermediate":
        return "intermediate";
      case "senior":
        return "advanced";
      case "principal":
      case "lead":
        return "expert";
      default:
        return "";
    }
  };

  // Load user profile and domains on mount
  useEffect(() => {
    if (token && user) {
      loadInitialData();
    } else {
      setPageLoading(false);
    }
  }, [token, user]);

  const loadInitialData = async () => {
    try {
      // Fetch profile, domains, and dashboard (for daily limit) in parallel
      const [profileResponse, domainsResponse, dashboardResponse] = await Promise.all([
        apiRequest('api/user/profile', {}, token),
        apiRequest('api/user/domains', {}, token),
        apiRequest('api/user/dashboard', {}, token),
      ]);

      // Process domains first
      let domainsList: Domain[] = [];
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        domainsList = domainsData.domains || [];
        setDomains(domainsList);
      }

      // Load daily limit info
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setDailyLimit(dashboardData.daily_limit);
      }

      // Process profile and auto-fill fields
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const profile = profileData.user;
        setUserProfile(profile);

        // Auto-fill difficulty from user's level
        if (profile.level) {
          const mappedDifficulty = mapLevelToDifficulty(profile.level);
          if (mappedDifficulty) {
            setDifficulty(mappedDifficulty);
          }
        }

        // Auto-fill role from user's domain
        if (profile.domain) {
          // Find the domain in the list and use its slug format
          const userDomain = domainsList.find(
            (d: Domain) => d.id === profile.domain.id || d.name.toLowerCase() === profile.domain.name.toLowerCase()
          );
          
          if (userDomain) {
            // Use the domain name, converted to slug format to match dropdown values
            const domainSlug = userDomain.name.toLowerCase().replace(/\s+/g, "-");
            setRole(domainSlug);
          } else {
            // Fallback: use the domain name from profile
            const domainSlug = profile.domain.name.toLowerCase().replace(/\s+/g, "-");
            setRole(domainSlug);
          }
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleStart = async () => {
    if (!role || !difficulty) {
      toast({
        title: "Missing fields",
        description: "Please select a role and difficulty level to start the interview",
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
        // Check if it's a daily limit error
        if (response.status === 403 && data.limitReached) {
          toast({
            title: "Daily Limit Reached",
            description: data.error || "Free users can only take 1 interview per day. Upgrade to Pro for unlimited interviews!",
            variant: "destructive",
            action: (
              <button
                onClick={() => navigate('/pricing')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Upgrade to Pro
              </button>
            ),
          });
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to start interview",
            variant: "destructive",
          });
        }
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

  if (pageLoading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-muted-foreground">Preparing your interview setup</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar />
      
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
              {/* Daily Limit Info for Free Users */}
              {dailyLimit && dailyLimit.is_free_user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-4 rounded-lg border ${
                    dailyLimit.remaining > 0 
                      ? 'bg-blue-500/10 border-blue-500/50' 
                      : 'bg-amber-500/10 border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {dailyLimit.remaining > 0 
                          ? `${dailyLimit.remaining} interview${dailyLimit.remaining === 1 ? '' : 's'} remaining today (Free Plan)` 
                          : 'Daily interview limit reached (Free Plan)'
                        }
                      </p>
                      {dailyLimit.remaining === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Come back tomorrow or upgrade to Pro for unlimited interviews!
                        </p>
                      )}
                    </div>
                    {dailyLimit.remaining === 0 && (
                      <Button
                        onClick={() => navigate('/pricing')}
                        size="sm"
                        className="ml-4 bg-gradient-to-r from-primary to-accent"
                      >
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <Label htmlFor="role" className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Target Role / Domain
                  {userProfile?.domain && (
                    <span className="text-xs text-muted-foreground ml-auto">(Auto-filled from profile)</span>
                  )}
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className="h-14 text-base bg-background/50 border-border/50">
                    <SelectValue placeholder="Select your target role/domain" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover backdrop-blur-xl border-border/50">
                    {domains.length > 0 ? (
                      domains.map((domain) => (
                        <SelectItem key={domain.id} value={domain.name.toLowerCase().replace(/\s+/g, "-")}>
                          {domain.name}
                          {domain.description && (
                            <span className="text-muted-foreground ml-2 text-sm">- {domain.description}</span>
                          )}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                    <SelectItem value="software-engineer">Software Engineer</SelectItem>
                    <SelectItem value="senior-software-engineer">Senior Software Engineer</SelectItem>
                    <SelectItem value="frontend-developer">Frontend Developer</SelectItem>
                    <SelectItem value="backend-developer">Backend Developer</SelectItem>
                    <SelectItem value="full-stack-developer">Full Stack Developer</SelectItem>
                    <SelectItem value="product-manager">Product Manager</SelectItem>
                    <SelectItem value="data-scientist">Data Scientist</SelectItem>
                    <SelectItem value="devops-engineer">DevOps Engineer</SelectItem>
                      </>
                    )}
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
                  {userProfile?.level && (
                    <span className="text-xs text-muted-foreground ml-auto">(Auto-filled from profile)</span>
                  )}
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
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleStart}
                  disabled={!role || !difficulty || loading || (dailyLimit?.remaining === 0)}
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
                {userProfile?.domain && userProfile?.level ? (
                  <p>✅ Your profile settings have been auto-filled. You can change them if needed.</p>
                ) : (
                  <p>💡 Tip: Update your profile to auto-fill these fields, or choose manually</p>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

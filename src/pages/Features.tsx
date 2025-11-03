import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Mic, TrendingUp, Award, Zap, Target, BarChart3, Users, Shield, Clock, Globe, Sparkles } from "lucide-react";

export default function Features() {
  const mainFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Coaching",
      description: "Advanced AI simulates real interview scenarios with natural, conversational interactions that feel authentic.",
    },
    {
      icon: Mic,
      title: "Voice Simulation",
      description: "Practice with realistic voice-based interviews that capture the nuances of human conversation and feedback.",
    },
    {
      icon: TrendingUp,
      title: "Instant Feedback",
      description: "Get detailed analysis of your performance with actionable improvements after every practice session.",
    },
    {
      icon: Award,
      title: "Progress Tracking",
      description: "Monitor your improvement over time with detailed analytics, scores, and personalized insights.",
    },
  ];

  const detailedFeatures = [
    {
      icon: Target,
      title: "Customizable Interviews",
      description: "Tailor interviews to specific roles, companies, and difficulty levels that match your goals.",
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Practice in multiple languages to prepare for interviews at global companies.",
    },
    {
      icon: Clock,
      title: "Practice Anytime",
      description: "No scheduling hassles - practice 24/7 at your own pace and convenience.",
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Understand your strengths and weaknesses with comprehensive performance metrics.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your practice sessions are encrypted and completely confidential.",
    },
    {
      icon: Users,
      title: "Community Insights",
      description: "Learn from the community with anonymized insights and best practices.",
    },
    {
      icon: Zap,
      title: "Fast Response Time",
      description: "Get instant feedback and results without waiting for manual review.",
    },
    {
      icon: Sparkles,
      title: "Personalized Coaching",
      description: "AI adapts to your communication style and provides tailored recommendations.",
    },
  ];

  const benefits = [
    "Reduce interview anxiety with realistic practice",
    "Improve communication skills through repetition",
    "Identify weaknesses before the real interview",
    "Build confidence with data-driven insights",
    "Save time and money on expensive coaching",
    "Access world-class coaching from anywhere",
  ];

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Powerful <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Features</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Everything you need to ace your interview. Tayar.ai provides comprehensive tools and insights to help you succeed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-muted-foreground text-lg">The foundation of your interview success</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card p-6 h-full hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Complete Feature Set</h2>
            <p className="text-muted-foreground text-lg">All the tools you need for interview mastery</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {detailedFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-card p-6 h-full hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="glass-card p-12">
              <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Tayar.ai?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-muted-foreground">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-3xl text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Experience These Features?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Start your free trial today and see how Tayar.ai can transform your interview preparation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 rounded-2xl">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-2xl border-primary/30 hover:bg-primary/10">
                  View Pricing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



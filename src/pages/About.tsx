import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, TrendingUp, Award, Zap, Shield } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "Empowering job seekers to land their dream roles through AI-powered practice.",
    },
    {
      icon: Zap,
      title: "Innovation First",
      description: "Leveraging cutting-edge AI to simulate real interview experiences.",
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "Your data is secure and your practice sessions remain completely private.",
    },
  ];

  const stats = [
    { value: "10,000+", label: "Active Users" },
    { value: "50,000+", label: "Interviews Completed" },
    { value: "4.9/5", label: "Average Rating" },
    { value: "95%", label: "Success Rate" },
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Founder",
      description: "Ex-Google AI Engineer with 10+ years in machine learning",
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Product",
      description: "Former Product Manager at Microsoft, specialized in educational tech",
    },
    {
      name: "Priya Patel",
      role: "Lead AI Researcher",
      description: "PhD in Natural Language Processing from Stanford",
    },
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
              About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Tayar.ai</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              We're building the future of interview preparation. Our mission is to help everyone access world-class 
              interview coaching through the power of AI.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="glass-card p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  Tayar.ai was born from a simple observation: great candidates often fail interviews not because they lack 
                  skills, but because they haven't had enough practice. Traditional mock interviews are expensive, time-consuming, 
                  and hard to schedule.
                </p>
                <p className="leading-relaxed">
                  We set out to change that by creating an AI-powered platform that simulates real interview experiences 24/7. 
                  Using advanced natural language processing and voice recognition, our AI coaches provide personalized feedback 
                  that helps you improve with every session.
                </p>
                <p className="leading-relaxed">
                  Today, thousands of job seekers trust Tayar.ai to prepare for their most important interviews. From FAANG 
                  companies to startups, our users land their dream jobs faster and with more confidence.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground text-lg">What drives us every day</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card p-8 h-full">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground text-lg">The brilliant minds behind Tayar.ai</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card p-6 text-center h-full">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm">{member.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
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
            <TrendingUp className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Join Our Mission</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Help us democratize interview preparation and give everyone a fair shot at their dream job.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 rounded-2xl">
                  Get Started
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-2xl border-primary/30 hover:bg-primary/10">
                  Contact Us
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



import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Rocket } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      icon: Zap,
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with interview practice",
      popular: false,
      features: [
        "3 mock interviews per month",
        "Basic AI feedback",
        "Progress tracking",
        "Community support",
        "Email notifications",
      ],
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const,
    },
    {
      name: "Pro",
      icon: Rocket,
      price: "$29",
      period: "per month",
      description: "Most popular for serious job seekers",
      popular: true,
      features: [
        "Unlimited mock interviews",
        "Advanced AI feedback",
        "Detailed analytics",
        "Priority support",
        "Custom interview settings",
        "Practice in multiple languages",
        "Performance insights",
        "Resume feedback",
      ],
      buttonText: "Start Pro Trial",
      buttonVariant: "default" as const,
    },
    {
      name: "Enterprise",
      icon: Crown,
      price: "Custom",
      period: "pricing",
      description: "For teams and organizations",
      popular: false,
      features: [
        "Everything in Pro",
        "Team collaboration tools",
        "Admin dashboard",
        "Custom integrations",
        "Dedicated support",
        "Training workshops",
        "Custom AI training",
        "Volume discounts",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
    },
  ];

  const faqs = [
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time with no penalties. Your access will continue until the end of your billing period.",
    },
    {
      question: "Do you offer student discounts?",
      answer: "Yes! Students can get 50% off on our Pro plan with a valid student email. Contact us for more details.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.",
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! Our Free plan is forever free, and Pro comes with a 14-day free trial, no credit card required.",
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
              Simple, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Choose the perfect plan for your interview preparation journey. All plans include our core AI coaching features.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`glass-card h-full relative overflow-hidden ${plan.popular ? 'border-2 border-primary shadow-[var(--shadow-card-hover)]' : ''}`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="text-center pt-8 pb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="text-5xl font-bold">{plan.price}</div>
                      <div className="text-muted-foreground text-sm mt-1">{plan.period}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4">
                      {plan.buttonVariant === "default" ? (
                        <Link to="/auth/signup">
                          <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12 rounded-xl">
                            {plan.buttonText}
                          </Button>
                        </Link>
                      ) : plan.buttonText === "Contact Sales" ? (
                        <Link to="/contact">
                          <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10 h-12 rounded-xl">
                            {plan.buttonText}
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/auth/signup">
                          <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10 h-12 rounded-xl">
                            {plan.buttonText}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="glass-card p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">30-Day Money-Back Guarantee</h2>
              <p className="text-muted-foreground text-lg">
                Not satisfied? Get a full refund within 30 days, no questions asked. We're confident you'll love Tayar.ai.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
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
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of job seekers who've improved their interview skills with Tayar.ai
            </p>
            <Link to="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 rounded-2xl">
                Start Your Free Trial
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



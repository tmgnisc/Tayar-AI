import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar />
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card p-8 text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="text-3xl font-bold mb-2">
                Payment Cancelled
              </CardTitle>
              <CardDescription className="text-lg mb-6">
                Your payment was cancelled. No charges were made to your account.
              </CardDescription>
              <div className="space-y-4">
                <Button
                  onClick={() => navigate("/pricing")}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  Back to Pricing
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


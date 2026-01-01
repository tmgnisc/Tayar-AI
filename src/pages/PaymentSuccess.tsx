import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const redirectDelay = 5000; // 5 seconds

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest(
          `api/payment/checkout-session/${sessionId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          token
        );

        const data = await response.json();

        if (response.ok && data.status === "complete" && data.paymentStatus === "paid") {
          // Try to manually activate subscription (fallback if webhook hasn't fired)
          try {
            const activateResponse = await apiRequest(
              `api/payment/activate-subscription/${sessionId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
              token
            );

            const activateData = await activateResponse.json();
            
            if (activateResponse.ok) {
              // Subscription activated successfully
              const planType = activateData.planType || "pro";
              
              // Update user subscription status in context
              if (user) {
                updateUser({
                  subscription_type: planType,
                  subscription_status: "active",
                });
              }

              setVerified(true);
              toast({
                title: "Payment successful!",
                description: `Your ${planType.toUpperCase()} subscription has been activated.`,
              });
            } else {
              // Payment verified but activation failed (might already be activated)
              console.warn("Activation response:", activateData);
              if (activateData.alreadyActivated) {
                setVerified(true);
                toast({
                  title: "Payment successful!",
                  description: "Your subscription is already active.",
                });
              } else {
                throw new Error(activateData.message || "Failed to activate subscription");
              }
            }
          } catch (activateError: any) {
            console.error("Activation error:", activateError);
            // Payment is verified, but activation failed - still show success
            // The webhook might activate it later
            setVerified(true);
            toast({
              title: "Payment verified!",
              description: "Your payment was successful. Subscription activation may take a moment.",
            });
          }
        } else {
          toast({
            title: "Payment verification failed",
            description: "We couldn't verify your payment. Please contact support.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Payment verification error:", error);
        toast({
          title: "Verification error",
          description: "There was an error verifying your payment. Please contact support if you were charged.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, token, user, updateUser, toast]);

  useEffect(() => {
    if (!verified) {
      return;
    }
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, redirectDelay);

    return () => clearTimeout(timer);
  }, [verified, navigate]);

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
              {loading ? (
                <>
                  <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                  <CardTitle className="text-2xl font-bold mb-2">
                    Verifying Payment...
                  </CardTitle>
                  <CardDescription>
                    Please wait while we verify your payment.
                  </CardDescription>
                </>
              ) : verified ? (
                <>
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <CardTitle className="text-3xl font-bold mb-2">
                    Payment Successful!
                  </CardTitle>
                  <CardDescription className="text-lg mb-6">
                    Thank you for your purchase. Your premium subscription has been activated.
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mb-6">
                    You&apos;ll be redirected to your dashboard in a few seconds.
                  </p>
                  <div className="space-y-4">
                    <Button
                      onClick={() => navigate("/dashboard")}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/pricing")}
                      className="w-full"
                    >
                      View Plans
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl font-bold mb-2">
                    Payment Verification
                  </CardTitle>
                  <CardDescription className="mb-6">
                    We're having trouble verifying your payment. If you were charged, please contact our support team.
                  </CardDescription>
                  <div className="space-y-4">
                    <Button
                      onClick={() => navigate("/dashboard")}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/contact")}
                      className="w-full"
                    >
                      Contact Support
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


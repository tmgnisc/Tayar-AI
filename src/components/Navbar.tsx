import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  showAuth?: boolean;
  showProfile?: boolean;
}

export const Navbar = ({ showAuth = true, showProfile = false }: NavbarProps) => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl bg-white/80 shadow-sm"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tayar.ai
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {showAuth && (
            <>
              <Link to="/auth/signin">
                <Button variant="ghost" className="hover:bg-primary/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button className="bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          {showProfile && (
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

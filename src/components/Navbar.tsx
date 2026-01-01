import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  const handleLogout = () => {
    logout();
    navigate('/auth/signin');
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border backdrop-blur-xl bg-white/80 shadow-sm"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={isAuthenticated && user.role === 'admin' ? '/admin' : isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
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

        {/* Navigation menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Features
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Contact
          </Link>
          {isAuthenticated && (
            <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {user.role === 'admin' ? 'Admin' : 'Dashboard'}
            </Link>
          )}
        </div>

        {/* User menu */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-10 h-10 cursor-pointer">
                <AvatarImage
                  src={
                    user.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`
                  }
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 mt-1 w-fit">
                      Administrator
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                  {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                </Link>
              </DropdownMenuItem>
              {user.role === 'admin' ? (
                <DropdownMenuItem asChild>
                  <Link to="/admin/domains">Domain Management</Link>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/interview/setup">Start Interview</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Edit Profile</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-4">
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
          </div>
        )}
      </div>
    </motion.nav>
  );
};

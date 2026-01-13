import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

interface AIInterviewerAvatarProps {
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
}

export const AIInterviewerAvatar = ({ 
  isSpeaking = false,
  size = "lg" 
}: AIInterviewerAvatarProps) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  // Professional AI avatar - using a modern AI assistant style
  const avatarUrl = "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=AIInterviewer&backgroundColor=3b82f6&radius=50";

  return (
    <div className="text-center">
      <motion.div
        className="relative mx-auto mb-4"
        animate={{
          scale: isSpeaking ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: isSpeaking ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Outer Glow Ring - Pulsing when speaking */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                "0 0 0 0px rgba(59, 130, 246, 0.4)",
                "0 0 0 20px rgba(59, 130, 246, 0)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}

        {/* Main Avatar Container */}
        <motion.div
          className={`${sizeClasses[size]} rounded-full relative overflow-hidden border-4 ${
            isSpeaking ? "border-blue-500" : "border-blue-600"
          }`}
          animate={{
            borderColor: isSpeaking 
              ? ["#3b82f6", "#60a5fa", "#3b82f6"]
              : "#2563eb",
          }}
          transition={{
            duration: 2,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut",
          }}
        >
          {/* Avatar Image */}
          <img
            src={avatarUrl}
            alt="AI Interviewer"
            className="w-full h-full object-cover bg-gradient-to-br from-blue-500 to-blue-700"
          />
          
          {/* Breathing Effect Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Speaking Indicator Overlay */}
          {isSpeaking && (
            <motion.div
              className="absolute inset-0 bg-blue-500/20"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>

        {/* Microphone Icon - Positioned at bottom right */}
        {isSpeaking && (
          <motion.div
            className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Volume2 className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Name Label */}
      <motion.p
        className="text-gray-300 text-sm font-medium mb-1"
        animate={{
          color: isSpeaking ? "#93c5fd" : "#d1d5db",
        }}
      >
        AI Interviewer
      </motion.p>

      {/* Status Indicator */}
      {isSpeaking && (
        <motion.div
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <motion.div
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-blue-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          />
        </motion.div>
      )}
    </div>
  );
};


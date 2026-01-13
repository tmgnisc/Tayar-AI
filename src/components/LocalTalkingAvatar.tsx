import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';

interface LocalTalkingAvatarProps {
  isSpeaking?: boolean;
  avatarImage?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Local Talking Avatar - No API required!
 * 
 * Uses animated mouth shapes synchronized with speech
 * Works completely offline and free
 */
export const LocalTalkingAvatar = ({
  isSpeaking = false,
  avatarImage = 'https://create-images-results.d-id.com/api_docs/assets/noelle.jpeg',
  size = 'lg'
}: LocalTalkingAvatarProps) => {
  const [mouthFrame, setMouthFrame] = useState(0);
  const animationRef = useRef<NodeJS.Timeout>();

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  // Animate mouth when speaking
  useEffect(() => {
    if (isSpeaking) {
      // Cycle through mouth shapes for talking animation
      animationRef.current = setInterval(() => {
        setMouthFrame((prev) => (prev + 1) % 6); // 6 mouth shapes
      }, 150); // Change mouth shape every 150ms
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      setMouthFrame(0); // Closed mouth when not speaking
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isSpeaking]);

  // Mouth shapes for animation (using emoji or custom SVG)
  const mouthShapes = ['⚪', '🔵', '🟣', '🔴', '🟠', '🟡']; // Placeholder - replace with actual mouth SVGs

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
          ease: 'easeInOut',
        }}
      >
        {/* Outer Glow Ring */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full z-0"
            animate={{
              boxShadow: [
                '0 0 0 0px rgba(59, 130, 246, 0.4)',
                '0 0 0 20px rgba(59, 130, 246, 0)',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Main Avatar Container */}
        <div
          className={`${sizeClasses[size]} rounded-full relative overflow-hidden border-4 ${
            isSpeaking ? 'border-blue-500' : 'border-blue-600'
          }`}
        >
          {/* Base Avatar Image */}
          <img
            src={avatarImage}
            alt="AI Interviewer"
            className="w-full h-full object-cover"
          />

          {/* Animated Mouth Overlay */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                {/* Mouth Animation Area */}
                <motion.div
                  className="w-12 h-8 bg-gradient-to-b from-red-400 to-red-600 rounded-full opacity-80"
                  animate={{
                    scaleY: [1, 1.5, 1.2, 1.3, 1],
                    scaleX: [1, 0.9, 1.1, 0.95, 1],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Speaking Effect Overlay */}
          {isSpeaking && (
            <motion.div
              className="absolute inset-0 bg-blue-500/10"
              animate={{
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>

        {/* Speaking Icon */}
        {isSpeaking && (
          <motion.div
            className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-10"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
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
          color: isSpeaking ? '#93c5fd' : '#d1d5db',
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
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};


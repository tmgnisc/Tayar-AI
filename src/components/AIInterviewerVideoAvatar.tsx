import { motion } from "framer-motion";
import { Volume2, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AIInterviewerVideoAvatarProps {
  isSpeaking?: boolean;
  videoUrl?: string; // URL to video avatar (from D-ID, HeyGen, or local)
  fallbackAvatarUrl?: string; // Static image when not speaking
  size?: "sm" | "md" | "lg";
}

/**
 * AI Interviewer Video Avatar Component
 * 
 * Features:
 * - Supports video avatars from services like D-ID, HeyGen, Synthesia
 * - Falls back to animated static avatar when video is not available
 * - Smooth transitions between speaking and idle states
 * 
 * Future Integration Options:
 * 1. D-ID (https://www.d-id.com/) - Talking head videos from images
 * 2. HeyGen (https://www.heygen.com/) - AI video avatars
 * 3. Synthesia (https://www.synthesia.io/) - AI video generation
 * 4. Wav2Lip - Local lip-sync solution
 * 
 * Usage:
 * <AIInterviewerVideoAvatar 
 *   isSpeaking={voiceStatus === 'speaking'}
 *   videoUrl="https://example.com/avatar-video.mp4"
 *   fallbackAvatarUrl="https://example.com/avatar-static.jpg"
 * />
 */
export const AIInterviewerVideoAvatar = ({ 
  isSpeaking = false,
  videoUrl,
  fallbackAvatarUrl = "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=AIInterviewer&backgroundColor=3b82f6&radius=50",
  size = "lg" 
}: AIInterviewerVideoAvatarProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [useVideo, setUseVideo] = useState(!!videoUrl);

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      console.log('[Video Avatar] Video URL loaded, attempting to play...');
      // Auto-play video when loaded
      videoRef.current.play().catch(err => {
        console.error("[Video Avatar] Error playing video:", err);
        setUseVideo(false);
      });
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      // Control playback based on speaking status
      if (isSpeaking) {
        videoRef.current.play().catch(err => {
          console.error("[Video Avatar] Error playing video:", err);
        });
      } else {
        // Keep playing but you can pause if needed
        // videoRef.current.pause();
        // videoRef.current.currentTime = 0;
      }
    }
  }, [isSpeaking, videoUrl]);

  const handleVideoLoad = () => {
    console.log('[Video Avatar] ✅ Video loaded successfully');
    setIsVideoLoaded(true);
  };

  const handleVideoError = (e: any) => {
    console.error("[Video Avatar] ❌ Error loading video:", e);
    console.error("[Video Avatar] Video URL was:", videoUrl);
    setUseVideo(false);
  };

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
            className="absolute inset-0 rounded-full z-0"
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
          {/* Video Avatar (when available) */}
          {useVideo && videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              className={`w-full h-full object-cover absolute inset-0 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              autoPlay
              playsInline
              loop
            />
          )}

          {/* Static Avatar (fallback when no video) */}
          {(!useVideo || !videoUrl) && (
            <img
              src={fallbackAvatarUrl}
              alt="AI Interviewer"
              className="w-full h-full object-cover bg-gradient-to-br from-blue-500 to-blue-700"
            />
          )}
          
          {/* Breathing Effect Overlay */}
          {!isSpeaking && (
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
          )}

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

        {/* Video Icon - Shows when using video */}
        {useVideo && videoUrl && (
          <motion.div
            className="absolute top-2 left-2 w-8 h-8 bg-blue-600/80 rounded-full flex items-center justify-center shadow-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Video className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Speaking Icon - Positioned at bottom right */}
        {isSpeaking && (
          <motion.div
            className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg z-10"
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


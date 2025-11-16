/**
 * Voice Interview Service using Web Speech API
 * Handles speech-to-text and text-to-speech for AI interviews
 */

interface VoiceInterviewCallbacks {
  onTranscript?: (text: string, isUser: boolean) => void;
  onStatusChange?: (status: 'idle' | 'listening' | 'speaking' | 'processing' | 'ended') => void;
  onError?: (error: Error) => void;
}

export class VoiceInterviewService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private isSpeaking = false;
  private callbacks: VoiceInterviewCallbacks;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; text: string }> = [];

  constructor(callbacks: VoiceInterviewCallbacks = {}) {
    this.callbacks = callbacks;
    this.synthesis = window.speechSynthesis;
    
    // Load voices when they become available
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }

    // Initialize Speech Recognition (Web Speech API)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          this.conversationHistory.push({ role: 'user', text: finalTranscript.trim() });
          this.callbacks.onTranscript?.(finalTranscript.trim(), true);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.callbacks.onError?.(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Auto-restart if we're still supposed to be listening
          try {
            this.recognition.start();
          } catch (error) {
            // Recognition might already be starting
          }
        }
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser');
    }
  }

  /**
   * Start the interview - request microphone permission and begin listening
   */
  async start(): Promise<void> {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!this.recognition) {
        throw new Error('Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      }

      this.isListening = true;
      this.recognition.start();
      this.callbacks.onStatusChange?.('listening');
    } catch (error: any) {
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  /**
   * Stop listening to the user
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  /**
   * Start listening to the user
   */
  startListening(): void {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      try {
        this.recognition.start();
        this.callbacks.onStatusChange?.('listening');
      } catch (error) {
        // Recognition might already be running
        console.warn('Recognition already running');
      }
    }
  }

  /**
   * Speak text using Text-to-Speech
   */
  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech Synthesis API is not supported in this browser'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Slightly slower for clarity and better understanding
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a better voice if available
      // Voices might not be loaded immediately, so we try to get them
      let voices = this.synthesis.getVoices();
      
      // If no voices available, wait a bit and try again
      if (voices.length === 0) {
        // Voices might load asynchronously
        voices = this.synthesis.getVoices();
      }
      
      if (voices.length > 0) {
        // Prefer clearer voices for interview
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Samantha') || voice.name.includes('Google'))
        ) || voices.find(voice => voice.lang.startsWith('en-US'));
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.callbacks.onStatusChange?.('speaking');
        // Stop listening while speaking
        this.stopListening();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.callbacks.onStatusChange?.('listening');
        // Resume listening after speaking
        this.startListening();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.callbacks.onStatusChange?.('listening');
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Add assistant message to conversation history
   */
  addAssistantMessage(text: string): void {
    this.conversationHistory.push({ role: 'assistant', text });
    this.callbacks.onTranscript?.(text, false);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{ role: 'user' | 'assistant'; text: string }> {
    return [...this.conversationHistory];
  }

  /**
   * Get conversation transcript (for saving)
   */
  getTranscript(): string {
    return this.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`)
      .join('\n\n');
  }

  /**
   * End the interview and clean up
   */
  end(): void {
    this.stopListening();
    this.synthesis.cancel();
    this.isListening = false;
    this.isSpeaking = false;
    this.callbacks.onStatusChange?.('ended');
  }

  /**
   * Check if currently speaking
   */
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }
}


/**
 * Vapi Client Service
 * Handles WebRTC connection to Vapi for web-based voice calls
 */

interface VapiCallConfig {
  callId: string;
  apiKey: string;
  onTranscript?: (text: string) => void;
  onStatusChange?: (status: string) => void;
  onError?: (error: Error) => void;
}

class VapiClient {
  private callId: string;
  private apiKey: string;
  private pc: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onTranscript?: (text: string) => void;
  private onStatusChange?: (status: string) => void;
  private onError?: (error: Error) => void;
  private isConnected: boolean = false;

  constructor(config: VapiCallConfig) {
    this.callId = config.callId;
    this.apiKey = config.apiKey;
    this.onTranscript = config.onTranscript;
    this.onStatusChange = config.onStatusChange;
    this.onError = config.onError;
  }

  /**
   * Start the Vapi call connection
   */
  async start(): Promise<void> {
    try {
      this.onStatusChange?.('connecting');
      
      // Get user media (microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Initialize WebRTC
      await this.initializeWebRTC();

      this.onStatusChange?.('connected');
      this.isConnected = true;
    } catch (error: any) {
      console.error('[VapiClient] Error starting call:', error);
      this.onError?.(error);
      throw error;
    }
  }

  /**
   * Initialize WebRTC connection to Vapi
   */
  private async initializeWebRTC(): Promise<void> {
    // Create RTCPeerConnection with Vapi's STUN servers
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc?.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    this.pc.ontrack = (event) => {
      console.log('[VapiClient] Received remote track');
      this.remoteStream = event.streams[0];
      this.playRemoteAudio(this.remoteStream);
    };

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[VapiClient] ICE candidate:', event.candidate);
        // Send ICE candidate to Vapi via WebSocket
        this.sendIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      console.log('[VapiClient] Connection state:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        this.onStatusChange?.('active');
      } else if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
        this.onStatusChange?.('disconnected');
      }
    };

    // Connect to Vapi WebSocket for signaling
    await this.connectWebSocket();

    // Create and send offer
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });

    await this.pc.setLocalDescription(offer);
    this.sendOffer(offer);
  }

  /**
   * Connect to Vapi WebSocket for signaling
   * Vapi uses a specific WebSocket endpoint format for web calls
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // First, try to get call connection details from Vapi API
        const response = await fetch(`https://api.vapi.ai/call/${this.callId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get call details: ${response.statusText}`);
        }

        const callData = await response.json();
        console.log('[VapiClient] Call data:', callData);

        // Vapi web calls typically use WebSocket for signaling
        // The WebSocket URL might be in the call response or we construct it
        // Try different possible WebSocket endpoints
        const wsUrl = callData.websocketUrl || 
                     `wss://api.vapi.ai/websocket/call/${this.callId}?token=${this.apiKey}` ||
                     `wss://api.vapi.ai/call/${this.callId}/connect?apiKey=${this.apiKey}`;

        console.log('[VapiClient] Connecting to WebSocket:', wsUrl);
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[VapiClient] WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = typeof event.data === 'string' 
              ? JSON.parse(event.data) 
              : event.data;
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('[VapiClient] Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[VapiClient] WebSocket error:', error);
          // Don't reject immediately - WebSocket might still connect
        };

        this.ws.onclose = (event) => {
          console.log('[VapiClient] WebSocket closed:', event.code, event.reason);
          if (event.code !== 1000) {
            // Unexpected close
            this.onStatusChange?.('disconnected');
            if (!this.isConnected) {
              reject(new Error(`WebSocket connection failed: ${event.reason || 'Unknown error'}`));
            }
          }
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error: any) {
        console.error('[VapiClient] Error connecting WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket messages from Vapi
   */
  private async handleWebSocketMessage(message: any): Promise<void> {
    console.log('[VapiClient] Received message:', message);

    if (message.type === 'answer' && message.sdp && this.pc) {
      // Set remote description (answer from Vapi)
      await this.pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'ice-candidate' && message.candidate && this.pc) {
      // Add ICE candidate from Vapi
      await this.pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    } else if (message.type === 'transcript' && message.text) {
      // Handle transcript updates
      this.onTranscript?.(message.text);
    } else if (message.type === 'status') {
      // Handle status updates
      this.onStatusChange?.(message.status);
    }
  }

  /**
   * Send offer to Vapi
   */
  private sendOffer(offer: RTCSessionDescriptionInit): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'offer',
        sdp: offer.sdp,
      }));
    }
  }

  /**
   * Send ICE candidate to Vapi
   */
  private sendIceCandidate(candidate: RTCIceCandidate): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ice-candidate',
        candidate: {
          candidate: candidate.candidate,
          sdpMLineIndex: candidate.sdpMLineIndex,
          sdpMid: candidate.sdpMid,
        },
      }));
    }
  }

  /**
   * Play remote audio stream
   */
  private playRemoteAudio(stream: MediaStream): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const audioElement = new Audio();
    audioElement.srcObject = stream;
    audioElement.autoplay = true;
    audioElement.play().catch((error) => {
      console.error('[VapiClient] Error playing audio:', error);
    });

    // Also create an audio element for easier control
    document.body.appendChild(audioElement);
    audioElement.id = 'vapi-remote-audio';
  }

  /**
   * Mute/unmute microphone
   */
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      return audioTracks[0]?.enabled ?? false;
    }
    return false;
  }

  /**
   * End the call
   */
  async end(): Promise<void> {
    try {
      this.onStatusChange?.('ending');

      // Close WebSocket
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      // Close WebRTC connection
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
        this.localStream = null;
      }

      // Close audio context
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      // Remove audio element
      const audioElement = document.getElementById('vapi-remote-audio');
      if (audioElement) {
        audioElement.remove();
      }

      this.isConnected = false;
      this.onStatusChange?.('ended');
    } catch (error) {
      console.error('[VapiClient] Error ending call:', error);
      this.onError?.(error as Error);
    }
  }

  /**
   * Check if connected
   */
  getConnected(): boolean {
    return this.isConnected;
  }
}

export default VapiClient;


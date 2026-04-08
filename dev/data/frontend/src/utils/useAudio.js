// utils/audioUtils.js

export class AudioManager {
  constructor() {
    this.mediaStream = null;
    this.audioContext = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.isMuted = false;
  }

  // Initialize microphone and audio context
  async initMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.setupAudioContext();
      return true;
    } catch (error) {
      console.error('Microphone error:', error);
      throw error;
    }
  }

  // Setup audio context for mute control
  async setupAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.gainNode = this.audioContext.createGain();
    
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = 1; // Start unmuted
    
    await this.audioContext.resume();
  }

  // Toggle mute/unmute
  toggleMute() {
    if (!this.gainNode) return;
    
    this.isMuted = !this.isMuted;
    this.gainNode.gain.value = this.isMuted ? 0 : 1;
		console.log('gain value is:', this.gainNode.gain.value)
    return this.isMuted;
  }

  // Get current mute state
  getMuteState() {
    return this.isMuted;
  }

  // Cleanup all resources
  cleanup() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isMuted = false;
  }
}

// Check if browser supports required APIs
export const isAudioSupported = () => {
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
  
  return hasGetUserMedia && hasAudioContext;
};
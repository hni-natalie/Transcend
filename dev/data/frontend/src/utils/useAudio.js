// utils/audioUtils.js
import { LocalAudioTrack, Track } from 'livekit-client';

export class AudioManager {
  constructor() {
    this.room = null;
    this.mediaStream = null;
    this.isMuted = false;
    this.localPublication = null;
    // this.audioContext = null;
    // this.sourceNode = null;
    // this.gainNode = null;
  }

  // Initialize microphone and audio context
  async initMicrophone(room) {
    try {
      this.room = room;
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // publish to livekit
      const audioTrack = new LocalAudioTrack(this.mediaStream.getAudioTracks()[0]);
      this.localPublication = await this.room.localParticipant.publishTrack(audioTrack);
      // await this.setupAudioContext();
      return true;
    } catch (error) {
      console.error('Microphone error:', error);
      throw error;
    }
  }

  // Setup audio context for mute control
  // async setupAudioContext() {
  //   const AudioContext = window.AudioContext || window.webkitAudioContext;
  //   this.audioContext = new AudioContext();
  //   this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
  //   this.gainNode = this.audioContext.createGain();
    
  //   this.sourceNode.connect(this.gainNode);
  //   // this.gainNode.connect(this.audioContext.destination);
  //   this.gainNode.gain.value = 1; // Start unmuted
    
  //   await this.audioContext.resume();
  // }

  // Toggle mute/unmute
  toggleMute() {
    if (!this.room) {
      console.log('class AudioManager:toggleMute: this.room not found!')
      return false;
    }
    this.isMuted = !this.isMuted;
    
    if (!this.isMuted) // mute == 0
      this.localPublication.unmute();
    else
      this.localPublication.mute();
    
    console.log(this.isMuted ? '🔴 Muted (others cannot hear you)' : '🟢 Unmuted (others can hear you)');
    return this.isMuted;
  }

  // Get current mute state
  getMuteState() {
    return this.isMuted;
  }

  // Cleanup all resources
  cleanup() {
    if (this.room) {
      this.room.localParticipant.setMicrophoneEnabled(false);
      this.room = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.localPublication) {
      this.localPublication.track.stop();
      this.localPublication = null;
    }
    
    this.isMuted = false;
  }
}

// Check if browser supports required APIs
export const isAudioSupported = () => {
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  // const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext);
  
  return hasGetUserMedia;
  // return hasGetUserMedia && hasAudioContext;
};
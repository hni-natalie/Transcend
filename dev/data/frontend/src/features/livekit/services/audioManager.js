// utils/audioUtils.js
import { LocalAudioTrack, Track } from 'livekit-client';
import * as THREE from 'three';

export class AudioManager {
  constructor() {
    this.room = null;
    this.mediaStream = null;
    this.isMuted = false;
    this.listener = new THREE.AudioListener;
  }

  setRoom(room) {
    this.room = room;
  }

  async resumeListener() {
		if (this.listener.context.state === 'suspended') {
			await this.listener.context.resume();
			console.log("handleJoin: Audio listener status: ", this.listener.context.state);
		}
    // else {
    //   //debug
	  //   console.error("handleJoin: Audio listener already running: ", this.listener.context.state);
		// }
  }

  // Initialize microphone and audio context

  // Toggle mute/unmute
  toggleMute() {
    if (!this.room) {
      console.log('class AudioManager:toggleMute: this.room not found!')
      return false;
    }
    this.isMuted = !this.isMuted;
    this.room.localParticipant.setMicrophoneEnabled(!this.isMuted);
    
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
/*
 services/livekitService.js - SINGLETON (persists across component unmounts)

 Livekit service, handles tokens & audio streaming
 init tokens done by socket.io in ContextSocket.tsx
 with audio stream input
 future need to separate messaging & audio room (prob)
*/

import { Room } from 'livekit-client';
import { AudioManager } from '../utils/useAudio';

class LiveKitService {
  constructor() {
    this.init();
    this.room = null;
    // this.rooms = new Map();
    
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.audioManager = new AudioManager();
    this.listeners = new Map();
  }

  init() {
    // Listen for LiveKit connection events from ContextSocket
    window.addEventListener('livekit-connect', async (event) => {
      try {
        console.log('Hello from livekit-connect service');
        // console.log('detail:', event.detail);
        await this.connectToRoom(event.detail);
        console.log('livekit-connect: Successfully joined room');
        window.dispatchEvent(new CustomEvent('livekit-connect-success', {
          detail: { success: true }
          // detail: { success: true, data: event.detail }
        }));

      } catch (error) {
        console.error('Failed to connect:', error);
        window.dispatchEvent(new CustomEvent('livekit-connect-error', {
          detail: { success: false, error: error }
        }));
      }
    });
    
    window.addEventListener('room-error', (event) => {
      this.dispatchEvent(new CustomEvent('error', { detail: event.detail }));
    });
  }

  // just unpack 'token'
  async connectToRoom({ token }) {
		// debug
		console.log('VITE_LIVEKIT_URL: ', import.meta.env.VITE_LIVEKIT_URL)

    // Only get token if needed
    // this should emit using ContextSocket
    // let token = this.cachedToken;
    // this.cachedToken = token;

    try {

      // this is done in backend + frontend socket alrd
      // if (!token || this.tokenExpiry < Date.now()) {
      //   const response = await fetch(`/api/lk/token?roomName=${roomName}&participantName=${participantName}`);
      //   const data = await response.json();
      //   token = data.token;
      //   this.cachedToken = token;
      //   // Date.now returns time in millisecs, then +6hrs in millisecs
      //   this.tokenExpiry = Date.now() + 6 * 60 * 60 * 1000;
      // }
      
      // Reuse existing room if possible
      if (this.room && this.room.state === 'connected') {
        console.log('Reusing existing connection');
      } else {
        this.room = new Room();
        // send a audio stream to init connection
        await this.audioManager.initMicrophone();
        await this.room.connect(import.meta.env.VITE_LIVEKIT_URL, token);
      }
      this.emit('connected', { room: this.room });
      return { success: true, room: this.room };
      
    } catch (error) {
      console.error('Livekit Service: Connection failed:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.room?.state === 'connected',
      roomState: this.room?.state || 'disconnected',
      roomName: this.room?.name || null
    };
  }

  disconnectFromRoom() {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
      this.emit('disconnected', { room: this.room });
      this.audioManager.cleanup();
      console.log('Disconnected from room');
    }
  }

  toggleMute() {
    if (this.audioManager) {
      return this.audioManager.toggleMute();
    }
  }

  // Event handlers
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    } else {
      this.listeners[event] = [callback];
      console.log(`📡 on: Created new listener for ${event}`);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else
    console.log(`📡 off: No listeners found for ${event}`);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
      console.log(`📡 emit: Emitting event: ${event}`, data);
    } else
    console.log(`📡 emit: No listeners found for ${event}`);
  }
}

export default new LiveKitService();
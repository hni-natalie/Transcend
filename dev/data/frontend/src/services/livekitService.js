// services/livekitService.js - SINGLETON (persists across component unmounts)
import { Room } from 'livekit-client';


class LiveKitService {
  constructor() {
    this.room = null;
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.listeners = new Map();
  }

  async connectToRoom(roomName, participantName) {
		// debug
		console.log('VITE_LIVEKIT_URL: ', import.meta.env.VITE_LIVEKIT_URL)

    // Only get token if needed
    let token = this.cachedToken;
    
    if (!token || this.tokenExpiry < Date.now()) {
      const response = await fetch(`/api/lk/token?roomName=${roomName}&participantName=${participantName}`);
      const data = await response.json();
      token = data.token;
      this.cachedToken = token;
			// Date.now returns time in millisecs, then +6hrs in millisecs
      this.tokenExpiry = Date.now() + 6 * 60 * 60 * 1000;
    }
    
    // Reuse existing room if possible
    if (this.room && this.room.state === 'connected') {
      console.log('Reusing existing connection');
      return { success: true, room: this.room };
    }
    
    this.room = new Room();
		await navigator.mediaDevices.getUserMedia({ audio: true });
    await this.room.connect(import.meta.env.VITE_LIVEKIT_URL, token);
    return { success: true, room: this.room };
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
      console.log('Disconnected from room');
    }
  }

  // Event handlers
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export default new LiveKitService();
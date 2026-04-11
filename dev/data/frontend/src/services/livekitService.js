/*
 services/livekitService.js - SINGLETON (persists across component unmounts)

 Livekit service, handles tokens & audio streaming
 init tokens done by socket.io in ContextSocket.tsx
 with audio stream input
 future need to separate messaging & audio room (prob)
*/

import { Room, RoomEvent, Track } from 'livekit-client';
import { AudioManager } from '../utils/useAudio';

class LiveKitService {
  constructor() {
    this.init();
    this.room = null;
    this.audioElements = new Map();         // map for all audio tracks in room
    this.audioManager = new AudioManager(); // manage own audio mic, mute state
    this.listeners = new Map();
  }

  init() {
    // Listen for LiveKit connection events from ContextSocket
    window.addEventListener('livekit-connect', async (event) => {
      try {
        // console.log('Hello from livekit-connect service');
        // console.log('detail:', event.detail);
        await this.connectToRoom(event.detail);
        console.log('livekit-connect: Successfully joined room');
        window.dispatchEvent(new CustomEvent('livekit-connect-success', {
          detail: { success: true }
        }));

      } catch (error) {
        console.error('Failed to connect:', error);
        window.dispatchEvent(new CustomEvent('livekit-connect-error', {
          detail: { success: false, error: error }
        }));
      }
    });
    
    window.addEventListener('room-error', (event) => {
      console.log('Error! ', event.detail);
    });
  }

  // just unpack 'token'
  async connectToRoom({ token }) {
		// debug
		console.log('VITE_LIVEKIT_URL: ', import.meta.env.VITE_LIVEKIT_URL)
    try {
      // Reuse existing room if possible
      if (this.room && this.room.state === 'connected') {
        console.log('Reusing existing connection');
      } else {
        this.room = new Room();

        /* *************************************************************
         * Set up Listeners
         * *************************************************************/
        // Set up audio element for remote tracks
        this.room.on(RoomEvent.TrackSubscribed, (track, publication, remoteParticipants) => {
          console.log(`Track subscribed from ${remoteParticipants.identity}`);
          
          if (track.kind === Track.Kind.Audio) {
            console.log(`Check audio participant ${remoteParticipants.identity}`);
            const audioElement = track.attach();
            audioElement.autoplay = true;
            audioElement.volume = 1.0;
            // store this element to mute individual participants later
            this.audioElements.set(remoteParticipants.identity, audioElement);
          }
        });
        
        this.room.on(RoomEvent.TrackUnsubscribed, (track, remoteParticipants) => {
          if (track.kind === Track.Kind.Audio) {
            const audioElement = this.audioElements.get(remoteParticipants.identity);
            if (audioElement) {
              audioElement.remove();
              audioElements.delete(remoteParticipants.identity);
            }
            track.detach(); // Clean up audio elements
            console.log('cleaning up audio ...')
          }
        });

        this.room.on(RoomEvent.TrackMuted, (publication, participant) => {
          console.log(`${participant.identity} muted their ${publication.kind} track`);
          // Update UI to show muted state
        });

        this.room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
          console.log(`${participant.identity} unmuted their ${publication.kind} track`);
          // Update UI to show unmuted state
        });

        // Run once when room connected Check existing participants
        this.room.once(RoomEvent.Connected, () => {
          console.log('Room connected, participants in room:', this.room.remoteParticipants);
        });

        /* *************************************************************
         * Connect to room
         * *************************************************************/
        await this.room.connect(import.meta.env.VITE_LIVEKIT_URL, token);
        await this.audioManager.initMicrophone(this.room);
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

  // returns the mute setting: 0,1
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
/*
 services/livekitService.js - SINGLETON (persists across component unmounts)

 Livekit service, handles tokens & audio streaming
 init tokens done by socket.io in useSocket.tsx
 with audio stream input
 future need to separate messaging & audio room (prob)
*/

import { Room, RoomEvent, Track } from 'livekit-client';
import { AudioManager } from './audioManager';
import * as THREE from 'three';

class LiveKitService {
  constructor() {
    this.room = null;
    this.audioElements = new Map();         // map for all audio tracks in room
    this.mediaStreams = new Map();          // map for all media streams in room
    this.positionalAudios = new Map();      // map for all positional audios in room
    this.audioManager = new AudioManager(); // manage own audio mic, mute state
    this.listeners = new Map();             // event listener
    this.isInitialized = false;
  }
  /*
    mode must be either "room" || "call"
    room: spatial audio, call: non spatial audio
  */
  init( mode ) {
    if (this.isInitialized) return ;

    // Listen for LiveKit connection events from useSocket
    window.addEventListener('livekit-connect', async (event) => {
      try {
        // emits connected signal to useLiveKit
        await this.connectToRoom(event.detail, mode);
        console.log('livekit-connect: Successfully joined room');
        this.isInitialized = true;

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

  // setup room audio for remote participants
  async setupRoomAudio(key, mediaStream) {
    await this.audioManager.resumeListener(); // .resume
    if (this.audioManager.listener.context.state !== 'running')
      console.error('AudioContext not running ', key);

    const positionalAudio = new THREE.PositionalAudio(this.audioManager.listener); // add local listener to positional audio
    positionalAudio.setRefDistance(2);     // Reference distance for volume falloff
    positionalAudio.setMaxDistance(4);     // Max audible distance
    positionalAudio.setRolloffFactor(8); // How quickly volume decreases
    positionalAudio.setDistanceModel('inverse'); // More natural distance falloff

    if (mediaStream) {

        const audioElement = new Audio();
        audioElement.srcObject = mediaStream;
        audioElement.muted = true;  // Mute the element so it doesn't double-play
        audioElement.autoplay = true; // Start playback immediately
        this.audioElements.set(key, audioElement);

        positionalAudio.setVolume(1);
        positionalAudio.isPlaying = true;
        positionalAudio.setMediaStreamSource(audioElement.srcObject);
        this.positionalAudios.set(key, positionalAudio);

      // debug section
      const ctx = this.audioManager.listener.context;
      console.log('[audio] context state:', ctx.state);
      console.log('[audio] gain value:', positionalAudio.gain.gain.value);
      console.log('[audio] isPlaying:', positionalAudio.isPlaying);
      console.log('[audio] panner type:', positionalAudio.panner?.panningModel);
      mediaStream.getAudioTracks().forEach(t => 
        console.log('[audio] track:', t.label, 'enabled:', t.enabled, 'muted:', t.muted, 'readyState:', t.readyState)
      );
    }
      // debug section
      if (positionalAudio.isPlaying) {
        console.log("✅ Positional Audio is currently playing");
      } else
        console.error("Positional Audio is not playing");
      const pa = this.positionalAudios.get(key);
      console.log('[audio] panner position:', pa.panner.positionX?.value, pa.panner.positionY?.value, pa.panner.positionZ?.value);
      console.log('[audio] listener position:', this.audioManager.listener.position);
      console.warn('[audio] positionalAudio parent:', pa.parent?.name ?? 'NO PARENT — not in scene graph');
  }

  // this runs everytime when a track is subscribed
  async handleRoom(track, remoteParticipants) {
    const mediaStream = track.mediaStream;
    this.mediaStreams.set(remoteParticipants.identity, mediaStream);
    // --------------------------------------------------------

    // kiv
    // const audioTrack = mediaStream?.getAudioTracks()[0];
    // if (audioTrack) {
    //   if (audioTrack.muted) {
    //     console.log('[audio] waiting for RTP flow...');
    //     await new Promise((resolve) => {
    //       // This fires when the browser starts receiving RTP packets
    //       audioTrack.addEventListener('unmute', () => {
    //         console.log('[audio] RTP flowing, muted:', audioTrack.muted);
    //         resolve();
    //       }, { once: true });
    //       // Safety net — if unmute never fires something else is wrong
    //       setTimeout(() => {
    //         console.warn('[audio] unmute timeout, muted still:', audioTrack.muted);
    //         resolve();
    //       }, 5000);
    //     });
    //   } else {
    //     console.log('[audio] track already live, muted:', audioTrack.muted);
    //   }
    // }
    // --------------------------------------------------------
    await this.setupRoomAudio(remoteParticipants.identity, mediaStream);
    this.emit('audio-track-subscribed', { id: remoteParticipants.identity });

    // debug
    const tstream = this.mediaStreams.get(remoteParticipants.identity);
    if (tstream instanceof MediaStream) {
      console.log('Local: Valid MediaStream! ', remoteParticipants.identity);
    }
    else {
      console.error('Local: Invalid media stream');
    }
  }

  handleLeaveRoom(track, remoteParticipants) {
    const mediaStream = this.mediaStreams.get(remoteParticipants.identity);
    if (mediaStream) {
      this.mediaStreams.delete(remoteParticipants.identity);
      console.log("Removed media stream ", remoteParticipants.identity);
    }
    const positionalAudio = this.positionalAudios.get(remoteParticipants.identity);
    if (positionalAudio) {
      positionalAudio.isPlaying = false;
      positionalAudio.disconnect();
      // positionalAudio.parent.remove(positionalAudio);

      this.positionalAudios.delete(remoteParticipants.identity);
      console.log("Removed positional audio ", remoteParticipants.identity);
    }
    const audioElement = this.audioElements.get(remoteParticipants.identity);
    if (audioElement) {
      audioElement.remove();
      this.audioElements.delete(remoteParticipants.identity);
      console.log("Removed audio element ", remoteParticipants.identity);
    }

    this.emit('audio-track-unsubscribed', { id: remoteParticipants.identity });
  }


  handleCall(track, remoteParticipants) {
    const audioElement = track.attach(); // creates HTML audio element so that player voice is heard
    audioElement.autoplay = true;
    audioElement.volume = 1.0;
    // store this element to mute individual participants later
    this.audioElements.set(remoteParticipants.identity, audioElement);
  }

  handleLeaveCall(track, remoteParticipants) {
    const audioElement = this.audioElements.get(remoteParticipants.identity);
    if (audioElement) {
      audioElement.remove();
      this.audioElements.delete(remoteParticipants.identity);
    }
    track.detach(); // Clean up audio elements
    // console.log('cleaning up audio ...')
  }
  /*
    mode has to be "room" || "call"
    room -> creates a room with spatial audio
    call -> creates a room with default call audio
    get token from backend and handle frontend room creation
  */
  async connectToRoom({ token }, mode) {
		// debug
		// console.log('VITE_LIVEKIT_URL: ', import.meta.env.VITE_LIVEKIT_URL)
    try {
      // Reuse existing room if possible
      if (this.room && this.room.state === 'connected') {
        console.log('Reusing existing connection');
      } else {
        this.room = new Room();

        /* *************************************************************
         * Set up Listeners for remote track
         * *************************************************************/
        this.room.on(RoomEvent.TrackSubscribed, (track, publication, remoteParticipants) => {
          console.log(`Track subscribed from ${remoteParticipants.identity}`);
          
          if (track.kind === Track.Kind.Audio) {
            // console.log(`Check audio participant ${remoteParticipants.identity}`);
            if (mode === "call")
              this.handleCall(track, remoteParticipants);
            else if (mode === "room") {
              this.handleRoom(track, remoteParticipants);
            }
          }
        });
        
        this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, remoteParticipants) => {
          if (track.kind === Track.Kind.Audio) {
            if (mode === "call")
              this.handleLeaveCall(track, remoteParticipants);
            else if (mode === "room")
              this.handleLeaveRoom(track, remoteParticipants);
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
        try {
          await this.room.connect(import.meta.env.VITE_LIVEKIT_URL, token);
          await this.audioManager.initMicrophone(this.room);
        } catch (error) {
          console.error('LiveKit connection failed:', error);
          window.location.reload();
        }
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

  // cleanup
  async disconnectFromRoom() {
    if (this.room) {
      try {
        await this.room.disconnect();
        this.room = null;
        this.emit('disconnected', { room: this.room });
        this.audioManager.cleanup();
        this.mediaStreams.clear();
        this.positionalAudios.clear();
        console.log('Disconnected from room');
      } catch (error) {
        console.error('Disconnection failed: ', error, ' reloading page...');
        window.location.reload();
      }
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

export const livekitService = new LiveKitService();

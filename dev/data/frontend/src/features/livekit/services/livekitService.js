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

/*
for reference:
  interface LiveKitState {
    isConnectedRoom: boolean;
    activePlane: number;
    isMuted: boolean;
    joinCount: number;
    isLoading: boolean;
    readyStreams: Set<string>;
  }
*/

class LiveKitService {
  constructor() {
    this._room = null;
    this.audioElements = new Map();         // map for all audio tracks in room
    this.mediaStreams = new Map();          // map for all media streams in room
    this.positionalAudios = new Map();      // map for all positional audios in room
    this.audioManager = new AudioManager(); // manage own audio mic, mute state
    this.listeners = new Map();             // event listener
    this.isInitialized = false;
    this._state = {
      isConnectedRoom: false,
      activePlane: null,
      isMuted: false,
      joinCount: 0,
      isLoading: false,
      readyStreams: new Set(),
      error: null
    }
  }

  get isConnectedRoom() { return this._state.isConnectedRoom; }
  get activePlane() { return this._state.activePlane; }
  get isMuted() { return this._state.isMuted; }
  get joinCount() { return this._state.joinCount; }
  get isLoading() { return this._state.isLoading; }
  get readyStreams() { return this._state.readyStreams; }
  get lkRoom() { return this._room; }
  get error() { return this._state.error; }

  _setState(updates) {
    this._state = { ...this._state, ...updates };
    this.emit('stateChange', this._state);
  }
  
  getState(){
    return { ...this._state };
  }

  setError(error) {
    this._setState({ error, isLoading: false, });
  }

  clearError() {
    this._setState({ error: null, });
  }

  setActivePlane(index){
      this._setState({ activePlane:index });
  }

  setIsConnectedRoom(status){
    this._setState({ isConnectedRoom:status });
  }

  setIsLoading(status) {
      this._setState({ isLoading:status });
  }

  setIsMuted(status) {
      this._setState({ isMuted:status });
  }

  setJoinCount(count) {
      this._setState({ joinCount:count });
  }

  setReadyStreams(id) {
    const newSet = new Set(this._state.readyStreams);
    newSet.add(id);
    this._setState({ readyStreams:newSet });
  }

  deleteReadyStreams(id) {
    const newSet = new Set(this._state.readyStreams);
    newSet.delete(id);
    this._setState({ readyStreams:newSet });
  }

  /*
    mode must be either "room" || "call" || "video"
    room: spatial audio, call: non spatial audio, video: video call
  */
  init( mode ) {
    if (this.isInitialized) return ;

    // Listen for LiveKit connection events from useSocket
    window.addEventListener('livekit-connect', async (event) => {
      try {
        // emits connected signal to useLiveKit
        await this.connectToRoom(event.detail, mode);
        this.isInitialized = true;
        // this.lkToken = event.detail;
        // console.log('livekit-connect: Successfully joined room: ', this.lkToken);

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
    positionalAudio.setRefDistance(2);        // Volume starts decrease after this distance
    positionalAudio.setRolloffFactor(8);      // How quickly volume decreases
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
    // this.emit('audio-track-subscribed', { id: remoteParticipants.identity });
    this.setReadyStreams(remoteParticipants.identity)

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

    // this.emit('audio-track-unsubscribed', { id: remoteParticipants.identity });
    this.deleteReadyStreams(remoteParticipants.identity)
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
  }
  /*
    mode has to be "room" || "call"
    room  -> creates a room with spatial audio
    call  -> creates a room with default call audio
    video -> creates a room with audio video
    get token from backend and handle frontend room creation
  */
  async connectToRoom({ token }, mode) {
		this.clearError();
    try {
      // Reuse existing room if possible
      if (this._room && this._room.state === 'connected') {
        console.warn('Existing room found! Disconnecting before start new connection');
        await this._room.disconnect();
      }

      this._room = new Room();

      /* *************************************************************
        * Set up Listeners for remote track
        * *************************************************************/
      this._room.on(RoomEvent.TrackSubscribed, (track, publication, remoteParticipants) => {
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
      
      this._room.on(RoomEvent.TrackUnsubscribed, (track, publication, remoteParticipants) => {
        if (track.kind === Track.Kind.Audio) {
          if (mode === "call")
            this.handleLeaveCall(track, remoteParticipants);
          else if (mode === "room")
            this.handleLeaveRoom(track, remoteParticipants);
        }
      });

      this._room.on(RoomEvent.TrackMuted, (publication, participant) => {
        console.log(`${participant.identity} muted their ${publication.kind} track`);
        // Update UI to show muted state
      });

      this._room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        console.log(`${participant.identity} unmuted their ${publication.kind} track`);
        // Update UI to show unmuted state
      });

      // Run once when room connected Check existing participants
      this._room.once(RoomEvent.Connected, () => {
        console.log('Room connected, participants in room:', this._room.remoteParticipants);
      });

      /* *************************************************************
        * Connect to room
        * *************************************************************/
      try {
        await this._room.connect(import.meta.env.VITE_LIVEKIT_URL, token);

        if (mode === "video")
          await this._room.localParticipant.enableCameraAndMicrophone();
        else
          await this.audioManager.initMicrophone(this._room);
      } catch (error) {
        console.error(error);
      
        await this._room?.disconnect();
        this._room = null;

        this.setIsConnectedRoom(false);
        this.setIsLoading(false);
        this.setError(error.message || "Unable to connect to meeting.");

        return {
            success: false,
            error,
        };
      }

      // this.emit('connected', { room: this._room }); // ###
      console.log('Connected to room:', this._room);
      // setTimeout(() => {
      //   this.setIsConnectedRoom(true);
      //   this.setIsLoading(false);
      // }, 3000)
      this.setIsConnectedRoom(true);
      this.setIsLoading(false);
      return { success: true, room: this._room };
      
    } catch (error) {
      // should emit error here to standardize ###
      console.error(error);

      this.setError(error.message || "Unexpected LiveKit error.");

      return {
          success: false,
          error,
      };
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this._room?.state === 'connected',
      roomState: this._room?.state || 'disconnected',
      roomName: this._room?.name || null
    };
  }

  // cleanup
  async disconnectFromRoom() {
    if (this._room) {
      try {
        await this._room.disconnect();
        this._room = null;

        this.setActivePlane(null);
        this.setIsConnectedRoom(false);
        this.setIsLoading(false);

        this.audioManager.cleanup();
        this.mediaStreams.clear();
        this.positionalAudios.clear();

        console.log("Disconnected from room");
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

  onStateChange(callback) {
    this.on('stateChange', callback);
    return () => this.off('stateChange', callback);
  }
}

export const livekitService = new LiveKitService();

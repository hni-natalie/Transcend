/*
 services/livekitService.js - SINGLETON (persists across component unmounts)

 Livekit service, handles tokens & audio streaming
 init tokens done by socket.io in useSocket.tsx
 with audio stream input
 future need to separate messaging & audio room (prob)
*/

import { Room, RoomEvent, Track, isBrowserSupported } from 'livekit-client';
import { AudioManager } from './audioManager';
import * as THREE from 'three';

/*
for reference:
  interface LiveKitState {
    isConnectedRoom: boolean;
    hasRemoteParticipant: boolean;
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
    this.displayStream = null;
    this.windowAudioTrack = null;
    this.audioElements = new Map();         // map for all audio tracks in room
    this.mediaStreams = new Map();          // map for all media streams in room
    this.positionalAudios = new Map();      // map for all positional audios in room <string, Map(string, posAudio)>
    this.audioManager = new AudioManager(); // manage own audio mic, mute state
    this.listeners = new Map();             // event listener
    this.isInitialized = false;
    this.roomMode = null;
    this._state = {
      isConnectedRoom: false,
      currentRoomName: null,
      activePlane: null,
      isMuted: false,
      joinCount: 0,
      isLoading: false,
      loadingRoomName: null,
      readyStreams: new Set(),            // set of userIds record where their streams is ready
      hasRemoteParticipant: false,
      error: null
    }
  }

  get isConnectedRoom() { return this._state.isConnectedRoom; }
  get hasRemoteParticipant() { return this._state.hasRemoteParticipant; }
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

  _getCreateInnerMap(key, outer) {
    let inner = outer.get(key);
    if (!inner) {
      inner = new Map();
      outer.set(key, inner);
    }
    return inner;
  }
  
  getState(){
    return { ...this._state };
  }

  setError(error) {
    this._setState({ error, isLoading: false, });
  }

  setCurrentRoomName(roomName) {
    this._setState({ currentRoomName: roomName });
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

  setHasRemoteParticipant(status){
    this._setState({ hasRemoteParticipant:status });
  }

  setIsLoading(status, roomName) {
    const updates = { isLoading: status };
    if (roomName) {
      updates.loadingRoomName = roomName;
    }
    this._setState(updates);
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

  checkBrowserSupport() {
    return isBrowserSupported();
  }

  async stopWindowAudio() {
    const audioTrack = this.windowAudioTrack;
    const room = this._room;

    try {
      if (audioTrack && this._room?.state === 'connected') {
        await room.localParticipant.unpublishTrack(audioTrack, true);
      }
    } finally {
      this.displayStream?.getTracks().forEach((track) => track.stop());
      this.windowAudioTrack = null;
      this.displayStream = null;
    }
  }

  async shareWindowAudio() {
    if (!this._room || this._room.state !== 'connected') {
      throw new Error('Join voice space before sharing window audio.');
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Window audio sharing is not supported in this browser.');
    }
    // Must run from direct user gesture so browser may open capture picker.
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const [audioTrack] = stream.getAudioTracks();
    if (!audioTrack) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('No audio shared. Select a source with audio enabled in browser picker.');
    }

    await this.stopWindowAudio();
    this.displayStream = stream;
    this.windowAudioTrack = audioTrack;

    try {
      await this._room.localParticipant.publishTrack(audioTrack, { source: Track.Source.ScreenShareAudio });
      audioTrack.addEventListener('ended', () => {
        if (this.windowAudioTrack === audioTrack) void this.stopWindowAudio();
      }, { once: true });
    } catch (error) {
      await this.stopWindowAudio();
      throw error;
    }
  }
  /*
    mode must be either "room" || "call" || "video"
    room: spatial audio, call: non spatial audio, video: video call
  */
  init( mode ) {
    this.roomMode = mode; // keep latest mode fresh even if listener already wired

    if (this.isInitialized) return ;

    // Listen for LiveKit connection events from useSocket
    window.addEventListener('livekit-connect', async (event) => {
      try {
        // emits connected signal to useLiveKit
        const result = await this.connectToRoom(event.detail, this.roomMode);
        if (!result.success) {
          throw result.error;
        }
        this.isInitialized = true;
        // this.lkToken = event.detail;
        // console.log('livekit-connect: Successfully joined room: ', this.lkToken);
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
      this._setState.isLoading = false;
    });
  }

  // setup room audio for remote participants
  async setupRoomAudio(key, track, mediaStream) {
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
        let audioByTrack = this._getCreateInnerMap(key, this.audioElements)
        audioByTrack.set(track.sid, audioElement);

        positionalAudio.setVolume(1);
        positionalAudio.isPlaying = true;
        positionalAudio.setMediaStreamSource(audioElement.srcObject);
        let streamsByTrack = this._getCreateInnerMap(key, this.positionalAudios);
        streamsByTrack.set(track.sid, positionalAudio);

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
      const paMap = this.positionalAudios.get(key);
      for (const [sid, pa] of paMap)  {
        console.log('[audio] panner position:', pa.panner.positionX?.value, pa.panner.positionY?.value, pa.panner.positionZ?.value);
        console.log('[audio] listener position:', this.audioManager.listener.position);
        console.warn('[audio] positionalAudio parent:', pa.parent?.name ?? 'NO PARENT — not in scene graph', '\nkey: ', key);
      }
  }

  // this runs everytime when a track is subscribed
  async handleRoom(track, remoteParticipants) {
    const mediaStream = track.mediaStream;
    let mediaStreams = this._getCreateInnerMap(remoteParticipants.identity, this.mediaStreams);
    mediaStreams.set(track.sid, mediaStream);
    // --------------------------------------------------------
    await this.setupRoomAudio(remoteParticipants.identity, track, mediaStream);
    // this.emit('audio-track-subscribed', { id: remoteParticipants.identity });
    this.setReadyStreams(remoteParticipants.identity)

    // debug
    const tstream = this.mediaStreams.get(remoteParticipants.identity);
    for (const [sid, stream] of tstream)  {
      if (stream instanceof MediaStream) {
        console.log('Local: Valid MediaStream! ', remoteParticipants.identity);
      }
      else {
        console.error('Local: Invalid media stream');
      }
    }
  }

  handleLeaveRoom(track, remoteParticipants) {
    const key = remoteParticipants.identity;
    const mediaStreams = this.mediaStreams.get(key);
    if (mediaStreams?.delete(track.sid)) {
      if (mediaStreams.size === 0) this.mediaStreams.delete(key);
      console.log("Removed media stream ", remoteParticipants.identity);
    }

    const positionalAudios = this.positionalAudios.get(key);
    const positionalAudio = positionalAudios?.get(track.sid);
    if (positionalAudio) {
      positionalAudio.isPlaying = false;
      positionalAudio.disconnect();
      // positionalAudio.parent?.remove(positionalAudio);
      positionalAudios.delete(track.sid);
      if (positionalAudios.size === 0) this.positionalAudios.delete(key);
      console.log("Removed positional audio ", remoteParticipants.identity);
    }
    const audioElements = this.audioElements.get(key);
    const audioElement = audioElements?.get(track.sid);
    if (audioElement) {
      audioElement.pause();
      audioElement.srcObject = null;
      audioElement.remove();
      audioElements.delete(track.sid);
      if (audioElements.size === 0) this.audioElements.delete(key);
      console.log("Removed audio element ", remoteParticipants.identity);
    }

    // this.emit('audio-track-unsubscribed', { id: remoteParticipants.identity });
    this.deleteReadyStreams(key)
  }

  handleCall(track, remoteParticipants) {
    const audioElement = track.attach(); // creates HTML audio element so that player voice is heard
    audioElement.autoplay = true;
    audioElement.volume = 1.0;
    // store this element to mute individual participants later
    let audioByTrack = this.audioElements.get(remoteParticipants.identity);
    if (!audioByTrack) {
      audioByTrack = new Map();
      this.audioElements.set(remoteParticipants.identity, audioByTrack);
    }
    audioByTrack.set(track.sid, audioElement);
  }

  handleLeaveCall(track, remoteParticipants) {
    const audioByTrack = this.audioElements.get(remoteParticipants.identity);
    const audioElement = audioByTrack?.get(track.sid);
    if (audioElement) {
      audioElement.remove();
      audioByTrack.delete(track.sid);
      if (audioByTrack.size === 0) this.audioElements.delete(remoteParticipants.identity);
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

      this._room.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log(`Participant joined: ${participant.identity}`);
        this.setHasRemoteParticipant(true);
      });

      this._room.on(RoomEvent.ParticipantDisconnected, () => {
        this.setHasRemoteParticipant(this._room.remoteParticipants.size > 0);
      });

      // Run once when room connected Check existing participants
      this._room.once(RoomEvent.Connected, () => {
        console.log('Room connected, participants in room:', this?._room?.remoteParticipants);
        this.setHasRemoteParticipant(this?._room?.remoteParticipants.size > 0);
      });

      /* *************************************************************
        * Connect to room
        * *************************************************************/
      try {
        await this._room.connect(import.meta.env.VITE_LIVEKIT_URL, token);
        if (!this._room) throw new Error('Room disconnected during connect');

        if (mode === "video") {
          await this._room.localParticipant.enableCameraAndMicrophone();
          this.audioManager.setRoom(this._room);
        }
        else {
          await this._room.localParticipant.setMicrophoneEnabled(true);
          this.audioManager.setRoom(this._room);
        }
      } catch (error) {
        console.error('livekitService: ', error.name, ' ', error);
      
        await this._room?.disconnect();
        this._room = null;

        this.setIsConnectedRoom(false);
        this.setIsLoading(false);
        if (error.name === 'NotFoundError') {
          this.setError('No microphone or camera found. Please connect a device and try again.');
        } else if (error.name === 'NotAllowedError') {
          this.setError('Camera/microphone access was denied. Please check your browser permissions.');
        } else {
          this.setError(error.message || "Unable to connect to meeting.");
        }
        alert(this.error);
        // window.location.reload();

        return {
            success: false,
            error,
        };
      }

      console.log('Connected to room:', this._room);
      this.setIsConnectedRoom(true);
      this.setCurrentRoomName(this._room.name);
      this.setIsLoading(false, this._room.name);
      return { success: true, room: this._room };
      
    } catch (error) {
      // should emit error here to standardize ###
      console.error(error);
      this.setIsLoading(false);
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
    await this.stopWindowAudio();
    if (this._room) {
      try {
        await this._room.localParticipant.setCameraEnabled(false);
        await this._room.localParticipant.setMicrophoneEnabled(false);
        await this._room.disconnect();
        this._room = null;

        this.setActivePlane(null);
        this.setIsConnectedRoom(false);
        this.setHasRemoteParticipant(false);
        this.setIsLoading(false);
        this.setCurrentRoomName(null);
        this.audioManager.cleanup();
        this.audioElements.forEach((audioByTrack) => {
          if (audioByTrack instanceof Map) {
            audioByTrack.forEach((audio) => {
              audio.pause();
              audio.srcObject = null;
              audio.remove();
            });
          }
        });
        this.audioElements.clear();
        this.positionalAudios.forEach((positionalByTrack) => {
          if (positionalByTrack instanceof Map) {
            positionalByTrack.forEach((audio) => {
              audio.isPlaying = false;
              audio.disconnect();
            });
          }
        });
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
      // console.log(`📡 emit: Emitting event: ${event}`, data);
    } else
    console.log(`📡 emit: No listeners found for ${event}`);
  }

  onStateChange(callback) {
    this.on('stateChange', callback);
    return () => this.off('stateChange', callback);
  }
}

export const livekitService = new LiveKitService();

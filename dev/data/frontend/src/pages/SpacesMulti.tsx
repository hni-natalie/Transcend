import { MenuSide } from '../components';
import { GenerateDept, Character, CharacterVoice } from '../components/threejs';
import { menuConfig } from '../config/menu.conf';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from '../types/user.types';
import { useSocket } from '../context/ContextSocket';

// Sound component with depth-based volume
// function SoundSource({ position, url, isPlaying = true }) {
// 	const soundRef = useRef()
// 	const listenerRef = useRef()
	
// 	useEffect(() => {
// 		// Create audio listener and sound
// 		const listener = new THREE.AudioListener()
// 		const sound = new THREE.Audio(listener)
		
// 		listenerRef.current = listener
// 		soundRef.current = sound
		
// 		// Load audio
// 		const audioLoader = new THREE.AudioLoader()
// 		audioLoader.load(url, (buffer) => {
// 			sound.setBuffer(buffer)
// 			sound.setLoop(true)
// 			sound.setVolume(1)
// 			if (isPlaying) sound.play()
// 		})
		
// 		// Add listener to camera
// 		// Note: You'll need to attach this to your camera component
// 		// This is a simplified version
		
// 		return () => {
// 			sound.stop()
// 			sound.disconnect()
// 		}
// 	}, [url, isPlaying])
	
// 	// Update volume based on distance from camera
// 	useFrame(({ camera }) => {
// 		if (!soundRef.current || !listenerRef.current) return
		
// 		const distance = camera.position.distanceTo(position)
// 		// Volume decreases with distance (adjust these values as needed)
// 		const maxDistance = 10
// 		const volume = Math.max(0, 1 - (distance / maxDistance))
// 		soundRef.current.setVolume(volume)
// 	})
	
// 	return null
// }

// get count from backend API to decide how many blocks to generate
function getDeptCount() {
	let count:number ;
	// call backend API
	count = 8;
	return (count);
}


// Main Scene

export default function SpaceMultiScene() {
	/* ------------- players  ------------- */
	const spawnedRef = useRef(new Set()); // Track spawned characters
	/* ------------- general  ------------- */
	const count = getDeptCount()
	const listenerRef = useRef<THREE.AudioListener>(new THREE.AudioListener());
	/* ------------- sockets  ------------- */
	const { enableSocket, players, localPlayerId, isConnected, localPlayerPos } = useSocket();
  useEffect(() => { enableSocket(); }, []);
	
	// const socketUrl = import.meta.env.VITE_DOMAIN_URL
	// console.log(`test env: ${socketUrl}`)

  // Your WebRTC peer management logic
  // const [remotePeers, setRemotePeers] = useState<Array<{
  //   id: string;
  //   stream: MediaStream;
  //   position: [number, number, number];
  // }>>([]);
  
  // // Example: Add a remote peer at a specific position
  // useEffect(() => {
  //   // Simulate adding a remote player
  //   const addRemotePlayer = async () => {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     setRemotePeers(prev => [...prev, {
  //       id: 'player-1',
  //       stream,
  //       position: [5, 1, 2]
  //     }]);
  //   };
  //   addRemotePlayer();
  // }, []);

  useEffect(() => {
    if (!isConnected) return;
			console.log('Local player: ', localPlayerId, 'pos: ', localPlayerPos);
  }, [localPlayerPos, isConnected]);

	// initialize setup
  useEffect(() => {
    if (!isConnected) return;
		
    // Spawn new characters when players join
    players.forEach(( user:Player )  => {
      if (!spawnedRef.current.has(user.id)) {
        console.log(`Spawning character for player: ${user.id}`);
        spawnedRef.current.add(user.id);
      }
    });
  }, [players, isConnected]);

  // Clean up player on disconnect
  useEffect(() => {
    if (!isConnected) {
      // setCharacters([]);
      spawnedRef.current.clear();
    }
  }, [isConnected]);

	return (
		<div className='bg-brand-black-sub h-screen flex gap-0.5'>
		<MenuSide conf={menuConfig} />

		<div className='bg-brand-black p-8 flex w-full'>
		<Canvas className=''>
			<PerspectiveCamera 
				makeDefault
				position={[0, 30, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
				fov={50}
				near={0.1}
				far={100}
			/>

			<ambientLight intensity={0.8} />
			{/* <directionalLight position={[10, 5, 5]} /> */}
			
			{/* Ground */}
			{/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
				<planeGeometry args={[100, 100]} />
				<meshStandardMaterial color="#404040" />
			</mesh> */}
			{/* <GenerateDept count={count}/> */}
			<GenerateDept count={count} characterPos={localPlayerPos} />
			{/* <Character onChange={setCharacterPos}/> */}
      {players.map(( user:Player ) => (
        <Character
					key={user.id}
					id={user.id}
					color={user.color}
					position={user.position}
          // stream={user.stream}
          // isPlaying={true}
					isLocalPlayer={user.id === localPlayerId}
        />
      ))}
			
			{/* Grid helper for reference */}
			<gridHelper args={[20, 20]} />
		</Canvas>
		</div>
		</div>
	);
}
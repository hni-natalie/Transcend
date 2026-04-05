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

// function randomHexColor() {
//   const letters = '0123456789ABCDEF';
//   let color = '#';
//   for (let i = 0; i < 6; i++) {
//     color += letters[Math.floor(Math.random() * 16)];
//   }
//   return color;
// };

// function randomHslColor() {
//   return `hsl(${Math.random() * 360}, 80%, 80%)`;
// };

// Main Scene
export default function SpaceMultiScene() {
	/* ------------- players  ------------- */
	const spawnedRef = useRef(new Set()); // Track spawned characters
  // const [characterPos, setCharacterPos] = useState(new THREE.Vector3(0, 0, 0));	/* characters */
  const [localPlayerId, setLocalPlayerId] = useState<String>(null);
  // const remotePlayersRef = useRef({});
  const playerRefs = useRef<Map<string, THREE.Mesh>>(new Map());
	/* ------------- general  ------------- */
	const count = getDeptCount()
	const listenerRef = useRef<THREE.AudioListener>(new THREE.AudioListener());
	/* ------------- sockets  ------------- */
	const { enableSocket, socket, players, setPlayerRef, isConnected } = useSocket();
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
    if (!socket || !isConnected) return;

		setLocalPlayerId(socket.id);
    // Spawn new characters when players join
    players.forEach(( user:Player )  => {
      if (!spawnedRef.current.has(user.id)) {
        console.log(`Spawning character for player: ${user.id}`);
        spawnedRef.current.add(user.id);
      }
    });
  }, [players, socket, isConnected]);

  // SYNC remote player positions when state changes
	// useEffect(() => {
	// 	console.log('update remote players!')
	// 	players.forEach(( player:Player ) => {
	// 		if (player.id !== localPlayerId && remotePlayersRef.current[player.id]) {
	// 			console.log('update remote ****!')

	// 			remotePlayersRef.current[player.id].position.set(
	// 				player.position[0], 
	// 				player.position[1], 
	// 				player.position[2]
	// 			);
	// 		}
	// 	});
	// }, [players]);

	
  // Clean up player on disconnect
  useEffect(() => {
    if (!isConnected) {
      // setCharacters([]);
      spawnedRef.current.clear();
    }
  }, [isConnected]);
	let i = 0;

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
			<GenerateDept count={count}/>
			{/* <GenerateDept count={count} characterPos={characterPos} /> */}
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
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useLocation } from 'react-router-dom';
import { useSocket } from '@context/ContextSocket';
import { PageHeader, IconOffice, Player } from '@shared';;
import { useLiveKit, isAudioSupported, ButtonVoiceRoom } from '@features/livekit';
import { GenerateDept, Character } from '@features/office';

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
interface SpaceProps {
  roomName: string;
}

export function Office({ roomName } : SpaceProps ) {
	/* ------------- general  ------------- */
	const count = getDeptCount()
  const [error, setError] = useState<string>('');
	const listenerRef = useRef<THREE.AudioListener>(new THREE.AudioListener());
  const location = useLocation();
	/* ------------- sockets  ------------- */
	const { enableSocket, players, fetchRoomPlayers, roomPlayers, localPlayerId, isConnected, localPlayerPos } = useSocket();
	const { connect, disconnect, isConnectedRoom } = useLiveKit(roomName);

	// run once on mount
  useEffect(() => { enableSocket(); }, []);
	useEffect(() => {
		// Check browser audio support
		const supported = isAudioSupported();
		if (!supported) {
			setError('Audio features are not supported in this browser');
		}
	}, []);

	// debug
	// useEffect(() => {
	// 	console.log('✅ roomPlayers CHANGED:', roomPlayers);
	// 	roomPlayers.forEach( (player:Player) => {
	// 		console.log('Player id:', player.id);
	// 		console.log('Player color:', player.color);
	// 		console.log('Player position:', player.position);
	// 	});
	// 	console.log('localid: ', localPlayerId);
	// 	console.log('Length:', roomPlayers?.length);
	// }, [roomPlayers]);  // This runs whenever roomPlayers updates

	useEffect(() => {
		if (!isConnected) return ;
		fetchRoomPlayers(roomName);
	}, [isConnected])

	// auto connect voice
  // useEffect(() => {
	// 	if (!isConnectedRoom) {
	// 		console.log('[debug]Spaces:init')
	// 		connect();
	// 	}

	// 	return () => {
	// 		if (isConnectedRoom)
	// 			disconnect();
	// 	};
	// }, [isConnectedRoom]);
		
	
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

// return (
//     <>
//       <Canvas className='w-full h-full'>
//         <PerspectiveCamera 
//           makeDefault
//           position={[0, 30, 0]}
//           rotation={[-Math.PI / 2, 0, 0]}
//           fov={50}
//           near={0.1}
//           far={100}
//         />

//         <ambientLight intensity={0.8} />
        
//         <GenerateDept count={count} characterPos={localPlayerPos} room={roomName} />

//         {(roomPlayers.map((user: Player) => (
//           <Character
//             key={user.id}
//             id={user.id}
//             color={user.color}
//             position={user.position}
//             photo={user.photo}
//             isLocalPlayer={user.id === localPlayerId}
//           />
//         )))}
//       </Canvas>
      
//       <div className='absolute top-4 left-0 right-4 flex justify-end'>
//         <ButtonVoiceRoom roomName={roomName} joinText={`Join ${roomName} Room`}/>
//       </div>
      
//       {error && <div className='text-danger'>{error}</div>}
//     </>
//   );
// }

	return (
	// <div className='bg-background-1 h-screen flex gap-0.5'>
	<div className='flex flex-col h-full'>
      {/* Page Header */}
      <PageHeader 
        icon={<IconOffice className="w-7 h-7" />}
        title={roomName}
        action={
          <ButtonVoiceRoom 
            roomName={roomName} 
            joinText={`Join ${roomName} Room`}
          />
        }
      />

		{/* <div className='bg-background p-8 flex w-full'> */}
		<div className='flex-1 relative'>
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
				<GenerateDept count={count} characterPos={localPlayerPos} room={roomName} />

				{/* {isConnectedRoom && */}
				{/* {(players.map(( user:Player ) => ( */}
				{(roomPlayers.map(( user:Player ) => (
					<Character
						key={user.id}
						id={user.id}
						color={user.color}
						position={user.position}
						photo={user.photo}
						isLocalPlayer={user.id === localPlayerId}
					/>
				)))}
				
				{/* Grid helper for reference */}
				{/* <gridHelper args={[20, 20]} /> */}
			</Canvas>
			{/* <div className='flex absolute top-4 left-0 right-4 justify-end' >
				<ButtonVoiceRoom roomName={roomName} joinText={`Join ${roomName} Room`}/>
			</div> */}
			{error && (<div className='text-danger'>{error}</div>)}
		</div>

	</div>
	);
}

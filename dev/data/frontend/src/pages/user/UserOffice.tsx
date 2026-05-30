import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, MapControls } from '@react-three/drei';
import { useLocation } from 'react-router-dom';
import { useSocket } from '@/features/socketio/useSocket';
import { PageHeader, IconOffice, Player, MenuSide } from '@shared';;
import { useLiveKit, isAudioSupported, ButtonVoiceRoom } from '@features/livekit';
import { GenerateDept, CameraTracking, Character } from '@features/office';

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
	/* ------------- threejs  ------------- */
  const localPlayerRef = useRef<THREE.Mesh>(null);
	const controlsRef = useRef<React.ElementRef<typeof MapControls>>(null);
	/* ------------- general  ------------- */
	const count = getDeptCount()
  const [error, setError] = useState<string>('');
	const listenerRef = useRef<THREE.AudioListener | null>(null);
  const location = useLocation();
	/* ------------- sockets  ------------- */
	const { enableSocket, players, fetchRoomPlayers, roomPlayers, localPlayerId, isConnected, localPlayerPos } = useSocket();
	const { disconnect, getAudioListener, getPositionalAudio, isPlayerAudioReady } = useLiveKit(roomName);

	const handleUncaughtRejection = async ( event:PromiseRejectionEvent ) => {
		if (event.reason?.name === 'NegotiationError' ||
				event.reason?.message?.includes('Cannot set local offer')) {
			console.warn('Negotiation error occurred, SDK will typically self-heal:', event.reason);
			await disconnect();
			window.location.reload();
			// event.preventDefault(); // Prevents the "uncaught" console error
		}
	}

	// run once on mount
  useEffect(() => { enableSocket(); }, []);
  useEffect(() => {window.addEventListener('unhandledrejection', handleUncaughtRejection);
    return () => { window.removeEventListener('unhandledrejection', handleUncaughtRejection); };
  }, []);

	useEffect(() => {
		// Check browser audio support
		const supported = isAudioSupported();
		if (!supported) {
			setError('Audio features are not supported in this browser');
		}
		// init local listener
		if (!listenerRef.current) {
			listenerRef.current = getAudioListener();
			console.log('✅ Audio listener initialized');
		}
	}, []);

	// debug
	// useEffect(() => {
	// 	console.log('✅ roomPlayers CHANGED:', roomPlayers);
	// 	// roomPlayers.forEach( (player:Player) => {
	// 	// 	console.log('Player id:', player.id);
	// 	// 	console.log('Player color:', player.color);
	// 	// 	console.log('Player position:', player.position);
	// 	// });
	// 	// console.log('localid: ', localPlayerId);
	// 	console.log('Length:', roomPlayers?.length);
	// }, [roomPlayers]);  // This runs whenever roomPlayers updates

	// useEffect(() => {
	// 	if (!isConnected) return;
	// 	fetchRoomPlayers(roomName);
	// }, [isConnected, roomPlayers])

	// for testing only
	// should remove MenuSide & w-full when live
	return (
	// <div className='bg-background-1 h-screen flex gap-0.5'>
	// <MenuSide />
	<div className='flex flex-col h-full'>
      {/* Page Header */}
      <PageHeader 
        icon={<IconOffice className="w-7 h-7" />}
        title={roomName}
        action={
          <ButtonVoiceRoom 
            roomName={roomName} 
            joinText={`Join ${roomName} Room`}
						mode="room"
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
				<MapControls
					ref={controlsRef}
					enableZoom={true}
					zoomSpeed={0.5}
					panSpeed={0.5}
					minDistance={10}
					maxDistance={50}
					minPolarAngle={0}  						// top down 90 deg
					maxPolarAngle={Math.PI / 24} 	// slight slant, 30 deg tilt
					minAzimuthAngle={0}						// min left rotation
					maxAzimuthAngle={0}						// max right rotation
				/>
				<CameraTracking localPlayerRef={localPlayerRef} controlsRef={controlsRef} />

				<ambientLight intensity={0.8} />
				{/* <directionalLight position={[10, 5, 5]} /> */}
				
				{/* Ground */}
				{/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
					<planeGeometry args={[100, 100]} />
					<meshStandardMaterial color="#404040" />
				</mesh> */}
				<GenerateDept count={count} characterPos={localPlayerPos} room={roomName} />

				{/* {isConnectedRoom && */}
				{/* {(players.map(( user:Player ) => ( */}
				{(roomPlayers.map(( user:Player ) => (
					<Character
						key={user.id}
	          ref={user.id === localPlayerId ? localPlayerRef : null}
						id={user.id}
						color={user.color}
						position={user.position}
						photo={user.photo}
						isLocalPlayer={user.id === localPlayerId}
						isPlayerAudioReady={isPlayerAudioReady(user.id)}
						getPositionalAudio={getPositionalAudio}
						listenerRef={listenerRef}
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
	// </div>
	);
}

import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, MapControls } from '@react-three/drei';
import { useLocation } from 'react-router-dom';
import { useSocket } from '@/features/socketio/useSocket';
import { PageHeader, IconOffice, Player, MenuSide } from '@shared';;
import { useLiveKit, isAudioSupported, ButtonVoiceRoom } from '@features/livekit';
import { GenerateDept, CameraTracking, Character, MyRaycaster } from '@features/office';
import { KeyboardProvider } from '@features/office/context/useKeyboard';

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


// export const MyRaycaster = ({ isConnectedRoom, localPlayerRef, clickPoint }) => {
// 	const { isMoveKey } = useKeyboard();
// 	if (!clickPoint) return;

// 	// Smooth movement
// 	useFrame(() => {
// 		if (!isConnectedRoom) return;

// 		if (isMoveKey())
// 			clickPoint.current = null;

// 		if (clickPoint.current && localPlayerRef.current) {
// 			// Move smoothly towards target 4% every frame
// 			localPlayerRef.current.position.lerp(clickPoint.current, 0.04);

// 			// Stop when close enough
// 			if (localPlayerRef.current.position.distanceTo(clickPoint.current) < 0.1) {
// 				localPlayerRef.current.position.copy(clickPoint.current);
// 				console.log('arrived at clickpoint')
// 				clickPoint.current = null;
// 			}
// 		}
// 	});
// 	return null;
// }

export function Office({ roomName } : SpaceProps ) {
	/* ------------- sockets  ------------- */
	const { enableSocket, socket, players, fetchRoomPlayers, roomPlayers, localPlayerId } = useSocket();
	const { disconnect, getAudioListener, getPositionalAudio, isPlayerAudioReady, isConnectedRoom } = useLiveKit(roomName);
	/* ------------- threejs  ------------- */
	// const { camera, scene, gl } = useThree();
  const localPlayerRef = useRef<THREE.Mesh>(null);
  const groundRef = useRef<THREE.Mesh>(null);
	const controlsRef = useRef<React.ElementRef<typeof MapControls>>(null);
	const cameraRef = useRef<THREE.Camera>(null);
	const clickPoint = useRef(null);
	/* ------------- general  ------------- */
	const count = getDeptCount()
  const [error, setError] = useState<string>('');
	const listenerRef = useRef<THREE.AudioListener | null>(null);
	const isConnectedRoomRef = useRef(isConnectedRoom);

	const handleUncaughtRejection = async ( event:PromiseRejectionEvent ) => {
		if (event.reason?.name === 'NegotiationError' ||
				event.reason?.message?.includes('Cannot set local offer')) {
			console.warn('Negotiation error occurred, SDK will typically self-heal:', event.reason);
			await disconnect(false);
			alert("Unable to connect, refresh and try again!");
			window.location.reload(); //maybe this, disconnect, then reload?
		}
	}
	const handleGroundClick = (e) => {
		if (!isConnectedRoomRef.current) return ;
		clickPoint.current = new THREE.Vector3(e.point.x, 0, e.point.z);
		// console.log('Click point (world):', clickPoint);
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
		// return () => {
		// 	if (listenerRef.current)
		// 			listenerRef.current = null;
		// }
	}, []);

	useEffect(() => {
		isConnectedRoomRef.current = isConnectedRoom;
	}, [isConnectedRoom])

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


	const hasMouseMoved = useRef(false);
	const hasMouseDown = useRef(false);
	const handlePointerDown = () => {
		// console.log('Mouse down! Mouse move: ', hasMouseMoved.current);
		hasMouseDown.current = true;
	};
	const handlePointerMove = () => {
		if (!hasMouseDown.current) return ;
		hasMouseMoved.current = true;  // Any movement = drag
		// console.log('Mouse down + move!');
	};
	const handlePointerUp = (e) => {
		if (!hasMouseMoved.current) {
			handleGroundClick(e); // Only trigger if mouse didn't move
			hasMouseMoved.current = false;
		}
		hasMouseDown.current = false;
		hasMouseMoved.current = false;
		// console.log('Mouse up! Mouse move: ', hasMouseMoved.current);
	};


	// for testing only
	// should remove MenuSide & w-full when live
	return (
	// <div className='bg-background-1 h-screen flex gap-0.5'>
	// <MenuSide />
	<KeyboardProvider>
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
			{/* <KeyboardProvider> */}
			<Canvas className=''>
				<PerspectiveCamera 
				  ref={cameraRef as React.Ref<THREE.PerspectiveCamera>}
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
				<CameraTracking isConnectedRoom={isConnectedRoom} clickPoint={clickPoint} localPlayerRef={localPlayerRef} controlsRef={controlsRef} />
				{/* <MyRaycaster isConnectedRoom={isConnectedRoom} clickPoint={clickPoint} localPlayerRef={localPlayerRef} controlsRef={controlsRef} /> */}

				<ambientLight intensity={0.8} />
				{/* <directionalLight position={[10, 5, 5]} /> */}
				
				{/* Ground Plane */}
				<mesh
					// onClick={handleGroundClick}
					onPointerUp={handlePointerUp}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					rotation={[-Math.PI / 2, 0, 0]}
					position={[0, -1, 0]}
					ref={groundRef}
				>
					<planeGeometry args={[100, 100]} />
					<meshStandardMaterial color="#FFFFFF" visible={true} />
				</mesh>

				<GenerateDept count={count} localPlayerRef={localPlayerRef} room={roomName} />

				{/* {isConnectedRoom && */}
				{/* {(players.map(( user:Player ) => ( */}
				{(roomPlayers.map(( user:Player ) => (
					<Character
						key={user.id}
	          ref={user.id === localPlayerId ? localPlayerRef : null}
						id={user.id}
						color={user.color}
						position={user.position} // need user.position to receive socketio remote pos updates
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
			{/* </KeyboardProvider> */}
			{/* <div className='flex absolute top-4 left-0 right-4 justify-end' >
				<ButtonVoiceRoom roomName={roomName} joinText={`Join ${roomName} Room`}/>
			</div> */}
			{error && (<div className='text-danger'>{error}</div>)}
		</div>

	</div>
	</KeyboardProvider>
	);
}

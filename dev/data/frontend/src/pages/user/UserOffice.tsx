import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, MapControls, SpotLight } from '@react-three/drei';
import { useSocket } from '@/features/socketio/SocketContext';
import { PageHeader, IconOffice, Player, MenuSide } from '@shared';;
import { useLiveKit, isAudioSupported, ButtonVoiceRoom } from '@features/livekit';
import { GenerateDept, CameraTracking, Character } from '@features/office';
import { KeyboardProvider } from '@/features/office/context/KeyboardContext';
import { officeSceneConfig as conf } from '@/config/office.config';

// get count from backend API to decide how many blocks to generate
// const getOfficeDept = async () => {
// 	const res = await officeService.getAllDeptNames();
// 	let departmentNames = [];
// 	let departmentCount = 0;

// 	console.log('received data: ', res);
// 	console.log('received data: ', res?.success);
// 	if (res.success && Array.isArray(res.data)) {
// 		departmentNames = res.data;
// 		departmentCount = res.data.length;
// 		console.log('Departments:', res.data);
// 		console.log('Length of array:', res.data.length);
// 	}
// 	return { departmentNames, departmentCount};
// }

// Main Scene
interface SpaceProps {
  roomName: string;
}

export function Office({ roomName } : SpaceProps ) {
	/* ------------- sockets  ------------- */
	const { enableSocket, socket, players, fetchRoomPlayers, roomPlayers, localPlayerId } = useSocket();
	const { disconnect, getAudioListener, getPositionalAudio, isPlayerAudioReady, isConnectedRoom } = useLiveKit(roomName);
	/* ------------- threejs  ------------- */
  const localPlayerRef = useRef<THREE.Mesh>(null);
  const groundRef = useRef<THREE.Mesh>(null);
	const controlsRef = useRef<React.ElementRef<typeof MapControls>>(null);
	const cameraRef = useRef<THREE.Camera>(null);
	const clickPoint = useRef(null);
	const hasMouseMoved = useRef(false);
	const hasMouseDown = useRef(false);
	/* ------------- general  ------------- */
  const [error, setError] = useState<string>('');
	const listenerRef = useRef<THREE.AudioListener | null>(null);
	const isConnectedRoomRef = useRef(isConnectedRoom);

	const handleUncaughtRejection = async ( event:PromiseRejectionEvent ) => {
		if (event.reason?.name === 'NegotiationError' ||
				event.reason?.message?.includes('Cannot set local offer')) {
			console.warn('Negotiation error occurred, SDK will typically self-heal:', event.reason);
			await disconnect(false);
			alert("Unable to connect, refresh and try again!");
			window.location.reload();
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
					maxDistance={80}
					minPolarAngle={0}  						// top down 90 deg
					maxPolarAngle={Math.PI / 24} 	// slight slant, 30 deg tilt
					minAzimuthAngle={0}						// min left rotation
					maxAzimuthAngle={0}						// max right rotation
				/>
				<CameraTracking isConnectedRoom={isConnectedRoom} clickPoint={clickPoint} localPlayerRef={localPlayerRef} controlsRef={controlsRef} />

				<ambientLight intensity={0.8} />
				<spotLight
						position={[0, 5, 0]}
						intensity={1}
						distance={30}           // How far light reaches
						angle={0.8}             // Cone angle (radians)
						penumbra={0.3}          // Soft edge (0-1)
						decay={1}               // Light falloff
						color="#ffffff"
						castShadow
						shadow-mapSize-width={1024}
						shadow-mapSize-height={1024}
						shadow-bias={-0.0001}
				/>
				
				{/* <directionalLight position={[10, 5, 5]} /> */}
				
				{/* Ground Plane */}
				<mesh
					onPointerUp={handlePointerUp}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					rotation={[-Math.PI / 2, 0, 0]}
					position={[0, -1, 0]}
					ref={groundRef}
				>
					<planeGeometry args={[conf.World.width+10, conf.World.height+10]} />
					<meshStandardMaterial color="#6E6E6E" metalness={0.5} visible={true} />
				</mesh>

				<GenerateDept localPlayerRef={localPlayerRef} room={roomName} />

				{/* {isConnectedRoom && */}
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
			{error && (<div className='text-danger'>{error}</div>)}
		</div>

	</div>
	</KeyboardProvider>
	);
}

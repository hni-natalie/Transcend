import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { useLocation } from 'react-router-dom';
import { Physics } from '@react-three/cannon';
import { PerspectiveCamera, MapControls, SpotLight, Plane } from '@react-three/drei';
import { useSocket } from '@/context/SocketContext';
import { PageHeader, IconOffice, LoadingState, BlinkingText } from '@shared';;
import { useLiveKit, isAudioSupported, ButtonVoiceSpace } from '@features/livekit';
import { GenerateDept, CameraTracking, SpawnCharacter, Character, PlaneGround, SpawnObject, SpawnParticle } from '@features/office';
import { KeyboardProvider, PositionProvider } from '@/context';
import { SpaceProvider } from '@/features/office/context/SpaceContext';
import { useOfficeSpaceLayout } from '@/features/office/context/SpaceLayoutContext';

// Main Scene
interface SpaceProps {
  roomName: string;
}

export function Office({ roomName } : SpaceProps ) {
	/* ------------- nav  ------------- */
	const location = useLocation();
	const spawnPosition = location.state?.targetPosition;
	/* ------------- sockets  ------------- */
	const { enableSocket, socket, players, fetchRoomPlayers, roomPlayers, localPlayerId } = useSocket();
	const { disconnect, getAudioListener, getPositionalAudio, isPlayerAudioReady, isConnectedRoom } = useLiveKit(roomName);
	/* ------------- threejs  ------------- */
  const localPlayerRef = useRef<THREE.Group>(null);
	const controlsRef = useRef<React.ElementRef<typeof MapControls>>(null);
	const cameraRef = useRef<THREE.Camera>(null);
	const clickPoint = useRef(null);
	const lightTargetRef = useRef<THREE.Object3D>(null);

	const listenerRef = useRef<THREE.AudioListener | null>(null);
	/* ------------- general  ------------- */
  const [error, setError] = useState<string>('');
  const { loading: spaceLayoutLoading } = useOfficeSpaceLayout();

	const isConnectedRoomRef = useRef(isConnectedRoom);

	const handleUncaughtRejection = async ( event:PromiseRejectionEvent ) => {
		if (event.reason?.name === 'NegotiationError' ||
				event.reason?.message?.includes('Cannot set local offer')) {
			console.warn('Negotiation error occurred, SDK will typically self-heal:', event.reason);
			await disconnect(false);
			alert("Unable to connect, please reload page and rejoin room.");
			window.location.reload();
		}
	}
	const handleGroundClick = (e) => {
		if (!isConnectedRoomRef.current) return ;
		clickPoint.current = new THREE.Vector3(e.point.x, 0, e.point.z);

		const direction = new THREE.Vector3()
		.copy(clickPoint.current)
		.sub(localPlayerRef.current.position)

		direction.normalize().multiplyScalar(-2);
		lightTargetRef.current.position.set(-direction.x, direction.z, 0);
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


	return (
	<KeyboardProvider>
	<div className='flex flex-col h-full'>
      {/* Page Header */}
      <PageHeader 
        icon={<IconOffice className="w-7 h-7" />}
        title={roomName}
        action={
          <ButtonVoiceSpace 
            roomName={roomName} 
            joinText={`Join ${roomName} Room`}
						mode="room"
						className={ spaceLayoutLoading ? 'btn-header cursor-not-allowed' : 'btn-header' }
          />
        }
      />

		{spaceLayoutLoading ? (
			<LoadingState message="Initializing Office resources..." size="full" className='flex-1' />
		) : (
		<div className='flex-1 relative'>
			<Canvas
				className=''
			>
			<Physics>
				<SpaceProvider localPlayerRef={localPlayerRef} roomName={roomName}>
				<PositionProvider roomName={roomName}>

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
						maxPolarAngle={Math.PI / 8} 	// slight slant, 30 deg tilt
						minAzimuthAngle={0}						// min left rotation
						maxAzimuthAngle={0}						// max right rotation
					/>
					<CameraTracking isConnectedRoom={isConnectedRoom} clickPoint={clickPoint} localPlayerRef={localPlayerRef} controlsRef={controlsRef} spawnPosition={spawnPosition} />

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
					<PlaneGround handleGroundClick={handleGroundClick} color="#303030" />
					<GenerateDept />
					<SpawnObject roomName={roomName} />
					<SpawnParticle roomName={roomName} radius={0.07} />

					<SpawnCharacter roomName={roomName} lightTargetRef={lightTargetRef} listenerRef={listenerRef} ref={localPlayerRef}/>
					{/* Grid helper for reference */}
					{/* <gridHelper args={[20, 20]} /> */}

				</PositionProvider>
				</SpaceProvider>
			</Physics>
			</Canvas>
			{error && (<div className='text-danger'>{error}</div>)}
		</div>
		)}

	</div>

	</KeyboardProvider>
	);
}

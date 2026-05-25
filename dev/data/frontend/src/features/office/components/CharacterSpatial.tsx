/*
	Character with spatial audio configured
	Spatial audio enable audio panning from left/right
	when A is at left/right position of B
*/

import { useFrame, useLoader } from '@react-three/fiber';
import { useRef, useState, useEffect, RefObject } from 'react';
import * as THREE from 'three';
import { useSocket } from '@/features/socketio/useSocket';
import { Player } from '@shared/types/user.types';

interface CharacterProps extends Player {
	isLocalPlayer: boolean;
	isPlayerAudioReady: boolean;
  listenerRef: RefObject<THREE.AudioListener>;
	getPositionalAudio: (userId: string) => THREE.PositionalAudio;
	connectStream: (userId: string) => void;
}

const fetchUserPhoto = async () => {
	// const response = await fetch('/api/user/photo')
	// const data = await response.json()
	// return (data.photoUrl)
	return ('https://images.pexels.com/photos/36393879/pexels-photo-36393879.jpeg');
}

// 2D Circle Character Component + Movement handling
export function Character({ id, position, color="#D0F05C", photo, isLocalPlayer, isPlayerAudioReady, listenerRef, getPositionalAudio, connectStream } : CharacterProps) {
	const characterRef = useRef<THREE.Mesh>(null);
  const positionalAudioRef = useRef<THREE.PositionalAudio | null>(null);

	const { enableSocket, isConnected, socket, setLocalPlayerPos, localPlayerPos } = useSocket();
	useEffect(() => { enableSocket(); }, []);

	const [keys, setKeys] = useState({
		w: false, s: false, a: false, d: false,
	  ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
	});
	const speed = 5; //movement speed
	const texture = (useLoader(THREE.TextureLoader, photo) as THREE.Texture) 

  // console.log(`Init: Player ${id} received position prop:`, position);

	// listener setup
  // useEffect(() => {
  //   if (!characterRef.current[id]) return;
    
  //   // attach listener to player mesh
  //   characterRef.current[id].add(listenerRef.current);
  //   console.log("Listener attached directly to player mesh");
    
  //   return () => {
  //     if (listenerRef.current && characterRef.current) {
  //       characterRef.current[id].remove(listenerRef.current);
  //     }
  //   };
  // }, [characterRef]);
	
	// useEffect(() => {
	// 	if (!imageUrl) return ;
	// 	console.log('img url: ', imageUrl);
	// 	// const texture = (useLoader(THREE.TextureLoader, imageUrl) as THREE.Texture) 
	// 	texture = (useLoader(THREE.TextureLoader, "https://images.pexels.com/photos/36393879/pexels-photo-36393879.jpeg") as THREE.Texture) 
	// 	// setTexture(new_texture);
	// }, [imageUrl])

	// add listener to local player ONLY
  useEffect(() => {
		if (!isLocalPlayer || !characterRef.current || !listenerRef) return ;
		characterRef.current.add(listenerRef.current);
		console.log('✅ Listener attached to local player mesh');

		return () => {
			if (characterRef.current && listenerRef.current) {
				characterRef.current.remove(listenerRef.current);
				console.log('Listener removed from local player mesh');
			}
		};
  }, [isLocalPlayer, listenerRef]);

	// add positional audio to remote player ONLY
  useEffect(() => {
    if ( !characterRef.current || isLocalPlayer || !listenerRef || !positionalAudioRef || !isPlayerAudioReady ) return;
		
		characterRef.current.name = `player-${id}`;
		console.log('[audio] characterRef:', characterRef.current);

		// connectStream(id);
		positionalAudioRef.current = getPositionalAudio(id);
		characterRef.current.add(positionalAudioRef.current);

		console.log("✅ Positional audio attached to remote player mesh ", id, " ", positionalAudioRef.current.position);
		const worldPos = positionalAudioRef.current.getWorldPosition(new THREE.Vector3());
		console.log('World position:', worldPos);

		return () => {
			if (listenerRef.current && characterRef.current && positionalAudioRef.current) {
				console.error('Cleanup positional audio')
				characterRef.current.remove(positionalAudioRef.current);
				positionalAudioRef.current = null;
			}
		};
	}, [isPlayerAudioReady])

	// debug
  // useFrame(() => {
  //   if (positionalAudioRef.current) {
  //     // This will automatically track character position because audio is parented to character
  //     const worldPos = positionalAudioRef.current.getWorldPosition(new THREE.Vector3());
  //     console.log('🎤 Audio following character:', worldPos);
  //   }
  // });

	// Handle keyboard input
	useEffect(() => {
		if (!isLocalPlayer) return ;

		const handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key;
			const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
			if (keys.hasOwnProperty(normalizedKey)) {
				setKeys(prev => ({ ...prev, [normalizedKey]: true }));
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key;
			const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
			if (keys.hasOwnProperty(normalizedKey)) {
				setKeys(prev => ({ ...prev, [normalizedKey]: false }));
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [isLocalPlayer]);


	/*
		Calls this function to update position every frame for local player
	  delta is from useFrame
	*/
	useFrame(( _, delta ) => {
		if (!characterRef.current || !isLocalPlayer) return;
		const movement = new THREE.Vector3(0, 0, 0);
		const newPos = new THREE.Vector3(characterRef.current.position.x, 0, characterRef.current.position.z);
		const moveDistance = speed * delta;

		// Calculate movement direction
		if (keys.w || keys.ArrowUp)    movement.z -= 1;  // Forward
		if (keys.s || keys.ArrowDown)  movement.z += 1;  // Backward
		if (keys.a || keys.ArrowLeft)  movement.x -= 1;  // Left
		if (keys.d || keys.ArrowRight) movement.x += 1;  // Right

		// Normalize diagonal movement
		if (movement.length() > 0) movement.normalize();
		
		// Apply movement with speed and delta time
		newPos.x += movement.x * moveDistance;
		newPos.z += movement.z * moveDistance;
		characterRef.current.position.set(newPos.x, 0, newPos.z);
		socket.emit('player-move', { id:id, position: { x:newPos.x, y:0, z:newPos.z }});
		setLocalPlayerPos({ x:newPos.x, y:0, z:newPos.z });
		// Optional: Rotate 3D character to face movement direction
		// if (movement.x !== 0 || movement.z !== 0) {
		// 	const angle = Math.atan2(movement.x, movement.z);
		// 	characterRef.current.rotation.y = angle;
		// }
	});
	
	return (
		// we need rotation as plane default pos = facing z pos
		<mesh ref={characterRef} position={[position.x, position.y, position.z]} rotation={[-Math.PI / 2, 0, 0]} >
			<circleGeometry args={[0.8, 24]} />
			{texture ? (
			<meshStandardMaterial map={texture} color="#FFFFFF" side={THREE.DoubleSide} />
			) : (
				<meshStandardMaterial color={color} side={THREE.DoubleSide} /> 
			)}
		</mesh>
	);
}

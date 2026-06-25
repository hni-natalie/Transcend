/*
	Character with spatial audio configured
	Spatial audio enable audio panning from left/right
	when A is at left/right position of B
*/

import { useFrame, useLoader } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import React, { useRef, useState, useEffect, RefObject } from 'react';
import * as THREE from 'three';
import { useSocket } from '@/features/socketio/SocketContext';
import { useKeyboard } from '@/features/office/context/KeyboardContext';
import { Player } from '@shared/types/user.types';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useTextWidth } from '@/features/office/hooks/useTextWidth';

interface CharacterProps extends Player {
	isLocalPlayer: boolean;
	isPlayerAudioReady: boolean;
  listenerRef: RefObject<THREE.AudioListener>;
	getPositionalAudio: (userId: string) => THREE.PositionalAudio;
}

const fetchUserPhoto = async () => {
	// const response = await fetch('/api/user/photo')
	// const data = await response.json()
	// return (data.photoUrl)
	return ('https://images.pexels.com/photos/36393879/pexels-photo-36393879.jpeg');
}

// 2D Circle Character Component + Movement handling
// export function Character(
export const Character = React.forwardRef<THREE.Mesh, CharacterProps>((
	{ id, name, position, color="#D0F05C", photo, isLocalPlayer, isPlayerAudioReady, listenerRef, getPositionalAudio } : CharacterProps,
	ref) => {

	const characterRef = useRef<THREE.Mesh>(null);
  const positionalAudioRef = useRef<THREE.PositionalAudio | null>(null);
	const [hovered, setHovered] = useState(false);
	const { keys } = useKeyboard();
	const { textRef, textWidth, getTextWidth, setTextWidth } = useTextWidth();

	const { enableSocket, isConnected, socket } = useSocket();
	useEffect(() => { enableSocket(); }, []);

	const speed = conf.Movement.keyboard_speed; //movement speed
	const texture = (useLoader(THREE.TextureLoader, photo) as THREE.Texture) 

  useEffect(() => {
    if (ref && characterRef.current) {
      if (typeof ref === 'function') {
        ref(characterRef.current);
      } else {
        ref.current = characterRef.current;
      }
    }
  }, [ref]);

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
		
		positionalAudioRef.current = getPositionalAudio(id);
		characterRef.current.add(positionalAudioRef.current);

		// debug --------------------------------
		characterRef.current.name = `player-${id}`;
		console.log('[audio] characterRef:', characterRef.current);
		console.log("✅ Positional audio attached to remote player mesh ", id, " ", positionalAudioRef.current.position);
		// const worldPos = positionalAudioRef.current.getWorldPosition(new THREE.Vector3());
		// console.log('World position:', worldPos);
		// --------------------------------------

		return () => {
			if (listenerRef.current && characterRef.current && positionalAudioRef.current) {
				console.warn('Cleanup positional audio')
				characterRef.current.remove(positionalAudioRef.current);
				positionalAudioRef.current = null;
			}
		};
	}, [isPlayerAudioReady])

	// debug keep first
  // useFrame(() => {
  //   if (positionalAudioRef.current) {
  //     // This will automatically track character position because audio is parented to character
  //     const worldPos = positionalAudioRef.current.getWorldPosition(new THREE.Vector3());
  //     console.log('🎤 Audio following character:', worldPos);
  //   }
  // });


	/*
		Calls this function to update position every frame for local player
	  delta is from useFrame
	*/
	const movement = new THREE.Vector3(0, 0, 0);
	const newPos = new THREE.Vector3();
	const worldWidth = conf.World.width + conf.World.border;
	const worldHeight = conf.World.height + conf.World.border;

	const boundaries = {
			minX: -worldWidth/2 + conf.Player.radius,
			maxX: worldWidth/2 - conf.Player.radius,
			minZ: -worldHeight/2 + conf.Player.radius,
			maxZ: worldHeight/2 - conf.Player.radius
	};

	useFrame(( _, delta ) => {
		if (!characterRef.current || !isLocalPlayer) return;

		movement.set(0,0,0);
		newPos.set(characterRef.current.position.x, 0, characterRef.current.position.z);

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
		// clamp to plane size
    // newPos.x = Math.max(boundaries.minX, Math.min(boundaries.maxX, newPos.x)) * 0.98;
    // newPos.z = Math.max(boundaries.minZ, Math.min(boundaries.maxZ, newPos.z));

		// bounce back when hit wall
		newPos.x = newPos.x < boundaries.minX ? boundaries.minX * 0.98 : 
							 newPos.x > boundaries.maxX ? boundaries.maxX * 0.98 : 
							 newPos.x;
		newPos.z = newPos.z < boundaries.minZ ? boundaries.minZ * 0.98 : 
							 newPos.z > boundaries.maxZ ? boundaries.maxZ * 0.98 : 
							 newPos.z;

		characterRef.current.position.set(newPos.x, 0, newPos.z);

		socket.emit('player-move', { id:id, position: { x:newPos.x, y:0, z:newPos.z }});
		// Optional: Rotate 3D character to face movement direction
		// if (movement.x !== 0 || movement.z !== 0) {
		// 	const angle = Math.atan2(movement.x, movement.z);
		// 	characterRef.current.rotation.y = angle;
		// }
	});
	
	return (
		<>
		{/* plane mesh need rotation as default position = facing z pos */}
		<mesh
			ref={characterRef} // only for localPlayer
			position={[position.x, position.y, position.z]}
			rotation={[-Math.PI / 2, 0, 0]}
		  onPointerOver={() => setHovered(true)}
			onPointerOut={() => setHovered(false)}
		>
			{/* main circle */}
			<circleGeometry args={[conf.Player.radius, conf.Player.segments]} />
			{texture ? (
			<meshStandardMaterial map={texture} color="#FFFFFF" side={THREE.DoubleSide} />
			) : (
				<meshStandardMaterial color={color} side={THREE.DoubleSide} /> 
			)}

			{/* Ring outline on hover */}
			{hovered && (
				<mesh>
					<ringGeometry args={[0.95, 1.1, 36]} />
					<meshStandardMaterial color="#D0F05C" emissive="#627C06" side={THREE.DoubleSide} />
				</mesh>
			)}

			{/* Text on hover */}
			{hovered && (
			<group position={[0, -2, 1]}>
				{/* Rounded Background Mesh */}
				<mesh position={[0, 0, -0.1]}>
					<planeGeometry args={[textWidth[0], 0.9]} />
					<meshStandardMaterial color="#1D2307" opacity={0.5} transparent />
				</mesh>
				<Text
					ref={(ref) => textRef.current[0] = ref}
					fontSize={0.6}
					color="white"
					onSync={() => getTextWidth(0)}
				>{name || id}</Text>
	  	</group>
			)}

		</mesh>
		</>
	);
})
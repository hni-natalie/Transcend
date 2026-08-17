/*
	Character with spatial audio configured
	Spatial audio enable audio panning from left/right
	when A is at left/right position of B

	local player socket.emits their position to backend when moving
	3D components position emits their position when on collision/moved
*/

import { useFrame, useLoader } from '@react-three/fiber';
import { useBox, useContactMaterial } from '@react-three/cannon';
import { Text } from '@react-three/drei';
import React, { useRef, useState, useEffect, useCallback, RefObject } from 'react';
import * as THREE from 'three';
import { useSocket, useKeyboard, usePosition } from '@/context';
import { Player, Position, getInitials } from '@/shared';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useTextWidth } from '@/features/office/hooks/useTextWidth';

interface CharacterProps extends Player {
	isLocalPlayer: boolean;
	isPlayerAudioReady: boolean;
  listenerRef: RefObject<THREE.AudioListener>;
	lightTargetRef: RefObject<THREE.Object3D>;
	getPositionalAudio: (userId: string) => THREE.PositionalAudio;
}

// 2D Circle Character Component + Movement handling
export const Character = React.forwardRef<THREE.Object3D, CharacterProps>((
	{ userId, id, name, position, color="#D0F05C", roomName='Office', photo, isLocalPlayer, isPlayerAudioReady, listenerRef, lightTargetRef, getPositionalAudio } : CharacterProps,
	ref) => {

	const { lastKnownPositionsRef, lockSystem } = usePosition();

	useContactMaterial('playerMaterial', 'playerMaterial', {
		friction: 0.3,
		restitution: 0.5,        				// 0 no bounce - 1 elastic
		contactEquationStiffness: 1,   	// lower = softer push
		contactEquationRelaxation: 400, // higher = softer/slower correction
	});
  const [characterRef, api] = useBox(() => ({
    mass: 1,
	  type: 'Dynamic',
  	linearDamping: 0.1,
    position: [position.x, position.y, position.z],
		rotation: [-Math.PI / 2, 0, 0],
		fixedRotation: true,
  	allowSleep: false,
    args: [conf.Player.radius * 2, conf.Player.radius * 2, conf.Player.radius * 2], // Match circle size
	  userData: { userId },
	  onCollide: (e) => handleCollision(e)
  }));

	const handleCollision = useCallback(( e:any ) => {
		if (!isLocalPlayer) return ; // only localPlayer emit collision pos
	  const objectId = e.body?.userData?.userId;
		if (objectId) {
		// 	console.log('collided with', objectId, ' ', lastKnownPositionsRef.current[objectId]);
			if (!lockSystem.acquireObj(objectId, id)) return ;
		// console.log('_current physics position:', lastKnownPositionsRef.current[objectId]);
		// console.log('_all:', lastKnownPositionsRef.current);
		}
	}, [isLocalPlayer])

	const positionalAudioRef = useRef<THREE.PositionalAudio | null>(null);
	const [hovered, setHovered] = useState(false);
	const { keys } = useKeyboard();
	const { textRef, textWidth, getTextWidth } = useTextWidth();

	const { enableSocket, isConnected, socket } = useSocket();
	useEffect(() => { enableSocket(); }, []);

  // useEffect(() => {
  //   if (lightTargetRef) {
	// 		console.log('[CharacterSpatial] target value: ', lightTargetRef.current.position);
  //   }
  // }, [lightTargetRef.current]);

	const speed = conf.Movement.keyboard_speed; //movement speed
	
	let texture = null;
	if (photo) {
		try {
			texture = (useLoader(THREE.TextureLoader, photo) as THREE.Texture);
		} catch (error) {
      // console.warn('Failed to load texture:', error);
			texture = null;
		}
	}

	// only propagate forward ref is isLocalPlayer
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
		if (!isLocalPlayer || !characterRef.current || !listenerRef.current) return ;
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
		console.warn('[audio] positionalAudio parent:', positionalAudioRef.current.parent?.name ?? 'NO PARENT — not in scene graph', '\nkey: ', id);

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

	// update remote player position from socket outside
	useEffect(() => {
		if (isLocalPlayer) return; // local player drives itself via input, not props
		api.position.set(position.x, position.y, position.z);
	}, [position, isLocalPlayer]);

	/*
		Calls this function to update position every frame for local player
	  delta is from useFrame
	*/
	const movement = new THREE.Vector3(0, 0, 0);
	const newPos = new THREE.Vector3(0, 0, 0);
	const lightDist = 2;

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
		if (keys.w || keys.ArrowUp) {
			if (lightTargetRef) lightTargetRef.current.position.set(0, lightDist, 0);
			movement.z -= 1;
		}
		if (keys.s || keys.ArrowDown) {
			if (lightTargetRef) lightTargetRef.current.position.set(0, -lightDist, 0);
			movement.z += 1;
		} 
		if (keys.a || keys.ArrowLeft) {
			if (lightTargetRef) lightTargetRef.current.position.set(-lightDist, 0, 0);
			movement.x -= 1;
		}
		if (keys.d || keys.ArrowRight) {
			if (lightTargetRef) lightTargetRef.current.position.set(lightDist, 0, 0);
			movement.x += 1;
		}

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

		characterRef.current.position.set(newPos.x, 0, newPos.z); // local
		api.position.set(newPos.x, 0, newPos.z);

		socket.emit('player-move', { userId:userId, position: { x:newPos.x, y:0, z:newPos.z }}); //broadcast
		// Optional: Rotate 3D character to face movement direction
		// if (movement.x !== 0 || movement.z !== 0) {
		// 	const angle = Math.atan2(movement.x, movement.z);
		// 	characterRef.current.rotation.y = angle;
		// }
	});
	
	return (
		<>
		{/* plane mesh need rotation as default position = facing z pos */}
		<group
			ref={characterRef} // localPlayer=characterRef
		  onPointerOver={() => setHovered(true)}
			onPointerOut={() => setHovered(false)}
		>
			<mesh>
				{/* main circle */}
				<circleGeometry args={[conf.Player.radius, conf.Player.segments]} />

				{isLocalPlayer && (
					<group>
						<object3D 
							ref={lightTargetRef} 
							position={[0, 2, 0]}  // ← Light points here
						/>
						<spotLight
							position={[0, 0, 1]}
							color="#ffeedd"
							intensity={50}
							angle={0.5}
							penumbra={1}
							decay={1}
							distance={20}
							target={lightTargetRef.current}
						/>
					</group>
				)}
				{texture ? (
				<meshStandardMaterial map={texture} color="#FFFFFF" emissive="#1A1A1A" side={THREE.DoubleSide} />
				) : (
					<>
					<meshStandardMaterial color="#78805E" side={THREE.DoubleSide} /> 
					<Text
						color="#D0F05C"
						position={[0, 0, 0.2]}
						font="/font/Plus_Jakarta_Sans/PlusJakartaSans-VariableFont_wght.ttf"
						fontWeight={800}
					>
						{getInitials(name)}
					</Text>
					</>
				// ) : (
					// <meshStandardMaterial color={color} side={THREE.DoubleSide} /> 
				)}
			</mesh>

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
					font="/font/Plus_Jakarta_Sans/PlusJakartaSans-VariableFont_wght.ttf"
					fontSize={0.6}
					color="white"
					onSync={() => getTextWidth(0)}
				>{name || id}</Text>
	  	</group>
			)}

		</group>
		</>
	);
})
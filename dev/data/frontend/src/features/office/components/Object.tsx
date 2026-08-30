/*
	Character with spatial audio configured
	Spatial audio enable audio panning from left/right
	when A is at left/right position of B

	local player socket.emits their position to backend when moving
	3D components position emits their position when on collision/moved
*/

import { useTexture } from '@react-three/drei';
import { useBox, useContactMaterial } from '@react-three/cannon';
import { Text } from '@react-three/drei';
import React, { useRef, useState, useEffect, useCallback, RefObject } from 'react';
import * as THREE from 'three';
import { useSocket } from '@/context/SocketContext';
import { useKeyboard } from '@/context/KeyboardContext';
import { Player, Position, getInitials } from '@/shared';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useTextWidth } from '@/features/office/hooks/useTextWidth';
import { usePosition } from '@/context';

interface ObjectProps extends Player {
	type?: 'Kinematic' | 'Dynamic';
	radius?: number;
	segments?: number;
}

export const Object = React.forwardRef<THREE.Object3D, ObjectProps>(({
	userId,
	id,
	name,
	position={ x:0, y:0, z:0 },
	radius=1,
	segments=24,
	color="#D0F05C",
	type='Dynamic',
	photo,
	ownership
	} : ObjectProps,
	ref) => {

	useContactMaterial('objMaterial', 'objMaterial', {
		friction: 0.8,
		restitution: 0.5,        				// 0 no bounce - 1 elastic
		contactEquationStiffness: 1,   	// lower = softer push
		contactEquationRelaxation: 500, // higher = softer/slower correction
	});
  const [objectRef, api] = useBox(() => ({
    mass: 1,
	  type: type,
  	linearDamping: 0.1,
	  material: 'objMaterial',
    position: [position.x, position.y, position.z],
		rotation: [-Math.PI / 2, 0, 0],
		fixedRotation: true,
  	allowSleep: false,
    args: [radius * 3, radius * 3, 3], // Match circle size
	  userData: { userId },
  }));

	const [hovered, setHovered] = useState(false);
	const { registerObject, unregisterObject, hasChangedRef, lockSystem } = usePosition();
	const { textRef, textWidth, getTextWidth } = useTextWidth();
	const { enableSocket, socket, localPlayerId } = useSocket();
	useEffect(() => { enableSocket(); }, []);

	let texture = null;
	if (photo)
		texture = useTexture(photo);

	// only propagate forward ref is isLocalPlayer
  useEffect(() => {
    if (ref && objectRef.current) {
      if (typeof ref === 'function') {
        ref(objectRef.current);
      } else {
        ref.current = objectRef.current;
      }
    }
  }, [ref]);

  useEffect(() => {
    registerObject(userId, api);
    return () => unregisterObject(userId);
  }, [userId, api]);

	// update position from values set outside
	useEffect(() => {
		// if im colliding with this object, do not update
		// only update objects that remote update
		
		if (lockSystem.isOwnedBy(userId, localPlayerId)) return ;

		api.position.set(position.x, position.y, position.z);
		// console.log(localPlayerId, ' [Object] set update position: ', position);
	}, [position, ownership?.ownerId]);

	/*
		WIP -
		Calls this function to update position every frame for local player
	  delta is from useFrame
	*/
	const newPos = new THREE.Vector3(0,0,0);

	const worldWidth = conf.World.width + conf.World.border;
	const worldHeight = conf.World.height + conf.World.border;

	const boundaries = {
			minX: -worldWidth/2 + radius,
			maxX: worldWidth/2 - radius,
			minZ: -worldHeight/2 + radius,
			maxZ: worldHeight/2 - radius
	};

	return (
		<>
		{/* plane mesh need rotation as default position = facing z pos */}
		<group
			ref={objectRef}
		  onPointerOver={() => setHovered(true)}
			onPointerOut={() => setHovered(false)}
		>
			<mesh>
				{/* main surface */}
				<circleGeometry args={[radius, segments]} />
				{texture ? (
				<meshStandardMaterial map={texture} color={color} emissive="#1A1A1A" side={THREE.DoubleSide} />
				) : (
					<meshStandardMaterial color={color} side={THREE.DoubleSide} /> 
				)}
			</mesh>

			{/* Ring outline on hover */}
			{hovered && (
				<mesh>
					<ringGeometry args={[radius * 0.95, radius * 1.1, 36]} />
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
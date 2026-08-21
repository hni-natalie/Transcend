/*
	Character with spatial audio configured
	Spatial audio enable audio panning from left/right
	when A is at left/right position of B

	local player socket.emits their position to backend when moving
	3D components position emits their position when on collision/moved
*/

import { useLoader, useFrame } from '@react-three/fiber';
import { useBox, useContactMaterial, useCylinder } from '@react-three/cannon';
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

export const Particle = React.forwardRef<THREE.Object3D, ObjectProps>(({
	userId,
	id,
	name,
	position={ x:0, y:0, z:0 },
	radius=0.2,
	segments=4,
	color="#FFFFFF",
	type='Dynamic',
	photo
	} : ObjectProps,
	ref) => {

	useContactMaterial('objMaterial', 'objMaterial', {
		friction: 0.1,
		restitution: 1,        				// 0 no bounce - 1 elastic
		contactEquationStiffness: 1,   	// lower = softer push
		contactEquationRelaxation: 1, // higher = softer/slower correction
	});
  const [objectRef, api] = useBox(() => ({
    mass: 0.5,
	  type: type,
  	linearDamping: 0.1,
	  material: 'objMaterial',
    position: [position.x, position.y, position.z],
		rotation: [-Math.PI / 2, 0, 0],
		fixedRotation: true,
  	allowSleep: false,
    args: [2, 2, 2], // bigger collision area
	  userData: { userId },
  }));

	const { enableSocket, socket, localPlayerId } = useSocket();
	useEffect(() => { enableSocket(); }, []);

	let texture = null;
	if (photo) {
		try {
			texture = (useLoader(THREE.TextureLoader, photo) as THREE.Texture);
		} catch (error) {
			texture = null;
		}
	}

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

	return (
		<>
		{/* plane mesh need rotation as default position = facing z pos */}
		<group
			ref={objectRef}
		>
			<mesh>
				{/* main surface */}
				<circleGeometry args={[radius, segments]} />
				{texture ? (
				<meshStandardMaterial map={texture} color="#FFFFFF" emissive="#1A1A1A" side={THREE.DoubleSide} />
				) : (
					<meshStandardMaterial color={color} side={THREE.DoubleSide} /> 
				)}
			</mesh>
		</group>
		</>
	);
})
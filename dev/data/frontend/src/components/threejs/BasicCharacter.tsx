import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface CharacterProps {
  position?: [x: number, y: number, z: number];
	color?: string;
  onChange?: (position: THREE.Vector3) => void;
}

// 2D Circle Character Component + Movement handling
export default function Character({ position = [0, 0, 0], color = "#D0F05C", onChange } : CharacterProps) {
	const characterRef = useRef<THREE.Mesh>(null);
	const [keys, setKeys] = useState({
		w: false, s: false, a: false, d: false
	});
	
	// Movement speed
	const speed = 5;
	
	// Handle keyboard input
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			if (keys.hasOwnProperty(key)) {
				setKeys(prev => ({ ...prev, [key]: true }));
			}
		};
		
		const handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase();
			if (keys.hasOwnProperty(key)) {
				setKeys(prev => ({ ...prev, [key]: false }));
			}
		};
		
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);
	
	// Calls this function to update position every frame
	// delta is from useFrame
	useFrame(( _, delta ) => {
		if (!characterRef.current) return;
		const movement = new THREE.Vector3(0, 0, 0);

		// Calculate movement direction
		if (keys.w) movement.z -= 1;  // Forward
		if (keys.s) movement.z += 1;  // Backward
		if (keys.a) movement.x -= 1;  // Left
		if (keys.d) movement.x += 1;  // Right
		
		// Normalize diagonal movement
		if (movement.length() > 0) movement.normalize();
		
		// Apply movement with speed and delta time
		characterRef.current.position.x += movement.x * speed * delta;
		characterRef.current.position.z += movement.z * speed * delta;
		
		// Optional: Rotate 3D character to face movement direction
		// if (movement.x !== 0 || movement.z !== 0) {
		// 	const angle = Math.atan2(movement.x, movement.z);
		// 	characterRef.current.rotation.y = angle;
		// }

		// update new position to outside
    if (onChange) {
      onChange(characterRef.current.position.clone());
			console.log('char position updated')
    }
	});
	
	return (
		<mesh ref={characterRef} position={position} rotation={[-Math.PI / 2, 0, 0]} >
			{/* <boxGeometry args={[1, 0.1, 1]} /> */}
			<circleGeometry args={[0.8, 24]} />
			<meshStandardMaterial color={color} side={THREE.DoubleSide} />
		</mesh>
	);
}
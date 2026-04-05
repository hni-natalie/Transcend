import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { useSocket } from '../../context/ContextSocket';
import { Player } from '../../types/user.types';

interface CharacterProps extends Player {
	isLocalPlayer: boolean;
	// listenerRef: React.RefObject< THREE.AudioListener >;
}

// 2D Circle Character Component + Movement handling
export default function Character({ id, position, color="#D0F05C", isLocalPlayer } : CharacterProps) {
	const listenerRef = useRef<THREE.AudioListener>(new THREE.AudioListener());
	const characterRef = useRef<THREE.Mesh>(null);
  // useImperativeHandle(ref, () => characterRef.current!);

  // const [pos, setPosition] = useState(position);
	const [keys, setKeys] = useState({
		w: false, s: false, a: false, d: false
	});
	const speed = 5; //movement speed
	
	const { enableSocket, socket, setPlayers } = useSocket();
	useEffect(() => { enableSocket(); }, []);

  console.log(`Init: Player ${id} received position prop:`, position);

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

	// Handle keyboard input
	useEffect(() => {
		if (!isLocalPlayer) return ;

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
	}, [isLocalPlayer]);
	
	// handle position
  // useEffect(() => {
  //   if (characterRef.current) {
	// 		// characterRef.current.position.set(position[0], position[1], position[2]);
	//     console.log(`Player ${id} setting position to:`, position);
  //   }
  // }, [position]);

	// Calls this function to update position every frame for local player
	// delta is from useFrame
	useFrame(( _, delta ) => {
		if (!characterRef.current || !isLocalPlayer) return;
		const movement = new THREE.Vector3(0, 0, 0);
		const newPos = new THREE.Vector3(characterRef.current.position.x, 0, characterRef.current.position.z);
		const moveDistance = speed * delta;

		// Calculate movement direction
		if (keys.w) movement.z -= 1;  // Forward
		if (keys.s) movement.z += 1;  // Backward
		if (keys.a) movement.x -= 1;  // Left
		if (keys.d) movement.x += 1;  // Right

		// Normalize diagonal movement
		if (movement.length() > 0) movement.normalize();
		
		// Apply movement with speed and delta time
		newPos.x += movement.x * moveDistance;
		newPos.z += movement.z * moveDistance;
		// characterRef.current.position.x += movement.x * moveDistance;
		// characterRef.current.position.z += movement.z * moveDistance;
		characterRef.current.position.set(newPos.x, 0, newPos.z); //!!!

		// if (isLocalPlayer) {
			// setPlayers(prev => prev.map(p => 
			// 	p.id === id 
			// 		? { ...p, position: { x: newPos.x, y: 0, z: newPos.z } }
			// 		: p
			// ));
		// }

		// setPosition([characterRef.current.position.x, 0, characterRef.current.position.z])
		// socket.emit('player-move', { id:id, position: [newPos.x, 0, newPos.z] });
		socket.emit('player-move', { id:id, position: {x:newPos.x, y:0, z:newPos.z} });

		// Optional: Rotate 3D character to face movement direction
		// if (movement.x !== 0 || movement.z !== 0) {
		// 	const angle = Math.atan2(movement.x, movement.z);
		// 	characterRef.current.rotation.y = angle;
		// }

		// update new position to outside
    // if (onChange) {
    //   onChange(characterRef.current[id].position.clone());
		// 	console.log('char position updated')
    // }

		// const vector3 = new THREE.Vector3().fromArray(position);
	});
	
	return (
		// we need rotation as plane default pos = facing z pos
		// <mesh ref={ref} position={pos} rotation={[-Math.PI / 2, 0, 0]} >
		// <mesh ref={characterRef} position={position} rotation={[-Math.PI / 2, 0, 0]} >
		<mesh ref={characterRef} position={[position.x, position.y, position.z]} rotation={[-Math.PI / 2, 0, 0]} >
			<circleGeometry args={[0.8, 24]} />
			<meshStandardMaterial color={color} side={THREE.DoubleSide} />
		</mesh>
	);
}
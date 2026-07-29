import { useRef, useState, useEffect } from 'react';
import { usePlane } from '@react-three/cannon';
import { officeSceneConfig as conf } from '@/config/office.config';

export function PlaneGround({ handleGroundClick }) {

	const hasMouseMoved = useRef(false);
	const hasMouseDown = useRef(false);
	// const groundRef = useRef<THREE.Mesh>(null);
	const [groundRef] = usePlane(() => ({
    mass: 0, // Static
    position: [0, -1, 0],
    rotation: [-Math.PI / 2, 0, 0],
  }));;


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
	// const handleGroundClick = (e) => {
	// 	if (!isConnectedRoomRef.current) return ;
	// 	clickPoint.current = new THREE.Vector3(e.point.x, 0, e.point.z);
	// 	// console.log('Click point (world):', clickPoint);
	// }

	return (
		<mesh
			onPointerUp={handlePointerUp}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			// rotation={[-Math.PI / 2, 0, 0]}
			// position={[0, -1, 0]}
			ref={groundRef}
		>
			<planeGeometry args={[conf.World.width+10, conf.World.height+10]} />
			<meshStandardMaterial color="#6E6E6E" metalness={0.5} visible={true} />
		</mesh>
	)
}
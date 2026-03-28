import { MenuSide } from '../components';
import { GenerateDept, Character } from '../components/threejs';
import { menuConfig } from '../config/menu.conf';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';


// Sound component with depth-based volume
// function SoundSource({ position, url, isPlaying = true }) {
// 	const soundRef = useRef()
// 	const listenerRef = useRef()
	
// 	useEffect(() => {
// 		// Create audio listener and sound
// 		const listener = new THREE.AudioListener()
// 		const sound = new THREE.Audio(listener)
		
// 		listenerRef.current = listener
// 		soundRef.current = sound
		
// 		// Load audio
// 		const audioLoader = new THREE.AudioLoader()
// 		audioLoader.load(url, (buffer) => {
// 			sound.setBuffer(buffer)
// 			sound.setLoop(true)
// 			sound.setVolume(1)
// 			if (isPlaying) sound.play()
// 		})
		
// 		// Add listener to camera
// 		// Note: You'll need to attach this to your camera component
// 		// This is a simplified version
		
// 		return () => {
// 			sound.stop()
// 			sound.disconnect()
// 		}
// 	}, [url, isPlaying])
	
// 	// Update volume based on distance from camera
// 	useFrame(({ camera }) => {
// 		if (!soundRef.current || !listenerRef.current) return
		
// 		const distance = camera.position.distanceTo(position)
// 		// Volume decreases with distance (adjust these values as needed)
// 		const maxDistance = 10
// 		const volume = Math.max(0, 1 - (distance / maxDistance))
// 		soundRef.current.setVolume(volume)
// 	})
	
// 	return null
// }


// Main Scene
export default function SpaceScene() {
  const [characterPos, setCharacterPos] = useState(new THREE.Vector3(0, 0, 0));

  // const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  
  // useFrame(() => {
  //   if (cameraRef.current) {
  //     // Position above the scene
  //     cameraRef.current.position.set(0, 10, 10)
  //     // Rotate to look straight down
	//     cameraRef.current.lookAt(0, 0, 0)
  //     // cameraRef.current.rotation.x = -Math.PI / 2
  //     // Or use lookAt
  //     // cameraRef.current.lookAt(0, 0, 0)
  //   }
  // })

	return (
		<div className='bg-brand-black-sub h-screen flex gap-0.5'>
		<MenuSide conf={menuConfig} />

		<div className='bg-brand-black p-8 flex w-full'>
		<Canvas className=''>
			<PerspectiveCamera 
				makeDefault
				position={[0, 30, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
				fov={50}
				near={0.1}
				far={100}
			/>

			<ambientLight intensity={0.8} />
			{/* <directionalLight position={[10, 5, 5]} /> */}
			
			{/* Ground */}
			{/* <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
				<planeGeometry args={[100, 100]} />
				<meshStandardMaterial color="#404040" />
			</mesh> */}
			<GenerateDept count={8} characterPos={characterPos} />
			
			<Character onChange={setCharacterPos}/>
			
			{/* Grid helper for reference */}
			<gridHelper args={[100, 20]} />
		</Canvas>
		</div>
		</div>
	);
}
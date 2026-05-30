/*
 generate adaptive planes to represent diff departments
 based on input count
*/

import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveKit } from '@features/livekit'

interface GenerateDeptProps {
	count?: number;
	padding?: number;
	characterPos?: THREE.Vector3;
  room: string;
}

export function GenerateDept({ count=5, padding=3, characterPos, room } : GenerateDeptProps) {
  const { viewport } = useThree();
  // const [activePlane, setActivePlane] = useState(null);
  const { activePlane, setActivePlane, isConnectedRoom } = useLiveKit(room);

  const characterPosRef = useRef(characterPos);
  const planeRefs = useRef(new Map());

  useEffect(() => {
    characterPosRef.current = characterPos;
    // console.log('Character posRef:', characterPosRef.current)
  }, [characterPos]);
  
	// Function to set ref
  const setPlaneRef = ( index:number ) => ( el:number ) => {
    if (el) {
      planeRefs.current.set(index, el);
    } else {
      planeRefs.current.delete(index);
    }
  };
	// Collision detection
  useFrame(() => {
    if (!characterPosRef.current || !isConnectedRoom) return;
    
    for (const [index, plane] of planeRefs.current.entries()) {
      const halfWidth = plane.geometry.parameters.width / 2;
      const halfHeight = plane.geometry.parameters.height / 2;
      
      const isWithinBounds = 
        Math.abs(characterPosRef.current.x - plane.position.x) < halfWidth &&
        Math.abs(characterPosRef.current.z - plane.position.z) < halfHeight;
      
      if (isWithinBounds) {
        if (activePlane !== index) {
          setActivePlane(index);
        }
        return;
      }
      else if (!isWithinBounds && activePlane === index)
        setActivePlane(null);
    }
  });

  // Get canvas dimensions in world units
  // const canvasWidth = viewport.width;
  // const canvasHeight = viewport.height;
  // console.log("canvas w: ", canvasWidth, " , canvas h: ", canvasHeight);
  const canvasWidth = 50;
  const canvasHeight = 50;

  // Calculate plane dimensions based on canvas size and count
  const planes = useMemo(() => {
    const result = [];
    
    // Calculate grid layout that best fits the canvas aspect ratio
    const aspectRatio = canvasWidth / canvasHeight;
    const cols = Math.ceil(Math.sqrt(count * aspectRatio));
    const rows = Math.ceil(count / cols);
    
		// Calculate cell size including padding
		const cellWidth = canvasWidth / cols;
		const cellHeight = canvasHeight / rows;
		
		// Calculate actual plane size (subtract padding)
		const planeWidth = cellWidth - padding;
		const planeHeight = cellHeight - padding;
    
    // Calculate positions to fill the entire canvas viewport
    const startX = -canvasWidth / 2 + cellWidth / 2;
    const startZ = -canvasHeight / 2 + cellHeight / 2;
    
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      // Only create if within the grid bounds
      if (row < rows) {
        const x = startX + col * cellWidth;
        const z = startZ + row * cellHeight;
        
        // Generate unique color for each plane
        const hue = (i / count) * 360;

        result.push(
          <mesh
            key={i}
          	ref={setPlaneRef(i)}
            position={[x, -0.5, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            userData={{ index: i }}
          >
            <planeGeometry args={[planeWidth, planeHeight]} />
            <meshStandardMaterial
	            color={activePlane === i ? `hsl(${hue}, 50%, 60%)` : `hsl(${hue}, 20%, 50%)`}
              side={THREE.DoubleSide}
              roughness={0.4}
              metalness={0.1}
              emissive={`hsl(${hue}, 70%, 10%)`}
            />
          </mesh>
        );
      }
    }
    
    return result;
  }, [count, canvasWidth, canvasHeight, activePlane]);
  
  return <group>{planes}</group>;
}

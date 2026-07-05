/*
 generate adaptive planes to represent diff departments
 based on input count
*/

import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveKit } from '@features/livekit'
import { officeSceneConfig as conf } from '@/config/office.config';
import { officeService } from '@/features/office/services/office.service';
import { useTextWidth } from '@/features/office/hooks/useTextWidth';
import { BlinkingText } from '@/shared';

interface GenerateDeptProps {
	// count?: number;
	padding?: number;
  localPlayerRef?: React.RefObject<THREE.Mesh | null>;
  room: string;
}

const getOfficeDept = async () => {
  const res = await officeService.getAllSpaceNames();
  let departmentNames = [];
  let departmentCount = 0;

  console.log('received data: ', res);
  // console.log('received data: ', res?.success);
  if (res.success && Array.isArray(res.data)) {
    departmentNames = res.data;
    departmentCount = res.data.length;
    // console.log('Departments:', res.data);
    // console.log('Length of array:', res.data.length);
  }
  return { departmentNames, departmentCount};
}

export function GenerateDept({ padding=5, localPlayerRef, room } : GenerateDeptProps) {
  const { activePlane, setActivePlane, isConnectedRoom } = useLiveKit(room);
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const { textRef, textWidth, getTextWidth, setTextWidth } = useTextWidth();
  const planeRefs = useRef(new Map());

	// Function to set ref
  const setPlaneRef = ( index:number ) => ( el:number ) => {
    if (el) {
      planeRefs.current.set(index, el);
    } else {
      planeRefs.current.delete(index);
    }
  };
  // Reset textWidth when hover ends
  // const handlePointerOut = () => {
  //   console.log('reset params on out')
  //   setHoveredIndex(null);
  //   // setTextWidth(0);  // ✅ Reset width when not hovering
  // };

	// Collision detection
  useFrame(() => {
    if (!localPlayerRef.current || !isConnectedRoom) return;
    
    for (const [index, plane] of planeRefs.current.entries()) {
      const halfWidth = plane.geometry.parameters.width / 2;
      const halfHeight = plane.geometry.parameters.height / 2;
      
      const isWithinBounds = 
        Math.abs(localPlayerRef.current.position.x - plane.position.x) < halfWidth &&
        Math.abs(localPlayerRef.current.position.z - plane.position.z) < halfHeight;
      
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


  const [loading, setLoading] = useState(true);
  const [departmentNames, setDepartmentNames] = useState([]);
  const [count, setCount] = useState(0);
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const { departmentNames, departmentCount } = await getOfficeDept();
      setDepartmentNames(departmentNames);
      setCount(departmentCount);
      setLoading(false); // ✅ Everything is ready
    };
    fetchData();
  }, []);

  // Get canvas dimensions in world units
  // const canvasWidth = viewport.width;
  // const canvasHeight = viewport.height;
  // console.log("canvas w: ", canvasWidth, " , canvas h: ", canvasHeight);
  const canvasWidth = conf.World.width;
  const canvasHeight = conf.World.height;

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

    // console.log('col: ', cols, 'row: ', rows, 'cell_w: ', cellWidth, 'cell_h: ', cellHeight, 'plane_w: ', planeWidth, 'plane_h: ', planeHeight);

    // Calculate positions to fill the entire canvas viewport
    const startX = -canvasWidth / 2 + cellWidth / 2;
    const startZ = -canvasHeight / 2 + cellHeight / 2;
    
    // for (let i = 0; i < count; i++) {
    departmentNames.map((space, i) => {

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
            userData={{ index:i, name:space.spaceName }}
            onPointerOver={() => setHoveredIndex(i)}
            onPointerOut={() => setHoveredIndex(null)}
            // onPointerOut={handlePointerOut}
          >
            {/* office floor plane */}
            <planeGeometry args={[planeWidth, planeHeight]} />
            <meshStandardMaterial
              color={activePlane === i ? `hsl(${hue}, 50%, 60%)` : `hsl(${hue}, 20%, 50%)`}
              side={THREE.DoubleSide}
              roughness={0.4}
              metalness={0.2}
              emissive={`hsl(${hue}, 70%, 10%)`}
            />
      			{/* Text on hover */}
            {hoveredIndex === i && (
            <group position={[0, planeHeight*-0.4, 0.2]} >
              {/* Rectangle Background Mesh */}
              <mesh position={[0, 0, -0.1]}>
                <planeGeometry args={[textWidth[i], 0.9]} />
                <meshStandardMaterial color="#1D2307" opacity={0.5} transparent />
              </mesh>
              <Text
                ref={(ref) => textRef.current[i] = ref}
                fontSize={0.6}
                color="white"
                onSync={() => getTextWidth(i)}
              >{space.spaceName}</Text>
            </group>
            )}
          </mesh>
        );
      }
    }) // map
    return result;
  }, [count, canvasWidth, canvasHeight, activePlane, hoveredIndex, textWidth]);
  
  if (loading) {
    return (
      <BlinkingText
        text="Fetching departments"
        font="/font/Space_Mono/SpaceMono-Regular.ttf"
        fontSize={1.1}
        color="white"
      />
    );
  }
  return <group>{planes}</group>;
}

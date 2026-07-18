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
import * as d3 from 'd3-hierarchy';

interface GenerateDeptProps {
	padding?: number;
  localPlayerRef?: React.RefObject<THREE.Mesh | null>;
  room: string;
}

interface TreemapData {
  id: string;
  parentId?: string | null;
  value: number;
}

const getOfficeDept = async () => {
  const res = await officeService.getAllSpaces();

  let departmentNames = [];
  let departmentCount = 0;
  let officeSpaces = [];

  // console.log('received data: ', res);
  if (res.success && Array.isArray(res.data)) {
    const departmentSize = res.data.map(item => item.userCapacity);

    departmentNames = res.data.map(item => item.spaceName);
    officeSpaces = res.data;
    departmentCount = officeSpaces.length;
    // console.log('received spaces: ', officeSpaces);
    // console.log('Departments:', departmentNames);
    // console.log('Length of array: ', departmentCount);
  }
  return { departmentNames, departmentCount, officeSpaces };
}

export function GenerateDept({ padding=1, localPlayerRef, room } : GenerateDeptProps) {
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
  const [officeSpace, setOfficeSpace] = useState([]);
  const [count, setCount] = useState(0);
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const { departmentCount, officeSpaces } = await getOfficeDept();
      setOfficeSpace(officeSpaces);
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
    
    // 1. Prepare data for treemap
    const root = d3.stratify<TreemapData>()
      .id(d => d.id)
      .parentId(d => d.parentId || null)
      ([
        { id: "root", value: 0 },
        ...officeSpace.map(p => ({ 
            id: p.spaceId, 
            parentId: "root", 
            value: p.userCapacity  // Use capacity as the area!
        }))
      ])
      .sum(d => Math.sqrt(d.value ?? 0));   // <-- required, without this all leaf values are 0/undefined
      // .sum(d => Math.log((d.value ?? 0) + 1)); // lesser diff between large & small

    // 2. Create treemap layout (this replaces cols/rows)
    const treemap = d3.treemap()
      .size([canvasWidth, canvasHeight])
      .padding(padding)
      .tile(d3.treemapSquarify.ratio(1));

      const layout = treemap(root);
      // console.log('Treemap size:', treemap.size());
      // console.log('First leaf:', layout.leaves()[0]);

    // 3. Extract positions (no cols/rows needed!)
    const shrinkFactor = 0.5
    const positionedPlanes = layout.leaves().map(( leaf:any, i ) => {
      const planeData = officeSpace.find(p => p.spaceId === leaf.data.id);
      return {
          ...planeData,
          index: i,
          x: (leaf.x0 + leaf.x1) / 2 - canvasWidth/2,
          z: (leaf.y0 + leaf.y1) / 2 - canvasHeight/2,
          width: (leaf.x1 - leaf.x0) * shrinkFactor,
          height: (leaf.y1 - leaf.y0) * shrinkFactor
      };
    });

    // 4. Create meshes at calculated positions
    positionedPlanes.forEach((plane, i) => {
      const hue = (i / count) * 360;
      // console.log('plane: ', plane.spaceName, 'size: ', plane.width, ' ', plane.height, ' ', plane.depth)
      result.push(
        <mesh
          key={i}
          ref={setPlaneRef(i)}
          position={[plane.x, -0.5, plane.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          userData={{ index:i, name:plane.spaceName }}
          onPointerOver={() => setHoveredIndex(i)}
          onPointerOut={() => setHoveredIndex(null)}
        >
          {/* office floor plane */}
          <planeGeometry args={[plane.width, plane.height]} />
          <meshStandardMaterial
            color={activePlane === i ? `hsl(${hue}, 50%, 60%)` : `hsl(${hue}, 20%, 50%)`}
            side={THREE.DoubleSide}
            roughness={0.4}
            metalness={0.2}
            emissive={`hsl(${hue}, 70%, 10%)`}
          />
          {/* Text on hover */}
          {hoveredIndex === i && (
          <group position={[0, plane.height*-0.4, 0.2]} >
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
            >{plane.spaceName}</Text>
          </group>
          )}
        </mesh>
      );
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

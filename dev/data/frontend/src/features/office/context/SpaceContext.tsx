import * as THREE from 'three';
import * as d3 from 'd3-hierarchy';
import { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useLiveKit } from '@features/livekit'
import { officeService } from '@/features/office/services/office.service';
import { useTextWidth } from '@/features/office/hooks/useTextWidth';

const SpaceContext = createContext(null);
export const useOfficeSpace = () => useContext(SpaceContext);


interface TreemapData {
  id: string;
  parentId?: string | null;
  value: number;
}

interface SpaceProviderProps {
	children: React.ReactNode | React.ReactNode[];
	padding?: number;
	localPlayerRef?: React.RefObject<THREE.Group | null>;
	roomName: string;
}

/************************************************
 Office Context logic
 ************************************************/
const getOfficeDept = async () => {
	const res = await officeService.getAllSpaces();

	let departmentNames = [];
	let departmentCount = 0;
	let officeSpaces = [];

	// console.log('received data: ', res);
	if (res.success && Array.isArray(res.data)) {
		// const departmentSize = res.data.map(item => item.userCapacity);

		departmentNames = res.data.map(item => item.spaceName);
		officeSpaces = res.data;
		departmentCount = officeSpaces.length;
		// console.log('received spaces: ', officeSpaces);
		// console.log('Departments:', departmentNames);
		// console.log('Length of array: ', departmentCount);
	}
	return { departmentNames, departmentCount, officeSpaces };
}

export function SpaceProvider({ children, padding=1, localPlayerRef, roomName } : SpaceProviderProps ) {
	const { activePlane, setActivePlane, isConnectedRoom } = useLiveKit(roomName);
	const [hoveredIndex, setHoveredIndex] = useState(null)
	const { textRef, textWidth, getTextWidth } = useTextWidth();
	const planeRefs = useRef(new Map());

	const [loading, setLoading] = useState(true);
	const [officeSpace, setOfficeSpace] = useState([]);
	const [count, setCount] = useState(0);

  const setPlaneRef = ( index:number ) => ( el:THREE.Mesh ) => {
    if (el) {
      planeRefs.current.set(index, el);
    } else {
      planeRefs.current.delete(index);
    }
  };

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


	const canvasWidth = conf.World.width;
	const canvasHeight = conf.World.height;
	const planes = useMemo(() => {

		const result = [];
		// console.log('Office space dpId: ', officeSpace.departmentId);
		
		// 1. Prepare data for treemap
		const root = d3.stratify<TreemapData>()
			.id(d => d.id)
			.parentId(d => d.parentId || null)
			([
				{ id: "root", value: 0 },
				...officeSpace.map(p => ({ 
						id: p.spaceId, 
						parentId: "root", 
						value: p.userCapacity,  // Use capacity as the area!
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
			// console.log('planeData : ', planeData);
			return {
					...planeData,
					index: i,
					x: (leaf.x0 + leaf.x1) / 2 - canvasWidth/2,
					z: (leaf.y0 + leaf.y1) / 2 - canvasHeight/2,
					width: (leaf.x1 - leaf.x0) * shrinkFactor,
					height: (leaf.y1 - leaf.y0) * shrinkFactor,
			};
		});

		// 4. Create meshes at calculated positions
		positionedPlanes.forEach((plane, i) => {
			const hue = (i / count) * 360;
			// const planeId = plane.departmentId;
			// console.log('planeId: ', planeId);
			// console.log('plane: ', plane.spaceName, 'size: ', plane.width, ' ', plane.height, ' ', plane.depth)
			result.push(
				<mesh
					key={i}
					ref={setPlaneRef(i)}
					position={[plane.x, -0.5, plane.z]}
					rotation={[-Math.PI / 2, 0, 0]}
					userData={{
						index:i,
						name:plane.spaceName,
						accessLevel: plane.accessLevel,
						dpId: plane.departmentId
					}}
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
							font="/font/Plus_Jakarta_Sans/PlusJakartaSans-VariableFont_wght.ttf"
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

	const value = {
		planes,
		loading,
		planeRefs
	};

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}
/*
	Handling all planes in Scene
*/
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
			setLoading(false);
		};
		fetchData();
	}, []);

	const canvasWidth = conf.World.width;
	const canvasHeight = conf.World.height;
	
	// 1. Prepare data for treemap
	const treemapData = useMemo(() => {
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
			.sum(d => Math.sqrt(d.value ?? 0));   // without this all leaf values are 0/undefined
			// .sum(d => Math.log((d.value ?? 0) + 1)); // lesser diff between large & small

		// 2. Create treemap layout (this replaces cols/rows)
		const treemap = d3.treemap()
			.size([canvasWidth, canvasHeight])
			.padding(padding)
			.tile(d3.treemapSquarify.ratio(1));

		const layout = treemap(root);
		// console.log('Treemap size:', treemap.size());
		// console.log('First leaf:', layout.leaves()[0]);
		return layout;
	}, [officeSpace, canvasWidth, canvasHeight])

	const positionedPlanes = useMemo(() => {
		// 3. Extract positions
		const shrinkFactor = 0.5
		return treemapData.leaves().map(( leaf:any, i ) => {
			const planeData = officeSpace.find(p => p.spaceId === leaf.data.id);
			return {
					...planeData,
					index: i,
					x: (leaf.x0 + leaf.x1) / 2 - canvasWidth/2,
					z: (leaf.y0 + leaf.y1) / 2 - canvasHeight/2,
					width: (leaf.x1 - leaf.x0) * shrinkFactor,
					height: (leaf.y1 - leaf.y0) * shrinkFactor,
			};
		});
	},[treemapData, officeSpace, canvasWidth, canvasHeight])

	const planes = useMemo(() => {
		
		const result = [];
		// 4. Create meshes at calculated positions
		const loader = new THREE.TextureLoader();
		const tileSize = 10;
		
		positionedPlanes.forEach((plane, i) => {
			const hue = (i / count) * 210;
			// const texture = loader.load('/texture/grass.png');
			const texture = loader.load('/texture/marble/marble-roughness.png');
			// const planeId = plane.departmentId;
			// console.log('planeId: ', planeId);
			// console.log('plane: ', plane.spaceName, 'size: ', plane.width, ' ', plane.height, ' ', plane.depth)

				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(
					plane.width / tileSize,
					plane.height / tileSize
				);
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
						color={`hsl(${hue}, 5%, 50%)`}
						map={texture}
						side={THREE.DoubleSide}
						roughness={0.4}
						metalness={0.2}
						emissive={`hsl(${hue}, 70%, 10%)`}
					/>
				</mesh>
			);
	}) // map
	return result;
	}, [count, canvasWidth, canvasHeight, positionedPlanes]);

	const activeOverlay = useMemo(() => {
		if (activePlane === null) return null;
		const plane = positionedPlanes[activePlane];
		const hue = (activePlane / count) * 210;

		if (!plane) return null;
			
		return (
			<mesh
					position={[plane.x, -0.48, plane.z]}
					rotation={[-Math.PI / 2, 0, 0]}
			>
				<planeGeometry args={[plane.width, plane.height]} />
				<meshStandardMaterial
					color={`hsl(${hue}, 50%, 60%)`}
					transparent
					opacity={0.2}
					side={THREE.DoubleSide}
				/>
			</mesh>
		);
	}, [activePlane, positionedPlanes]);

	const hoverOverlay = useMemo(() => {
		if (hoveredIndex === null) return null;
    const plane = positionedPlanes[hoveredIndex];

		return (
		<group
			name='text-on-hover'
			position={[plane.x, 0.1, plane.z]}
			rotation={[-Math.PI / 2, 0, 0]}
		>
			<mesh name='rec-bg' position={[0, 0, -0.1]}>
				<planeGeometry args={[textWidth[hoveredIndex], 0.9]} />
				<meshStandardMaterial color="#FFFFFF" opacity={0.5} transparent />
			</mesh>
			<Text
				ref={(ref) => textRef.current[hoveredIndex] = ref}
				font="/font/Plus_Jakarta_Sans/PlusJakartaSans-VariableFont_wght.ttf"
				fontSize={0.6}
				color="white"
				onSync={() => getTextWidth(hoveredIndex)}
			>
				{plane.spaceName}
			</Text>

		</group>
		)
	}, [hoveredIndex, textWidth])

	const value = {
		planes,
		loading,
		planeRefs,
		hoverOverlay,
		activeOverlay,
	};

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}
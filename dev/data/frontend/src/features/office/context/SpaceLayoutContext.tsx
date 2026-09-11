/*
	Initializes SpaceLayout before user joins Space
	default should be Office Space
	Context for managing size of office spaces, space layout spawn position and convert to <mesh>
*/
import { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { officeService } from '@/features/office/services/office.service';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useSocket } from '@/context';
import * as d3 from 'd3-hierarchy';
import * as THREE from 'three';

const SpaceLayoutContext = createContext({
	positionedPlanes: undefined,
	positionDataRef: { current: [] },
	canvasHeight: 0,
	canvasWidth: 0,
	setLoading: () => {},
	loading: false,
	count: 0,
});
export const useOfficeSpaceLayout = () => useContext(SpaceLayoutContext);


interface TreemapData {
	id: string;
	parentId?: string | null;
	value: number;
}

export interface SpaceLayoutProviderProps {
	children: React.ReactNode | React.ReactNode[];
	padding?: number;
	roomName: string;
}

/************************************************
 Office Layout logic
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

export function SpaceLayoutProvider({ children, padding=1, roomName } : SpaceLayoutProviderProps ) {
	const [hoveredIndex, setHoveredIndex] = useState(null)
	const [officeSpace, setOfficeSpace] = useState([]);
	const [loading, setLoading] = useState(true);
	const [count, setCount] = useState(0);
	const { socket, isConnected, getToken } = useSocket();
	const positionDataRef = useRef([]);
	const planeRefs = useRef(new Map());

	useEffect(() => {
    const token = getToken();
    if (!token) return;

		setLoading(true);
		const fetchData = async () => {
			const { departmentCount, officeSpaces } = await getOfficeDept();
			setOfficeSpace(officeSpaces);
			setCount(departmentCount);
		};
		fetchData();
	}, []);

	const setPlaneRef = ( index:number ) => ( el:THREE.Mesh ) => {
		if (el) {
			planeRefs.current.set(index, el);
		} else {
			planeRefs.current.delete(index);
		}
	};

 /* **************************************************************
	* Memo declarations
	* **************************************************************/
	const canvasWidth = conf.World.width;
	const canvasHeight = conf.World.height;
	const themeColor = conf.Color.themes.golden;

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
		console.log('[SpaceLayout] 1/3 treeMap ready!');
		return layout;
	}, [officeSpace, canvasWidth, canvasHeight])

	// 3. Extract positions
	const positionedPlanes = useMemo(() => {
		if (!socket) {
			console.log("[SpaceLayoutContext] Socket not ready! Reload page ...");
			return ;
		}
		const shrinkFactor = 0.5
		const data = treemapData.leaves().map(( leaf:any, i ) => {
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
		// console.log('[SpaceContext] positionedPlanes: ', data);
		const positionData = data.map(item => ({
			departmentId:item.departmentId,
			accessLevel:item.accessLevel,
			x:item.x,
			z:item.z
		}));
		positionDataRef.current = positionData;
		socket.emit('room-spawn-pos', { roomName, positionData:positionDataRef.current });
		setLoading(false);
		
		console.log('[SpaceLayout] 2/3 positionedPlanes ready!');
		return data;
	},[treemapData, officeSpace, canvasWidth, canvasHeight, isConnected])

	// 4. Create meshes at calculated positions
	const planes = useMemo(() => {
		
		if (!positionedPlanes) return ;

		const result = [];
		const loader = new THREE.TextureLoader();
		const tileSize = 10;
		
		positionedPlanes.forEach((plane, i) => {
			// const hue = (i / count) * conf.Color.endHue;
			const theme = themeColor[i % themeColor.length];
			const texture = loader.load('/texture/marble-2/roughness.png');

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
						dpId: plane.departmentId,
						spaceId: plane.spaceId
					}}
					onPointerOver={() => setHoveredIndex(i)}
					onPointerOut={() => setHoveredIndex(null)}
				>
					{/* office floor plane */}
					<planeGeometry args={[plane.width, plane.height]} />
					<meshStandardMaterial
						color={theme}
						map={texture}
						side={THREE.DoubleSide}
						roughness={0.4}
						metalness={0.2}
					/>
				</mesh>
			);
	}) // map
	console.log('[SpaceLayout] 3/3 planes meshes ready!');
	return result;
	}, [canvasWidth, canvasHeight, positionedPlanes]);

	const value = {
		planes,
		planeRefs,
		themeColor,
		hoveredIndex,
		positionedPlanes,
		positionDataRef,
		canvasHeight,
		canvasWidth,
		setLoading,
		loading,
		count,
	};

  return (
    <SpaceLayoutContext.Provider value={value}>
      {children}
    </SpaceLayoutContext.Provider>
  );
}
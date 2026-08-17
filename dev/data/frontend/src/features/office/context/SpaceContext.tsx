/*
	Handling all planes in Scene
*/
import * as THREE from 'three';
import * as d3 from 'd3-hierarchy';
import { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useLiveKit } from '@features/livekit'
import { officeService } from '@/features/office/services/office.service';
import { useTextWidth } from '@/features/office/hooks/useTextWidth';
import { useSocket } from '@/context';

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
function getPlanePosition( planeRefs:any, dpId:string ) {

  for (const [index, mesh] of planeRefs.current) {
    // console.log(`Plane ${index}:`, mesh.userData);
    // console.log('Access Level:', mesh.userData.accessLevel);
    // console.log('Department ID:', mesh.userData.dpId);
    
    if (mesh.userData.accessLevel === 'department') {
      // console.log(`✅ Found department plane at index ${index}:`, mesh.userData);
			if (mesh.userData.dpId === dpId) {
      	// console.log('Department: ', mesh.userData.name, ' ', mesh.userData.dpId);
      	// console.log('mesh pos: ', mesh.position);
				return (mesh.position);
			}
    }
  }
};

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

const updateRoomPlayer = (prev, data, planeRefs) => {
	const planePos = getPlanePosition(planeRefs, data.player.dpId);
	// const finalPos = {
	// 	x: planePos?.x || 0, //+ (data.player.position?.x || 0), // should be random +0.01
	// 	y: 0,
	// 	z: planePos?.z || 0, //+ (data.player.position?.z || 0)
	// }

	const existingUserIdx = prev.findIndex(p => p.userId === data.player.userId);
	console.log('[updateRoomPlayer] existing player: ', existingUserIdx, ' ', data.player.userId);
	// console.log('[updateRoomPlayer] finalPos: ', finalPos, ' player: ', data.player.position);
	if (existingUserIdx !== -1) {
		const updatedPlayers = [...prev];
		// updatedPlayers[existingUserIdx] = {
		// 	...data.player, // replace, check if userId gets updated
		// 	position: finalPos || data.player.position
		// }
		updatedPlayers[existingUserIdx] = data.player;
		return updatedPlayers;
	}
	else {
		// return [...prev, { ...data.player, position: finalPos || data.player.position }];
		return [...prev, data.player];
	}
}

export function SpaceProvider({ children, padding=1, localPlayerRef, roomName } : SpaceProviderProps ) {
	const { socket, shouldConnect, setRoomPlayers, isConnected } = useSocket();
	const { activePlane, setActivePlane, isConnectedRoom } = useLiveKit(roomName);
	const [hoveredIndex, setHoveredIndex] = useState(null)
	const { textRef, textWidth, getTextWidth } = useTextWidth();
	const planeRefs = useRef(new Map());
	const positionDataRef = useRef([]);

	const [loading, setLoading] = useState(true);
	const [officeSpace, setOfficeSpace] = useState([]);
	const [count, setCount] = useState(0);

  /* **************************************************************
   * Socket declarations
   * **************************************************************/
	useEffect(() => {
		if (!socket) {
			console.log('socket not ready!');
			return ;
		}

    socket.on('player-joined-room', (data) => {
      setRoomPlayers(prev => updateRoomPlayer(prev, data, planeRefs));
      console.log(`User ${data.player.name}, sockId:${data.player.id} joined ${data.roomName}`);
    });

    socket.on('existing-room-players', (data) => {
      console.log(`[existing-room-players]:`, data);
      setRoomPlayers(data);
    })

    socket.on('get-room-spawn-pos', (data) => {
			console.log('[get-room-spawn-pos] roomName ', data.roomName);
			if (positionDataRef.current.length > 0)
				socket.emit('room-spawn-pos', { roomName, positionData:positionDataRef.current });
		});

    return () => {
      if (socket && !shouldConnect) {
        socket.off('player-joined-room');
        socket.off('existing-room-players');
        socket.off('get-room-spawn-pos');
			}
		}
	}, [socket]);

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
		return layout;
	}, [officeSpace, canvasWidth, canvasHeight])

	const positionedPlanes = useMemo(() => {
		// 3. Extract positions
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
		return data;
	},[treemapData, officeSpace, canvasWidth, canvasHeight])

	const planes = useMemo(() => {
		
		const result = [];
		// 4. Create meshes at calculated positions
		const loader = new THREE.TextureLoader();
		const tileSize = 10;
		
		positionedPlanes.forEach((plane, i) => {
			const hue = (i / count) * conf.Color.endHue;
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
						dpId: plane.departmentId
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
	return result;
	}, [count, canvasWidth, canvasHeight, positionedPlanes]);

	const activeOverlay = useMemo(() => {
		if (activePlane === null) return null;
		const plane = positionedPlanes[activePlane];
		const hue = (activePlane / count) * conf.Color.endHue;
		const theme = themeColor[activePlane % themeColor.length];
		const color = theme.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
		const value = Number(color[3]) * 2;
		// console.log('hsl: ', color[0], ' ', color[1], ' ', color[2], ' ', color[3]);
		// console.log('sat: ', value);

		if (!plane) return null;
			
		return (
			<mesh
					position={[plane.x, -0.48, plane.z]}
					rotation={[-Math.PI / 2, 0, 0]}
			>
				<planeGeometry args={[plane.width, plane.height]} />
				<meshStandardMaterial
					color={`hsl(${color[1]}, 100%, ${color[3]}%)`}
					transparent
					opacity={0.1}
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
		getPlanePosition,
	};

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}
/*
	Initializes SpaceLayout before user joins Space
	default should be Office Space
	Context for managing size of office spaces, space layout spawn position and convert to <mesh>
*/
import React, { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { officeService } from '@/features/office/services/office.service';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useSocket } from '@/context';
import * as THREE from 'three';

interface SpaceLayoutContextType {
  positionedPlanes: any[];
  positionDataRef: React.RefObject<any[]>;
  canvasHeight: number;
  canvasWidth: number;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;  // <-- exact match
  loading: boolean;
  count: number;
}
const SpaceLayoutContext = createContext<SpaceLayoutContextType | null>(null);

export const useOfficeSpaceLayout = () => useContext(SpaceLayoutContext);

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
	const [positionedPlanes, setPositionedPlanes] = useState(null);
	const { socket, isConnected, getToken } = useSocket();
	const positionDataRef = useRef([]);
	const planeRefs = useRef(new Map());

	// BE inits/holds positionData in roomData; request it so BE computes it
	// (and shares the cache with UserMessages/UserOffice), then store what BE emits back.
	useEffect(() => {
		const token = getToken();
		if (!token || !socket) return;

		socket.emit('request-room-players', { roomName });

		const onRoomPositionData = (data:any) => {
			positionDataRef.current = data;
			setPositionedPlanes(data);
			setLoading(false);
			console.log('[SpaceLayout] positionedPlanes received from BE!');
		};
		socket.on('room-position-data', onRoomPositionData);
		return () => {
			socket.off('room-position-data', onRoomPositionData);
		};
	}, [socket, roomName]);

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
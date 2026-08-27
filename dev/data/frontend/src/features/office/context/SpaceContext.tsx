/*
	Handling all planes in Scene
*/
import * as THREE from 'three';
import { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useLiveKit } from '@features/livekit'
import { useTextWidth } from '@/features/office/hooks/useTextWidth';
import { useOfficeSpaceLayout, SpaceLayoutProviderProps } from '@/features/office/context/SpaceLayoutContext';
import { useSocket } from '@/context';

const SpaceContext = createContext(null);
export const useOfficeSpace = () => useContext(SpaceContext);


interface SpaceProviderProps extends SpaceLayoutProviderProps {
	localPlayerRef?: React.RefObject<THREE.Group | null>;
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

const updateRoomPlayer = (prev, data) => {

	const existingUserIdx = prev.findIndex(p => p.userId === data.player.userId);
	console.log('[updateRoomPlayer] existing player: ', existingUserIdx, ' ', data.player.userId);
	if (existingUserIdx !== -1) {
		const updatedPlayers = [...prev];
		updatedPlayers[existingUserIdx] = data.player;
		return updatedPlayers;
	}
	else {
		return [...prev, data.player];
	}
}

export function SpaceProvider({ children, padding=1, localPlayerRef, roomName } : SpaceProviderProps ) {
	const { socket, shouldConnect, setRoomPlayers, isConnected } = useSocket();
	const { count, positionedPlanes, positionDataRef, canvasHeight, canvasWidth } = useOfficeSpaceLayout();
	const { activePlane, setActivePlane, isConnectedRoom } = useLiveKit(roomName);
	const [hoveredIndex, setHoveredIndex] = useState(null)
	const { textRef, textWidth, getTextWidth } = useTextWidth();
	const planeRefs = useRef(new Map());
	const previousActivePlaneRef = useRef<number | null>(null);

  /* **************************************************************
   * Socket declarations
   * **************************************************************/
	useEffect(() => {
		if (!socket) {
			console.log('socket not ready!');
			return ;
		}

    socket.on('player-joined-room', (data) => {
      setRoomPlayers(prev => updateRoomPlayer(prev, data));
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

	useEffect(() => {
		if (!socket) {
			console.log('[SpaceContext] socket not available, skipping space tracking');
			return;
		}

		const prevIndex = previousActivePlaneRef.current;
		const nextIndex = activePlane;

		console.log('[SpaceContext] activePlane changed:', { prevIndex, nextIndex });

		if (prevIndex !== nextIndex) {
			if (prevIndex !== null) {
				const prevMesh = planeRefs.current.get(prevIndex);
				const prevSpaceId = prevMesh?.userData?.spaceId;
				console.log('[SpaceContext] leaving space:', { prevIndex, prevSpaceId, userData: prevMesh?.userData });
				if (prevSpaceId) {
					socket.emit('space-left', { spaceId: prevSpaceId });
				}
			}
			if (nextIndex !== null) {
				const nextMesh = planeRefs.current.get(nextIndex);
				const nextSpaceId = nextMesh?.userData?.spaceId;
				console.log('[SpaceContext] entering space:', { nextIndex, nextSpaceId, userData: nextMesh?.userData });
				if (nextSpaceId) {
					socket.emit('space-entered', { spaceId: nextSpaceId });
				}
			}
			previousActivePlaneRef.current = nextIndex;
		}
	}, [activePlane, socket]);

	useEffect(() => {
		return () => {
			if (socket && previousActivePlaneRef.current !== null) {
				const prevMesh = planeRefs.current.get(previousActivePlaneRef.current);
				const prevSpaceId = prevMesh?.userData?.spaceId;
				if (prevSpaceId) {
					socket.emit('space-left', { spaceId: prevSpaceId });
				}
			}
		};
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


  /* **************************************************************
   * Memo declarations
   * **************************************************************/
	const themeColor = conf.Color.themes.golden;

	// 4. Create meshes at calculated positions
	const planes = useMemo(() => {
		
		const result = [];
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
	}, [count, canvasWidth, canvasHeight, positionedPlanes]);

	const activeOverlay = useMemo(() => {
		if (activePlane === null) return null;
		const plane = positionedPlanes[activePlane];
		const hue = (activePlane / count) * conf.Color.endHue;
		const theme = themeColor[activePlane % themeColor.length];
		const color = theme.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
		const value = Number(color[3]) * 1.5;
		// console.log('hsl: ', color[0], ' ', color[1], ' ', color[2], ' ', color[3]);

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
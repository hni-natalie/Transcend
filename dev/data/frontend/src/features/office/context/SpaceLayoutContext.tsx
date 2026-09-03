/*
	Initializes SpaceLayout before user joins Space
	default should be Office Space
*/
import { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { officeService } from '@/features/office/services/office.service';
import { officeSceneConfig as conf } from '@/config/office.config';
import { useSocket } from '@/context';
import * as d3 from 'd3-hierarchy';

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
	const [officeSpace, setOfficeSpace] = useState([]);
	const [loading, setLoading] = useState(true);
	const [count, setCount] = useState(0);
	const { socket, isConnected } = useSocket();
	const positionDataRef = useRef([]);

	useEffect(() => {
		setLoading(true);
		const fetchData = async () => {
			const { departmentCount, officeSpaces } = await getOfficeDept();
			setOfficeSpace(officeSpaces);
			setCount(departmentCount);
		};
		fetchData();
	}, []);

 /* **************************************************************
	* Memo declarations
	* **************************************************************/
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
		// console.log("[SpaceLayoutContext] Layout ready: ", positionDataRef.current.length, ' ', loading);
		return data;
	},[treemapData, officeSpace, canvasWidth, canvasHeight, isConnected])

	const value = {
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
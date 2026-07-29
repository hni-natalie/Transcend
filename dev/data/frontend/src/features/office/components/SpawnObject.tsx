import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useOfficeSpace } from '@features/office/context/SpaceContext';
import { useSocket } from '@/context/SocketContext';
import { Player, addPosition } from '@shared';
import { Object } from '@features/office';
import { useLiveKit } from '@features/livekit';

export function SpawnObject({ roomName }) {
	const { roomObjs } = useSocket();

	return (
		<>
			{roomObjs.map(( object:Player ) => {
				return (
					<Object
						key={object.userId}
						ref={null} // null for remote players
						position={object.position} // need object.position to receive socketio remote pos updates
						id={object.id}
						userId={object.userId}
						name={object.name}
						color={object.color}
						photo={null}
					/>
				);
			})}
			</>
		)
}
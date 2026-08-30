import { useSocket } from '@/context/SocketContext';
import { Player } from '@shared';
import { Object } from '@features/office';

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
						photo='/objects/ball/ball.png'
						ownership={object.ownership}
						radius={1.5}
					/>
				);
			})}
			</>
		)
}
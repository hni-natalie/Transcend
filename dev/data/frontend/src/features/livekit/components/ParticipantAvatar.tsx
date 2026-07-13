import { useParticipantContext } from '@livekit/components-react';
import { useSocket } from '@/context/SocketContext';

/*
 have to use within <ParticipantTile> to get ParticipantContext
 <ParticipantTile>
	<ParticipantAvatar />
 </ParticipantTile>
*/
export function ParticipantAvatar() {
	const { roomPlayers } = useSocket();

  const participant = useParticipantContext();
  const identity = participant?.identity;

	const player = roomPlayers.find(p => p.name === identity);
	const avatarSrc = player?.photo || '/default-avatar.png';
	
	console.log('[ParticipantAvatar] identity: ', identity, ' ', avatarSrc);

	return (
		<div className="avatar-wrap max-h-80 max-w-80 w-full h-full aspect-square p-8">
			<img
				src={avatarSrc}
				className="rounded-full w-full h-full object-cover"
			/>
		</div>
	)
}
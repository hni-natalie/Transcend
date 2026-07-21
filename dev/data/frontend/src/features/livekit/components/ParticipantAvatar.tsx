import { useParticipantContext, ParticipantPlaceholder } from '@livekit/components-react';
import { useSocket } from '@/context/SocketContext';
import { useEffect, useState } from 'react';
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

	const player = roomPlayers.find(p => p.id === identity); // ###
	const avatarSrc = player?.photo || null;

	console.log('[ParticipantAvatar] identity: ', identity, ' ', avatarSrc);

	return (
		<div className="avatar-wrap max-h-80 max-w-80 w-full h-full aspect-square p-8">
			{!avatarSrc ? (
				<ParticipantPlaceholder/>
			) : (	
			<img
				src={avatarSrc}
				className="rounded-full w-full h-full object-cover"
			/>
			)}
		</div>
	)
}
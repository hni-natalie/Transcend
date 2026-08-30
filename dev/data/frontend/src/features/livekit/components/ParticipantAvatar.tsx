import { useParticipantContext, ParticipantPlaceholder, ParticipantName } from '@livekit/components-react';
import { useSocket } from '@/context/SocketContext';
import { useEffect, useState } from 'react';
import { DefaultAvatar } from '@/shared';
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

	// console.log('[ParticipantAvatar] identity: ', participant?.name, ' ', avatarSrc);
	return (
		<div className="avatar-wrap max-h-80 max-w-80 w-full h-full aspect-square p-[4%] justify-center items-center">
			{!avatarSrc ? (
				participant.name ? (
					<DefaultAvatar name={participant.name} className='w-full h-full'/>
				) : (
					<ParticipantPlaceholder/>
				)
			) : (	
				<img
					src={avatarSrc}
					className="rounded-full h-full object-cover p-5 aspect-square"
				/>
			)}
		</div>
	)
}
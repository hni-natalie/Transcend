import React, { RefObject, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useOfficeSpace } from '@features/office/context/SpaceContext';
import { useSocket } from '@/context/SocketContext';
import { Player, addPosition } from '@shared';
import { Character } from '@features/office';
import { useLiveKit } from '@features/livekit';

interface SpawnCharacterProps {
	roomName: string;
	listenerRef: RefObject<THREE.AudioListener>;
	lightTargetRef: RefObject<THREE.Object3D>;
}

// export function SpawnCharacter({ roomName, localPlayerRef }) {
export const SpawnCharacter = React.forwardRef<THREE.Object3D, SpawnCharacterProps>((
	{ roomName, listenerRef, lightTargetRef } : SpawnCharacterProps,
	ref) => {

	const { roomPlayers, localPlayerId } = useSocket();
	const { getPositionalAudio, isPlayerAudioReady } = useLiveKit(roomName);
	// const listenerRef = useRef<THREE.AudioListener | null>(null);

	return (
		<>
			{roomPlayers.map(( user:Player ) => {
				// console.log('[SpawnCharacter] ', addPosition(planePos, user.position));
				return (
					<Character
						key={user.userId}
						ref={user.id === localPlayerId ? ref : null} // null for remote players
						position={user.position} // need user.position to receive socketio remote pos updates
						id={user.id}
						userId={user.userId}
						name={user.name}
						color={user.color}
						photo={user.photo}
						isLocalPlayer={user.id === localPlayerId}
						isPlayerAudioReady={isPlayerAudioReady(user.id)}
						getPositionalAudio={getPositionalAudio}
						listenerRef={listenerRef}
						lightTargetRef={lightTargetRef}
					/>
				);
			})}
		</>
	)
})
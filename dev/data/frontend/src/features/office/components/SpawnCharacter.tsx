import React, { RefObject, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useOfficeSpace } from '@features/office/context/SpaceContext';
import { useSocket } from '@/context/SocketContext';
import { Player, addPosition } from '@shared';
import { Character } from '@features/office';
import { useLiveKit } from '@features/livekit';

function getPlanePosition( planeRefs:any, dpId:string ) {

  for (const [index, mesh] of planeRefs.current) {
    // console.log(`Plane ${index}:`, mesh.userData);
    // console.log('Access Level:', mesh.userData.accessLevel);
    // console.log('Department ID:', mesh.userData.dpId);
    
    // Check if accessLevel is 'department'
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

interface SpawnCharacterProps {
	roomName: string;
	listenerRef: RefObject<THREE.AudioListener>;
	lightTargetRef: RefObject<THREE.Object3D>;
}

// export function SpawnCharacter({ roomName, localPlayerRef }) {
export const SpawnCharacter = React.forwardRef<THREE.Object3D, SpawnCharacterProps>((
	{ roomName, listenerRef, lightTargetRef } : SpawnCharacterProps,
	ref) => {

	const { planeRefs } = useOfficeSpace();
	const { roomPlayers, localPlayerId } = useSocket();
	const { getPositionalAudio, isPlayerAudioReady } = useLiveKit(roomName);
	// const listenerRef = useRef<THREE.AudioListener | null>(null);

	return (
		<>
			{roomPlayers.map(( user:Player ) => {
				const planePos = getPlanePosition(planeRefs, user.dpId);
				// console.log('[SpawnCharacter] ', addPosition(planePos, user.position));
				return (
					<Character
						key={user.userId}
						ref={user.id === localPlayerId ? ref : null} // null for remote players
						position={addPosition(planePos, user.position) || user.position} // need user.position to receive socketio remote pos updates
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
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from '../context/useKeyboard';
import { useSocket } from '@/features/socketio/useSocket';
import { officeSceneConfig as conf } from '@/config/office.config';

/* controls scene camera to follow player */
export const CameraTracking = ({ localPlayerRef, controlsRef, isConnectedRoom, clickPoint }) => {
	const { enableSocket, socket, localPlayerId } = useSocket();
  const { isMoveKey } = useKeyboard();
  const [isInteracting, setIsInteracting] = useState(false)
  const isKeyPressed = useRef(false)
  
  // detect if MapControls is used
  useEffect(() => { enableSocket(); }, []);
  useEffect(() => {
    if (!controlsRef.current) return
    const controls = controlsRef.current
    
    const onStart = () => setIsInteracting(true)
    const onEnd = () => setIsInteracting(false)
    
    // Listen to MapControls events
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controlsRef.current])

  // Track key presses
  // useEffect(() => {
  //   const handleKeyDown = ( e:KeyboardEvent ) => {
  //     if (!isModifierKey(e.code)) {
  //       isKeyPressed.current = true
  //     }
  //   }
  //   const handleKeyUp = ( e:KeyboardEvent ) => {
  //     if (!isModifierKey(e.code)) {
  //       isKeyPressed.current = false
  //     }
  //   }
  //   window.addEventListener('keydown', handleKeyDown)
  //   window.addEventListener('keyup', handleKeyUp)
    
  //   return () => {
  //     window.removeEventListener('keydown', handleKeyDown)
  //     window.removeEventListener('keyup', handleKeyUp)
  //   }
  // }, [])

  // character movement
  useFrame(() => {
		if (isInteracting || !isConnectedRoom) return ;

    if (isMoveKey())
			clickPoint.current = null;

    if (localPlayerRef.current) {
      // 1. Handle move by mouseClick
      if (clickPoint.current) {
        localPlayerRef.current.position.lerp(clickPoint.current, conf.Movement.click_speed); // Move smoothly towards target 4% every frame
    		socket.emit('player-move', { id:localPlayerId, position:{ x:localPlayerRef.current.position.x, y:0, z:localPlayerRef.current.position.z }});

        // Update last position
        if (localPlayerRef.current.position.distanceTo(clickPoint.current) < 0.1) {
          localPlayerRef.current.position.copy(clickPoint.current);
      		socket.emit('player-move', { id:localPlayerId, position:{ x:localPlayerRef.current.position.x, y:0, z:localPlayerRef.current.position.z }});
          console.log('arrived at clickpoint')
          clickPoint.current = null;
        }
        // 2. Update camera to follow player DURING movement
        if (controlsRef.current) {
            // console.log('d: controls pos: ', controlsRef.current.target);
            // console.log('d: localPlayer pos: ', localPlayerRef.current.position);
            controlsRef.current.target.lerp(localPlayerRef.current.position, 0.1);
            controlsRef.current.update();
        }
      }
      // 3. Handle move by keypress
      else if (controlsRef.current && isMoveKey()) {
        // Update MapControls target to follow player
        controlsRef.current.target.set(
          localPlayerRef.current.position.x,
          controlsRef.current.target.y,
          localPlayerRef.current.position.z
        );
        controlsRef.current.update();
      }

    }
  });
  return null;
};

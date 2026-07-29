import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from '@/context/KeyboardContext';
import { useSocket } from '@/context/SocketContext';
import { officeSceneConfig as conf } from '@/config/office.config';

/* controls scene camera to follow player */
export const CameraTracking = ({ localPlayerRef, controlsRef, isConnectedRoom, clickPoint }) => {
	const { enableSocket, socket, localPlayerId } = useSocket();
  const { isMoveKey, isDragging } = useKeyboard();
  const [isInteracting, setIsInteracting] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  
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

  // character movement
  useFrame(() => {
		if (isInteracting || !isConnectedRoom) return ;

    if (isMoveKey())
			clickPoint.current = null;

    if (localPlayerRef.current) {
      if (isMoveKey() && isPanning) {
        setIsPanning(false);
      }
      // 1. Handle move by mouseClick
      if (clickPoint.current) {
        if (localPlayerRef.current.position)
    		  // console.log('[Camera] charac pos: ', localPlayerRef.current.position);
   
        setIsPanning(false);
        localPlayerRef.current.position.lerp(clickPoint.current, conf.Movement.click_speed); // Move smoothly towards target 4% every frame
    		socket.emit('player-move', { id:localPlayerId, position:{ x:localPlayerRef.current.position.x, y:0, z:localPlayerRef.current.position.z }});

        // 1.1 Update last position
        if (localPlayerRef.current.position.distanceTo(clickPoint.current) < 0.1) {
          localPlayerRef.current.position.copy(clickPoint.current);
      		socket.emit('player-move', { id:localPlayerId, position:{ x:localPlayerRef.current.position.x, y:0, z:localPlayerRef.current.position.z }});
          console.log('arrived at clickpoint ', clickPoint.current);

          clickPoint.current = null;
          setIsPanning(true);
        }
        // 1.2. Update camera to follow player DURING movement
        if (controlsRef.current && !isPanning) {
            // console.log('d: controls pos: ', controlsRef.current.target);
            // console.log('d: localPlayer pos: ', localPlayerRef.current.position);
            controlsRef.current.target.lerp(localPlayerRef.current.position, 0.1);
            controlsRef.current.update();
        }
      }
      // 2. Handle pan scene
      else if (controlsRef.current && isDragging.current) {
        setIsPanning(true);
        controlsRef.current.target.set(
          controlsRef.current.target.x,
          controlsRef.current.target.y,
          controlsRef.current.target.z,
        );
        controlsRef.current.update();
      }
      // 3. Handle fallback (initial spawn & keypress)
      else if (controlsRef.current) {
        if (isPanning) return ;
        // if (isDragging.current) return ;
        // Update MapControls(camera) target to follow player
        controlsRef.current.target.set(
          localPlayerRef.current.position.x,
          controlsRef.current.target.y,
          localPlayerRef.current.position.z,
        );
        controlsRef.current.update();
      }
    }
  });
  return null;
};

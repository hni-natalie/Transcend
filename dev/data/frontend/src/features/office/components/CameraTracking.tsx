import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

const isModifierKey = (keycode) => {
	return keycode.startsWith('Control') || 
				keycode.startsWith('Shift') || 
				keycode.startsWith('Alt') || 
				keycode.startsWith('Meta');
}

/* controls scene camera to follow player */
export const CameraTracking = ({ localPlayerRef, controlsRef }) => {
  const [isInteracting, setIsInteracting] = useState(false)
  const isKeyPressed = useRef(false)
  
  // detect if MapControls is used
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
  useEffect(() => {
    const handleKeyDown = ( e:KeyboardEvent ) => {
      if (!isModifierKey(e.code)) {
        isKeyPressed.current = true
      }
    }
    const handleKeyUp = ( e:KeyboardEvent ) => {
      if (!isModifierKey(e.code)) {
        isKeyPressed.current = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame(() => {
		if (isInteracting) return ;
    if (localPlayerRef.current && isKeyPressed.current && controlsRef.current) {
      // Update MapControls target to follow player
      controlsRef.current.target.set(
        localPlayerRef.current.position.x,
        controlsRef.current.target.y,
        localPlayerRef.current.position.z
      );
	    controlsRef.current.update();
    }
  });
  return null;
};

/*
  PositionContext for @react-three/cannon
  api subscription object position use
*/
import { createContext, useContext, useRef, useEffect } from 'react';
import { useSocket } from '@/context';
import { useLiveKit } from '@/features/livekit';

const PositionContext = createContext(null);
export const usePosition = () => {
  const context = useContext(PositionContext);
  if (!context)
    throw new Error('usePosition must be used within PositionProvider');
  return context;
};

interface ObjectLock {
  ownerId?: string;
  timestamp: number;
}

export const PositionProvider = ({ children, roomName }) => {
  const { socket, roomObjs, setRoomObjs, shouldConnect, localPlayerId } = useSocket();
  const { isConnectedRoom } = useLiveKit(roomName);
  
  const LOCKS_TIMEOUT = 10000;
  const lastKnownPositionsRef = useRef({});
  const subscriptionsRef = useRef({});
  const locksRef = useRef<Map<string, ObjectLock>>(new Map());
  const isMovingRef = useRef({});
  const hasChangedRef = useRef({});

  // functions
  const lockSystem = {
    acquireObj: ( objectId:string, ownerId:string ) : boolean => {
      const lock = locksRef.current.get(objectId);

      if (lock && !lockSystem.isLockExpired(objectId)) {
        console.log('[PositionContext] lock occupied! by ', ownerId);
        return false;
      }
      const timestamp = Date.now();
      socket.emit('object-acquire', { roomName, objectId, ownerId, timestamp });

      locksRef.current.set(objectId, { ownerId, timestamp:Date.now() });
      console.log('[PositionContext] 🟢 ******* lock acquired! *******');
      return true;
    },
    isOwnedBy: (objectId: string, userId: string): boolean => {
      const lock = locksRef.current.get(objectId);
      return lock ? lock.ownerId === userId : false;
    },
    isLockExpired: (objectId: string, maxAgeMs: number = 5000): boolean => {
      const lock = locksRef.current.get(objectId);
      if (!lock) return true;
      console.log('[PositionContext] lock elapsed: ', Date.now() - lock.timestamp)
      return Date.now() - lock.timestamp > maxAgeMs;
    },
  }

  const registerObject = ( userId:string, api ) => {
    if (subscriptionsRef.current[userId]) {
      return ; // do not overwrite
    }

    let lastEmit = 0;
    const THROTTLE_MS = 100;

    const unsubscribe = api.position.subscribe((p) => {
      const now = Date.now();
      if (now - lastEmit >= THROTTLE_MS) {
        const prevPos = lastKnownPositionsRef.current[userId];
        lastKnownPositionsRef.current[userId] = { x:p[0], y:p[1], z:p[2] };
        lastEmit = now;
        
        if (!prevPos) return ;

        // if (isMovingRef.current[userId])
  			//   console.log('current physics position:', userId, ' ', lastKnownPositionsRef.current[userId]);
  			// console.log('all list: ', lastKnownPositionsRef.current);
        if (!hasChangedRef.current[userId]) {
          const hasChanged = 
            Math.abs(prevPos.x - lastKnownPositionsRef.current[userId].x) > 0.05 ||
            Math.abs(prevPos.y - lastKnownPositionsRef.current[userId].y) > 0.05 ||
            Math.abs(prevPos.z - lastKnownPositionsRef.current[userId].z) > 0.05;

            hasChangedRef.current[userId] = hasChanged;
        }
        
        if (!hasChangedRef.current[userId]) return;
        socket.emit('object-move', { userId:userId, roomName:roomName, position:lastKnownPositionsRef.current[userId] });
        hasChangedRef.current[userId] = false;
      }
    })

    const unsubscribeVelocity = api.velocity.subscribe((v) => {

      const isMoving = Math.abs(v[0]) > 0.005 || 
                        Math.abs(v[1]) > 0.005 || 
                        Math.abs(v[2]) > 0.005;
      if (isMoving) {
        isMovingRef.current[userId] =  true;
      }
      else {
        if (!isMovingRef.current[userId]) return ;
        isMovingRef.current[userId] = false;
        // console.log('stopped! ', userId);
      }
    })

    subscriptionsRef.current[userId] = () => {
      unsubscribe();
      unsubscribeVelocity();
    }
  };

  const unregisterObject = (userId) => {
    if (subscriptionsRef.current[userId]) {
      subscriptionsRef.current[userId]();
      delete subscriptionsRef.current[userId];
    }
    delete lastKnownPositionsRef.current[userId];
    delete hasChangedRef.current[userId];
    delete isMovingRef.current[userId];
  };

  const getPosition = ( userId:string ) => {
    return lastKnownPositionsRef.current[userId];
  };

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // backend cleanup version
  useEffect(() => {
    if (!isConnectedRoom) return ;

    // Set up interval to check for stale locks
    timeoutRef.current = setInterval(() => {
      const now = Date.now();
      
      let hasStaleLocks = false;
      
      // Check each object for stale ownership
      console.log('[PositionContext] timeout ', roomObjs);

      for (const [objectId, lock] of Array.from(locksRef.current)) {
        if (now - lock.timestamp > LOCKS_TIMEOUT) {
          locksRef.current.delete(objectId);
        }
      }

      roomObjs.forEach(obj => {
        if (obj.ownership?.ownerId && obj.ownership?.timestamp) {
          const elapsed = now - obj.ownership.timestamp;
          console.log('[PositionContext] timeout elapsed ', elapsed);
          
          // If lock has expired
          if (elapsed > LOCKS_TIMEOUT) {
            hasStaleLocks = true;
            
            // Emit to backend to release object
            socket?.emit('object-release', {
              roomName,
              objectId: obj.userId,
            });
          }
        }
      });
      if (hasStaleLocks) {
        console.log('[PositionContext] Timeout cleaned up stale locks');
      }
    }, 5000);
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [isConnectedRoom, roomObjs]);


	const value = {
      lastKnownPositionsRef,
      hasChangedRef,
      registerObject,
      unregisterObject,
      getPosition,
      lockSystem,
	}
  return (
    <PositionContext.Provider value={value}>
      {children}
    </PositionContext.Provider>
  );
};
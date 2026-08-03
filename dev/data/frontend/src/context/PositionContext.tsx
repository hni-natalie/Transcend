/*
  PositionContext for @react-three/cannon
  api subscription object position use
*/
import { createContext, useContext, useRef } from 'react';
import { useSocket } from '@/context';

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
  const lastKnownPositionsRef = useRef({});
  const subscriptionsRef = useRef({});
  const objectApisRef = useRef({});
  const locksRef = useRef<Map<string, ObjectLock>>(new Map());
  const isMovingRef = useRef({});
  const hasChangedRef = useRef({});

  const { socket } = useSocket();

  const acquireLock = ( objectId:string ) : boolean => {
    const lock = locksRef.current.get(objectId);
    if (lock) {
      console.log('[PositionContext] lock occupied!');
      return false;
    }
    locksRef.current.set(objectId, { timestamp:Date.now() });
    return true;
  };

  const releaseLock = ( objectId:string ) => {
    const lock = locksRef.current.get(objectId);
    if (!lock) return;

    locksRef.current.delete(objectId);
    console.log(`🔓 Lock released: ${objectId}`);
  };

  const registerObject = ( userId:string, api ) => {
    if (subscriptionsRef.current[userId]) {
      // subscriptionsRef.current[userId]();
      return ; // do not overwrite
    }
    objectApisRef.current[userId] = api;

    let lastEmit = 0;
    let lastEmitVelocity = 0;
    const THROTTLE_MS = 100;

    const unsubscribe = api.position.subscribe((p) => {
      const now = Date.now();
      if (now - lastEmit >= THROTTLE_MS) {
        const prevPos = lastKnownPositionsRef.current[userId];
        lastKnownPositionsRef.current[userId] = { x:p[0], y:0, z:p[2] };
        lastEmit = now;
        
        if (!prevPos) return ;

  			// console.log('current physics position:', userId, ' ', lastKnownPositionsRef.current[userId]);
  			// console.log('all list: ', lastKnownPositionsRef.current);
        if (!hasChangedRef.current[userId]) {
          const hasChanged = 
            Math.abs(prevPos.x - lastKnownPositionsRef.current[userId].x) > 0.05 ||
            Math.abs(prevPos.y - lastKnownPositionsRef.current[userId].y) > 0.05 ||
            Math.abs(prevPos.z - lastKnownPositionsRef.current[userId].z) > 0.05;

            hasChangedRef.current[userId] = hasChanged;
            console.log('hasChanged ', hasChanged, ' ', hasChangedRef.current[userId]);
        }
        
        // if (hasChanged) {
        //   if (!acquireLock(userId)) return ;
    		// 	socket.emit('object-move', { userId:userId, roomName:roomName, position:lastKnownPositionsRef.current[userId] });
        //   console.log('[Object] drastic pos changes!');
        //   setTimeout(() =>{
        //     releaseLock(userId);
        //   }, 500);
        // }
        if (!hasChangedRef.current[userId]) return;
        if (isMovingRef.current[userId]) return;

        console.log('update pos! ',hasChangedRef.current[userId], ' ', userId, ' ', lastKnownPositionsRef.current[userId]);
        socket.emit('object-move', { userId:userId, roomName:roomName, position:lastKnownPositionsRef.current[userId] });
        hasChangedRef.current[userId] = false;
      }
    })

    const unsubscribeVelocity = api.velocity.subscribe((v) => {
      // const now = Date.now();
      // if (now - lastEmitVelocity < THROTTLE_MS) return ;

      const isMoving = Math.abs(v[0]) > 0.005 || 
                        Math.abs(v[1]) > 0.005 || 
                        Math.abs(v[2]) > 0.005;
      if (isMoving) {
        isMovingRef.current[userId] =  true;
        // console.log('is moving!! ', isMovingRef.current[userId], ' ', userId); 
      }
      else {
        if (!isMovingRef.current[userId]) return ;
        isMovingRef.current[userId] = false;
        console.log('stopped! ', userId);
      }
        // console.log(`Velocity: ${v}`);
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
    delete objectApisRef.current[userId];
    delete hasChangedRef.current[userId];
    delete isMovingRef.current[userId];
  };

  const getPosition = ( userId:string ) => {
    return lastKnownPositionsRef.current[userId];
  };

  const getObjectApi = ( userId:string ) => {
    return objectApisRef.current[userId];
  }

	const value = {
      lastKnownPositionsRef,
      hasChangedRef,
      registerObject,
      unregisterObject,
      getPosition,
      getObjectApi,
      acquireLock,
      releaseLock,
	}
  return (
    <PositionContext.Provider value={value}>
      {children}
    </PositionContext.Provider>
  );
};
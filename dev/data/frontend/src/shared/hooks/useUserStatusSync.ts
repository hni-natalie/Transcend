// hooks/useUserStatusSync.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth';
import { useSocket } from '@/context/SocketContext';
import { authService } from '@features/auth/auth.service';

const getUserStatus = async () => {
	const userData = await authService.getMe();
	return userData.userStatus || 'away'
}

export function useUserStatusSync() {
  const { user, updateUserStatus } = useAuth();
  const { enableSocket, isConnected, onlineStatus } = useSocket();
  const previousStatusRef = useRef<string | null>(user?.userStatus);

  // Enable socket on mount
	useEffect(() => { enableSocket(); }, []);
	

  // Sync user status when connected and user changes
  useEffect(() => {
    if (!isConnected || !user) return;

		if (!previousStatusRef.current)
				previousStatusRef.current = user.userStatus;

    const fetchStatus = async () => {
      try {
        const status = await getUserStatus();
        console.log('[UserStatusSync] current status: ', status, ' ', previousStatusRef.current, ' ', user.userStatus);
				if (status !== previousStatusRef.current) {
        	updateUserStatus(status);
					previousStatusRef.current = status;
				}
      } catch (error) {
        console.error('[UserStatusSync] Failed to fetch status:', error);
      }
    };
    fetchStatus();
  }, [isConnected, user?.userStatus]);

  // Return any useful values if needed
  return { user };
}
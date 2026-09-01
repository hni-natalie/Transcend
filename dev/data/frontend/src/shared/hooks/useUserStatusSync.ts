import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth';
import { useSocket } from '@/context/SocketContext';
import { authApi } from '@/features/auth/auth.api';

const getUserStatus = async () => {
	const userData = await authApi.getMe();
	return userData.userStatus || 'away'
}

export function useUserStatusSync() {
  const { user, updateUserStatus } = useAuth();
  const { enableSocket, isConnected } = useSocket();
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
		// get the user status from backend
        const status = await getUserStatus();
        // console.log('[UserStatusSync] current status: ', status, ' ', previousStatusRef.current, ' ', user.userStatus);
				// compare backend and local state
				if (status !== previousStatusRef.current) {
					// if different, then update local state
					// this func updates local and db again (slight redundancy?)
        			updateUserStatus(status);
					previousStatusRef.current = status;
				}
      } catch (error) {
        console.error('[UserStatusSync] Failed to fetch status:', error);
      }
    };
    fetchStatus();
  }, [isConnected, user?.userStatus]);

  return { user };
}
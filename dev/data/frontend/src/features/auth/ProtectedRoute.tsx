import { Navigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useAuth } from './AuthContext';
import { LoadingState } from '@/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (<LoadingState message="Loading..." size="full" className='flex-1' />);
  }

  if (!isAuthenticated) {
   return <Navigate to={R.LOGIN} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.roleName)) {
    return <Navigate to={R.USER_DASHBOARD} replace />;
  }

  return <>{children}</>;
};

export const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) 
    return (<LoadingState message="Loading..." size="full" className='flex-1' />);

  if (isAuthenticated) {
    if (user?.roleName === 'Admin') {
      return <Navigate to={R.ADMIN_DASHBOARD} replace />;
    }
    return <Navigate to={R.USER_DASHBOARD} replace />;
  }

  return <>{children}</>;
};
import { Navigate } from 'react-router-dom';
import { ROUTE_PATH as R } from '@config/routes.manifest';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
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
	return 
		<div>Loading...</div>;

  if (isAuthenticated) {
    if (user?.roleName === 'Admin') {
      return <Navigate to={R.ADMIN_DASHBOARD} replace />;
    }
    return <Navigate to={R.USER_DASHBOARD} replace />;
  }

  return <>{children}</>;
};
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { routes } from './config/routes.config';
import { AppLayout } from '@shared/layout/AppLayout';
import { SocketProvider } from '@/context/SocketContext';
import { SpaceLayoutProvider } from '@/features/office/context/SpaceLayoutContext';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute, GuestRoute } from '@/features/auth/ProtectedRoute';
import { ToastIncomingCall } from '@shared/ui/ToastIncomingCall';

function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    const currentRoute = routes.find(route => route.path === location.pathname);
    const title = currentRoute?.title || 'WorkFrom,';
    document.title = title;
  }, [location]);

  const guestRoutes = routes.filter(route => route.isGuestOnly);
  const publicRoutes = routes.filter(route => !route.requiresAuth && !route.isGuestOnly);
  const protectedRoutes = routes.filter(route => route.requiresAuth);

  return (
    <div className="w-full overflow-x-hidden">
      <Routes>
        {/* redirection */}
        <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />

        {/* Guest-only routes (login page) - redirects if logged in */}
        {guestRoutes.map(route => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={<GuestRoute>{route.element}</GuestRoute>} 
          />
        ))}
        
        {/* Public routes - no layout, anyone can see */}
        {publicRoutes.map(route => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        
        {/* Protected routes - require login + roles, with layout */}
        <Route element={<AppLayout />}>
          {protectedRoutes.map(route => {
            let element = route.element;
            
            if (route.allowedRoles && route.allowedRoles.length > 0) {
              element = (
                <ProtectedRoute allowedRoles={route.allowedRoles}>
                  {element}
                </ProtectedRoute>
              );
            } else {
              element = (
                <ProtectedRoute>
                  {element}
                </ProtectedRoute>
              );
            }
            
            return <Route key={route.path} path={route.path} element={element} />;
          })}
        </Route>
      </Routes>
    </div>
  );
}


export function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <SpaceLayoutProvider roomName='Office'>
            <ToastProvider>
              <AppRoutes />
              <ToastIncomingCall />
            </ToastProvider>
          </SpaceLayoutProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

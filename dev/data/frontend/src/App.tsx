import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { routes } from './config/routes.config';
import { AppLayout } from '@shared/layout/AppLayout';
import { SocketProvider } from './context/ContextSocket';

function AppRoutes() {
  const location = useLocation();

  // Use location to update file
  useEffect(() => {
    const currentRoute = routes.find(route => route.path === location.pathname);
    const title = currentRoute?.title || 'WorkFrom,';
    document.title = title;
  }, [location]);	// rerun when location changes

  // split routes into public and protected, only apply layout to protected
  const publicRoutes = routes.filter(route => 
    !route.path.startsWith('/admin') && !route.path.startsWith('/user')
  );
  const protectedRoutes = routes.filter(route => 
    route.path.startsWith('/admin') || route.path.startsWith('/user')
  );

  return (
    <div className="w-full min-h-screen flex flex-col bg-bg-primary text-content-primary overflow-x-hidden">
      <Routes>
        {/* Public routes - no layout */}
        {publicRoutes.map(route => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        
        {/* Protected routes - wrapped in AppLayout */}
        <Route element={<AppLayout />}>
          {protectedRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </Router>
  );
}

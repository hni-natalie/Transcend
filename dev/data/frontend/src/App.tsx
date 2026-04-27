import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { routes } from './config/routes.config';
import { SocketProvider } from './context/ContextSocket';

function AppRoutes() {
  const location = useLocation();

  // Use location to update file
  useEffect(() => {
    const currentRoute = routes.find(route => route.path === location.pathname);
    const title = currentRoute?.title || 'WorkFrom,';
    document.title = title;
  }, [location]);	// rerun when location changes

  return (
    <div className="w-full min-h-screen flex flex-col bg-black text-white overflow-x-hidden">
      <Routes>
        {routes.map(route => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
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

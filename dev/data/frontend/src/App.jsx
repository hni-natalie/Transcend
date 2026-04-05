import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { routes } from './config/routes.conf';
import SocketProvider from './context/ContextSocket';
import './App.css'

function AppRoutes() {
  const location = useLocation(); // change page title dynamically

  // Use location to update title
  useEffect(() => {
    const currentRoute = routes.find(route => route.path === location.pathname);
    const title = currentRoute?.title || 'WorkFrom,';
    document.title = title;
  }, [location]); // Re-run when location changes

  return (
    <div className="app-container">
      <Routes>
        {/* <Route path="/" element={<Landing onNavigate={() => navigate('/login')} />} /> */}
        {/* <Route path={ROUTE_PATH.LOGIN} element={<Login onBack={() => navigate('/')} />} /> */}
        {/* <Route path={ROUTE_PATH.DASHBOARD} element={<DashboardPage />} /> */}
        {
          routes.map(route => (
            <Route key={route.path} path={route.path} element={route.element}/>
          ))
        }
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </Router>
  );
}

export default App;

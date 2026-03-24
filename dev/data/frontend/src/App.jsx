import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css'
import Landing from './pages/landing/Landing'
import Login from './pages/login/Login'

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Landing onNavigate={() => navigate('/login')} />} />
        <Route path="/login" element={<Login onBack={() => navigate('/')} />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <div className="app">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route 
              path="/login" 
              element={
                !isLoggedIn 
                  ? <Login onLogin={handleLogin} />
                  : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/register" 
              element={
                !isLoggedIn 
                  ? <Register onRegister={handleLogin} />
                  : <Navigate to="/dashboard" />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isLoggedIn 
                  ? <Dashboard />
                  : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/" 
              element={
                isLoggedIn 
                  ? <Navigate to="/dashboard" />
                  : <Navigate to="/login" />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

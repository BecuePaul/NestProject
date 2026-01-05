import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import Chat from './components/Chat';
import socketService from './services/socket';

interface User {
  id: string;
  username: string;
  email: string;
  displayColor: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      socketService.connect(storedToken);
    }
  }, []);

  const handleLogin = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    socketService.connect(authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
  };

  return (
    <div className="App">
      {!user ? (
        <Auth onAuthSuccess={handleLogin} />
      ) : (
        <Chat user={user} onLogout={handleLogout} onUserUpdate={setUser} />
      )}
    </div>
  );
}

export default App;

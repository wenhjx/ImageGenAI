import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import History from './pages/History';
import APIKeys from './pages/APIKeys';
import Credits from './pages/Credits';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuthStore, useCreditsStore } from './store/useStore';
import { setAuthToken, getCredits } from './lib/api';
import { supabase } from './lib/supabase';

function App() {
  const { setUser, setToken } = useAuthStore();
  const { setBalance } = useCreditsStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: { user } } = await supabase.auth.getUser(session.access_token);
        
        if (user) {
          setUser({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || undefined,
            avatar_url: user.user_metadata?.avatar_url || undefined,
            created_at: user.created_at || '',
          });
          setToken(session.access_token);
          setAuthToken(session.access_token);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [setUser, setToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-900">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-indigo-900">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/generate" element={
                <ProtectedRoute>
                  <Generate />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }>
                <Route path="account" element={<Account />} />
                <Route path="history" element={<History />} />
                <Route path="api-keys" element={<APIKeys />} />
                <Route path="credits" element={<Credits />} />
              </Route>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

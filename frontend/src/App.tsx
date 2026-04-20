import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import LibraryPage from './pages/LibraryPage';
import SearchPage from './pages/SearchPage';
import BookDetailPage from './pages/BookDetailPage';
import './App.css';

function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <h1>Bookism</h1>
        <nav>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/search">Search</NavLink>
          {user && (
            <div className="user-info">
              {user.avatar_url && <img src={user.avatar_url} alt="" />}
              <button onClick={logout}>Log out</button>
            </div>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Routes>
    </>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

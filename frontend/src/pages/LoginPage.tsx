import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';
import logoUrl from '../assets/bookism-logo.png';


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    const scope = 'openid email profile';

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      access_type: 'online',
      prompt: 'select_account',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/auth/demo`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      login(data.token, data.user);
      navigate('/library', { replace: true });
    } catch {
      setDemoLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="logo-card">
        <img src={logoUrl}/>
      </div>
      <div className="login-card">
        <h1>Bookism</h1>
        <p>Your books. Your thoughts.</p>
        
        <div>
        <button className="google-btn" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
        <button
          className="demo-btn"
          onClick={handleDemoLogin}
          disabled={demoLoading}
        >
          {demoLoading ? 'Loading demo...' : 'Try Demo'}
        </button>
        </div>
      </div>
    </div>
  );
}

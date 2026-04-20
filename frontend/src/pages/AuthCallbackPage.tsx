import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get('code');
    if (!code) {
      setError('No authorization code returned from Google.');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        login(data.token, data.user);
        navigate('/library', { replace: true });
      })
      .catch((err) => {
        setError(`Sign-in failed: ${err.message}`);
      });
  }, [params, login, navigate]);

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button onClick={() => navigate('/')}>Back to login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
      Signing you in...
    </div>
  );
}

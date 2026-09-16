import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ورود ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-ink flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-8 h-8 text-primary-fg fill-primary-fg" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">ورود به پنل باشگاه</h1>
          <p className="text-sm text-muted">ورود به پنل مدیریت باشگاه</p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger font-medium">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">نام کاربری</label>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl pr-10 pl-3 py-3 text-sm text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
              <User className="w-4 h-4 text-muted absolute right-3.5 top-3.5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">کلمه عبور</label>
            <div className="relative">
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-xl pr-10 pl-3 py-3 text-sm text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
              <Lock className="w-4 h-4 text-muted absolute right-3.5 top-3.5" />
            </div>
          </div>
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            ورود
          </Button>
        </form>
      </div>
    </div>
  );
};

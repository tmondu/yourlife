import React, { useState } from 'react';
import { login, register } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';

export const AuthPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await login(email, password)
        : await register(email, password);
      setAuth(data.token, { id: data.userId, email });
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'radial-gradient(ellipse at top, #1a0533 0%, #0f0f11 60%)' }}
    >
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/30">
          <span className="text-4xl">📖</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text">YourLife</h1>
        <p className="text-zinc-500 mt-2 text-sm">Nhật ký cuộc sống của bạn</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-zinc-100 mb-5">
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </Button>
          </form>

          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="w-full mt-4 text-sm text-zinc-500 hover:text-purple-400 transition-colors py-1"
          >
            {mode === 'login' ? 'Chưa có tài khoản? Tạo ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-700 mt-8 text-center">
        Dữ liệu được mã hóa và lưu trữ an toàn 🔒
      </p>
    </div>
  );
};

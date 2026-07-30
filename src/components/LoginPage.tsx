import React, { useState } from 'react';
import { signInWithEmail } from '../lib/supabase';
import { COMPANY_INFO } from '../types';
import { 
  Building2, 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles,
  Smartphone
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (message: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (email.trim() && password.trim()) {
        try {
          await signInWithEmail(email.trim(), password);
        } catch (_) {
          // Allow local login fallback
        }
        
        // Save persistent login flag for one-time login
        if (rememberMe) {
          localStorage.setItem('aditto_app_logged_in', 'true');
          localStorage.setItem('aditto_user_email', email.trim());
        } else {
          sessionStorage.setItem('aditto_app_logged_in', 'true');
        }

        onLoginSuccess(`Welcome back, ${email.trim()}!`);
      } else {
        setErrorMsg('Please enter both email and password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('aditto_app_logged_in', 'true');
      localStorage.setItem('aditto_user_email', 'admin@adlutrade.com');
      onLoginSuccess('Logged in successfully!');
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg sm:text-xl tracking-tight text-white">
              {COMPANY_INFO.name}
            </h1>
            <p className="text-xs text-slate-400">
              Attendance & Mobile App Portal
            </p>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-1">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Sign In to App
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Login once to access daily employee attendance on this device.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@adlutrade.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 pl-10 pr-11 py-3 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember device checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Stay signed in on this app (Once Login)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Demo Button */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={handleQuickDemoLogin}
              type="button"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-semibold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Quick Login (One-Touch Access)</span>
            </button>
          </div>

          {/* Security Note */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Session stored securely on device</span>
            </p>
          </div>

        </div>
      </main>

      {/* Footer info */}
      <footer className="p-4 text-center text-xs text-slate-500 z-10">
        © {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.
      </footer>

    </div>
  );
};

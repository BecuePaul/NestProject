import React, { useState } from 'react';
import { authAPI } from '../services/api';

interface AuthProps {
  onAuthSuccess: (user: any, token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isLogin
        ? await authAPI.login(formData)
        : await authAPI.register(formData);

      onAuthSuccess(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-subtle"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-subtle" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-subtle" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 animate-fade-in">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg">
              <span className="text-3xl">💬</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Bon retour!' : 'Rejoignez-nous'}
            </h1>
            <p className="text-purple-200">
              {isLogin ? 'Connectez-vous pour continuer' : 'Créez votre compte gratuitement'}
            </p>
          </div>

          
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-full">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-full font-medium transition-all duration-300 ${
                isLogin
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-full font-medium transition-all duration-300 ${
                !isLogin
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>

          
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-sm animate-slide-up">
              <p className="text-red-200 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </p>
            </div>
          )}

          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-purple-200 text-sm font-medium ml-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="votre_pseudo"
                required
                minLength={3}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-slide-up">
                <label className="text-purple-200 text-sm font-medium ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-purple-200 text-sm font-medium ml-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? '🚀 Se connecter' : '✨ Créer mon compte'}
                </span>
              )}
            </button>
          </form>

          
          <p className="text-center text-purple-300/60 text-xs mt-6">
            En continuant, vous acceptez nos conditions d'utilisation
          </p>
        </div>

        
        <div className="mt-4 text-center">
          <p className="text-purple-300/40 text-sm">
            Propulsé par NestJS & React
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;

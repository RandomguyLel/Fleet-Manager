import React, { useState } from 'react';
import { useNavigate, useLocation, href } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, darkMode, setDarkMode } = useAuth();
  // API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // Check if we have a redirect URL from a previous unauthorized attempt
  const from = location.state?.from?.pathname || '/';
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError(t('auth.missingCredentials'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || t('auth.loginFailed'));
      }
      
      // Use the login function from context to store auth data
      login(data.user, data.token, data.expiresAt, rememberMe);
      
      // Redirect to the previous route or dashboard
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      let msg = error.message;
      if (msg === 'Invalid username or password' || msg === 'Invalid email or password') {
        msg = t('auth.invalidCredentials');
      }
      setError(msg || t('auth.loginFailedCheckCredentials'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <span className="text-6xl text-blue-600">🚚</span>
          </div>
          <div className="mt-6 flex items-center justify-center space-x-4">
            <h2 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Fleet Manager
            </h2>
            <div className="flex ml-2 border border-gray-300 rounded overflow-hidden">
              <button
                type="button"
                className={`px-4 py-1 text-sm font-semibold focus:outline-none transition-colors duration-150 ${
                  i18n.language === 'en'
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-blue-50'
                }`}
                onClick={() => i18n.changeLanguage('en')}
                aria-label="Switch to English"
                disabled={i18n.language === 'en'}
              >
                EN
              </button>
              <div className="w-px bg-gray-300" />
              <button
                type="button"
                className={`px-4 py-1 text-sm font-semibold focus:outline-none transition-colors duration-150 ${
                  i18n.language === 'lv'
                    ? 'bg-blue-600 text-white'
                    : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-blue-50'
                }`}
                onClick={() => i18n.changeLanguage('lv')}
                aria-label="Switch to Latvian"
                disabled={i18n.language === 'lv'}
              >
                LV
              </button>
            </div>
          </div>
          <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('auth.loginTitle')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="h-5 w-5 text-red-400" aria-hidden="true">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">{t('auth.email')}</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                } rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={t('auth.email')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('auth.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                } rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {t('auth.rememberMe')}
              </label>
            </div>

            <div className="flex border border-gray-300 rounded overflow-hidden">
              <button
                type="button"
                className={`px-2 py-0.5 text-lg font-semibold focus:outline-none transition-colors duration-150 ${
                  !darkMode
                    ? 'bg-yellow-400 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setDarkMode(false)}
                aria-label="Switch to light mode"
                disabled={!darkMode}
              >
                ☀️
              </button>
              <div className="w-px bg-gray-300" />
              <button
                type="button"
                className={`px-2 py-0.5 text-lg font-semibold focus:outline-none transition-colors duration-150 ${
                  darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setDarkMode(true)}
                aria-label="Switch to dark mode"
                disabled={darkMode}
              >
                🌙
              </button>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={() => { alert('Feature not implemented yet!'); }}
              >
                {t('auth.forgotPassword')}
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <span className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true">🔒</span>
                  </span>
                  {t('auth.loginButton')}
                </>
              )}
            </button>
          </div>
          
          <div className="text-center">
            <p className={`mt-2 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            ⚠️ In active development. Source code available ➡️ 
              
              <button 
                type="button"
                className="ml-1 font-medium text-blue-600 hover:text-blue-500"
                onClick={() => {window.location.href = 'https://github.com/RandomguyLel/Fleet-Manager'}}
                disabled={isLoading}
              >
                here
              </button>
                     
            </p>
          </div>
        </form>
        
        {/* Footer section */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className={`text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            &copy; {new Date().getFullYear()} Fleet Manager. Developed by RandomguyLel
          </p>
          <p className={`text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
            Version something alpha | Last updated: May 7th, 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
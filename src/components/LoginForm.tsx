import React, { useState } from 'react';
import { User } from '../types';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const USERS = [
  {
    email: 'menno@dehuisraad.com',
    password: 'ksoappv1.0',
    name: 'Menno van der Meulen'
  },
  {
    email: 'j.vanturenhout@keij-stefels.nl',
    password: 'ksoappv1.0',
    name: 'Juul van Turenhout'
  },
  {
    email: 's.keij@keij-stefels.nl',
    password: 'ksoappv1.0',
    name: 'Sarah Keij'
  },
  {
    email: 'daniel@dehuisraad.com',
    password: 'ksoappv1.0',
    name: 'Daniel Vermeulen'
  }
];

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Find user
    const user = USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      onLogin({
        name: user.name,
        email: user.email
      });
    } else {
      setError('Ongeldige inloggegevens');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-ks-light-green flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Company Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="https://huisraad.com/Huisraad-logo.svg" 
              alt="Huisraad Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if logo fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            <div className="w-16 h-16 bg-ks-green rounded-lg items-center justify-center hidden">
              <div className="w-8 h-8 bg-white rounded-sm transform rotate-45"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-ks-green font-georgia">Keij & Stefels</h1>
          <p className="text-gray-600 text-sm">Makelaardij & Taxaties</p>
          <p className="text-gray-500 text-xs mt-1">Offerte Chat</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ks-green focus:border-transparent"
              placeholder="naam@keij-stefels.nl"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ks-green focus:border-transparent"
              placeholder="Voer je wachtwoord in"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-ks-green text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Inloggen...' : 'Inloggen'}
          </button>
        </form>

        {/* Contact info for production */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Geen toegang? Neem contact op met je systeembeheerder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
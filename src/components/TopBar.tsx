import React from 'react';
import { RotateCcw, LogOut } from 'lucide-react';
import { User } from '../types';

interface TopBarProps {
  onNewOfferte: () => void;
  currentUser: User;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onNewOfferte, currentUser, onLogout }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Company Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img 
              src="https://huisraad.com/Huisraad-logo.svg" 
              alt="Huisraad Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-ks-green font-georgia">Keij & Stefels</span>
            <span className="text-sm text-gray-500">Makelaardij & Taxaties</span>
          </div>
        </div>
        <div className="text-gray-300">|</div>
        <h1 className="text-xl font-semibold text-gray-800">Offerte Chat</h1>
      </div>

      {/* User info and buttons */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{currentUser.name}</span>
        </div>
        
        <button
          onClick={onNewOfferte}
          className="flex items-center space-x-2 px-4 py-2 bg-ks-green text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nieuwe Offerte</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Uitloggen</span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
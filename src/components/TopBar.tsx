import React from 'react';
import { RotateCcw, LogOut, Menu, X } from 'lucide-react';
import { User } from '../types';

interface TopBarProps {
  onNewOfferte: () => void;
  currentUser: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ onNewOfferte, currentUser, onLogout, onToggleSidebar, isSidebarOpen }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Company Branding - Responsive */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
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
            <span className="text-lg md:text-xl font-bold text-ks-green font-georgia">K&S</span>
            <span className="text-xs md:text-sm text-gray-500 hidden sm:block">Makelaardij</span>
          </div>
        </div>
        <div className="text-gray-300 hidden md:block">|</div>
        <h1 className="text-lg md:text-xl font-semibold text-gray-800 hidden md:block">Offerte Chat</h1>
      </div>

      {/* User info and buttons - Mobile Responsive */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="text-xs md:text-sm text-gray-600 hidden sm:block">
          <span className="font-medium">{currentUser.name}</span>
        </div>
        
        <button
          onClick={onNewOfferte}
          className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 bg-ks-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Nieuwe Offerte</span>
          <span className="sm:hidden">Nieuw</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm md:text-base"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Uitloggen</span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
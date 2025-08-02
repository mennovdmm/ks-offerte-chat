import React from 'react';

const TopBar: React.FC = () => {
  return (
    <div className="safe-top bg-whatsapp-green text-white">
      <div className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-whatsapp-green font-bold text-sm">K&S</span>
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-base">K&S Offerte Chat</h1>
            <p className="text-green-100 text-xs">Maak je offerte in een paar minuten</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
import React, { useState } from 'react';
import { SavedSession } from '../types';
import { FileText, Edit2, Trash2, Calendar } from 'lucide-react';

interface SessionSidebarProps {
  sessions: SavedSession[];
  currentSessionId: string;
  currentSessionName: string;
  onLoadSession: (sessionId: string) => void;
  onUpdateSessionName: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  currentSessionId,
  currentSessionName,
  onLoadSession,
  onUpdateSessionName,
  onDeleteSession,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEditing = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditingName(currentName);
  };

  const saveEdit = () => {
    if (editingSessionId && editingName.trim()) {
      onUpdateSessionName(editingSessionId, editingName.trim());
    }
    setEditingSessionId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Vandaag';
    } else if (days === 1) {
      return 'Gisteren';
    } else if (days < 7) {
      return `${days} dagen geleden`;
    } else {
      return date.toLocaleDateString('nl-NL');
    }
  };

  return (
    <div className="w-80 md:w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg md:shadow-none">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-200">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 flex items-center">
          <FileText className="w-4 md:w-5 h-4 md:h-5 mr-2" />
          Offertes
        </h2>
      </div>
      
      {/* Current Session */}
      <div className="p-3 md:p-4 bg-ks-light-green border-b border-gray-200">
        <div className="text-xs md:text-sm text-gray-600 mb-1">Huidige offerte:</div>
        <div className="flex items-center justify-between">
          {editingSessionId === currentSessionId ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
              autoFocus
            />
          ) : (
            <>
              <span className="font-medium text-gray-800">{currentSessionName}</span>
              <button
                onClick={() => startEditing(currentSessionId, currentSessionName)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Hernoem offerte"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nog geen opgeslagen offertes</p>
          </div>
        ) : (
          <div className="p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group rounded-lg p-3 mb-2 cursor-pointer transition-colors ${
                  session.id === currentSessionId
                    ? 'bg-ks-green text-white'
                    : 'hover:bg-gray-50 border border-gray-200'
                }`}
                onClick={() => onLoadSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEdit}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded text-gray-800"
                        autoFocus
                      />
                    ) : (
                      <div className="font-medium truncate">{session.name}</div>
                    )}
                    
                    <div className="flex items-center text-xs mt-1 opacity-75">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(session.updatedAt)}
                    </div>
                    
                    <div className="text-xs mt-1 opacity-75">
                      {session.messages.length} bericht{session.messages.length !== 1 ? 'en' : ''}
                      {session.pdfUrl && ' • PDF beschikbaar'}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(session.id, session.name);
                      }}
                      className={`p-1 rounded hover:bg-gray-200 ${
                        session.id === currentSessionId ? 'text-white hover:bg-green-600' : 'text-gray-500'
                      }`}
                      title="Hernoem"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Weet je zeker dat je "${session.name}" wilt verwijderen?`)) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className={`p-1 rounded hover:bg-red-200 ${
                        session.id === currentSessionId ? 'text-white hover:bg-red-600' : 'text-red-500'
                      }`}
                      title="Verwijder"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSidebar;
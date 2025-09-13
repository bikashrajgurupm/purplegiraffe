// app/components/ChatHistory.js
import { useState, useEffect } from 'react';

export default function ChatHistory({ user, sessionId, onSelectChat, onDeleteChat }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('pg_token');
      const response = await fetch('/api/chat-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chats || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation(); // Prevent chat selection when deleting
    
    if (!confirm('Delete this chat?')) return;
    
    try {
      const token = localStorage.getItem('pg_token');
      const response = await fetch(`/api/chat-history/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        if (onDeleteChat) onDeleteChat(chatId);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `Today at ${hours}:${minutes.toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredChats = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupChatsByDate = (chats) => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    chats.forEach(chat => {
      const chatDate = new Date(chat.updated_at);
      if (chatDate >= today) {
        groups.today.push(chat);
      } else if (chatDate >= yesterday) {
        groups.yesterday.push(chat);
      } else if (chatDate >= weekAgo) {
        groups.thisWeek.push(chat);
      } else if (chatDate >= monthAgo) {
        groups.thisMonth.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  };

  const groupedChats = groupChatsByDate(filteredChats);

  if (!user) return null;

  return (
    <div className="chat-history">
      <div className="chat-history-header">
        <h3>Chat History</h3>
        <button 
          className="refresh-btn" 
          onClick={loadChatHistory}
          title="Refresh"
        >
          🔄
        </button>
      </div>

      <div className="chat-history-search">
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="chat-history-list">
        {loading ? (
          <div className="loading-state">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? 'No chats found' : 'No chat history yet'}
          </div>
        ) : (
          <>
            {groupedChats.today.length > 0 && (
              <div className="chat-group">
                <div className="chat-group-label">Today</div>
                {groupedChats.today.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat} 
                    isActive={chat.session_id === sessionId}
                    onClick={() => onSelectChat(chat)}
                    onDelete={handleDeleteChat}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {groupedChats.yesterday.length > 0 && (
              <div className="chat-group">
                <div className="chat-group-label">Yesterday</div>
                {groupedChats.yesterday.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat}
                    isActive={chat.session_id === sessionId}
                    onClick={() => onSelectChat(chat)}
                    onDelete={handleDeleteChat}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {groupedChats.thisWeek.length > 0 && (
              <div className="chat-group">
                <div className="chat-group-label">This Week</div>
                {groupedChats.thisWeek.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat}
                    isActive={chat.session_id === sessionId}
                    onClick={() => onSelectChat(chat)}
                    onDelete={handleDeleteChat}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {groupedChats.thisMonth.length > 0 && (
              <div className="chat-group">
                <div className="chat-group-label">This Month</div>
                {groupedChats.thisMonth.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat}
                    isActive={chat.session_id === sessionId}
                    onClick={() => onSelectChat(chat)}
                    onDelete={handleDeleteChat}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {groupedChats.older.length > 0 && (
              <div className="chat-group">
                <div className="chat-group-label">Older</div>
                {groupedChats.older.map(chat => (
                  <ChatItem 
                    key={chat.id} 
                    chat={chat}
                    isActive={chat.session_id === sessionId}
                    onClick={() => onSelectChat(chat)}
                    onDelete={handleDeleteChat}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChatItem({ chat, isActive, onClick, onDelete, formatDate }) {
  return (
    <div 
      className={`chat-history-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="chat-item-content">
        <div className="chat-item-title">{chat.title}</div>
        {chat.last_message && (
          <div className="chat-item-preview">{chat.last_message}</div>
        )}
        <div className="chat-item-meta">
          <span className="chat-item-date">{formatDate(chat.updated_at)}</span>
          <span className="chat-item-count">{chat.message_count} messages</span>
        </div>
      </div>
      <button 
        className="chat-item-delete"
        onClick={(e) => onDelete(chat.id, e)}
        title="Delete chat"
      >
        🗑️
      </button>
    </div>
  );
}
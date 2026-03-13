// src/components/ChatWindow.jsx
import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';

const ChatWindow = ({ currentUserIds, otherUserIds, height = '100%' }) => {
  const { messages, loading, newMessage, setNewMessage, handleSendMessage, myId } = useChat(currentUserIds, otherUserIds);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-window" style={{ height }}>
        <div className="messages-container">
            {loading && <p className="loading-text">Chargement de la conversation...</p>}
            {!loading && messages.length === 0 && (
                <div className="empty-chat-state">
                    <p>👋 Dites bonjour à votre coach !</p>
                </div>
            )}
            {messages.map(msg => {
                // Comparaison sécurisée avec String()
                const isMe = String(msg.sender_id) === myId;
                return (
                    <div key={msg.id} className={`message-bubble ${isMe ? 'me' : 'them'}`}>
                        <div className="message-content">{msg.content}</div>
                        <div className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="chat-input-area">
            <input 
                type="text" 
                placeholder="Écrivez votre message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" disabled={!newMessage.trim()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
        </form>
    </div>
  );
};

export default ChatWindow;
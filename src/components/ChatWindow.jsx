// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const ChatWindow = ({ currentUserIds, otherUserIds, height = '100%' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // --- CORRECTION ICI : On force la conversion en String ---
  // Cela évite des problèmes si l'ID du client est un nombre (ex: 4)
  const myId = String(currentUserIds);
  const theirId = String(otherUserIds);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${theirId}),and(sender_id.eq.${theirId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
        setMessages(data);
    }
    setLoading(false);
  }, [myId, theirId]);

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newData = payload.new;
        // Comparaison avec des Strings maintenant
        if (
            (String(newData.sender_id) === myId && String(newData.receiver_id) === theirId) ||
            (String(newData.sender_id) === theirId && String(newData.receiver_id) === myId)
        ) {
            setMessages(prev => [...prev, newData]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchMessages, myId, theirId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgToSend = newMessage.trim();
    setNewMessage('');

    // Insertion avec les IDs convertis en String
    const { error } = await supabase.from('messages').insert({
        sender_id: myId,
        receiver_id: theirId,
        content: msgToSend
    });

    if (error) {
        console.error("Erreur envoi message:", error);
        setNewMessage(msgToSend);
        // Afficher l'erreur à l'utilisateur peut aider à débugger
        alert(`Erreur lors de l'envoi : ${error.message || 'Erreur réseau'}`);
    }
  };

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
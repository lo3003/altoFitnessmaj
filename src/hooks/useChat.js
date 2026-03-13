import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export function useChat(currentUserIds, otherUserIds) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgToSend = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
        sender_id: myId,
        receiver_id: theirId,
        content: msgToSend
    });

    if (error) {
        console.error("Erreur envoi message:", error);
        setNewMessage(msgToSend);
        alert(`Erreur lors de l'envoi : ${error.message || 'Erreur réseau'}`);
    }
  };

  return { messages, loading, newMessage, setNewMessage, handleSendMessage, myId };
}

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = { role: 'user', content };
    const updatedHistory = [...messages, newMessage];
    setMessages(updatedHistory);
    setLoading(true);

    // Smart endpoint selection
    const isPortfolioQuery = /portfolio|holdings|positions|my stocks|what do I own|current positions/i.test(content);
    const endpoints = isPortfolioQuery 
      ? ['/api/chat/portfolio', '/api/chat/basic', '/api/chat']  // Try portfolio first
      : ['/api/chat/basic', '/api/chat/portfolio', '/api/chat']; // Try basic first

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: updatedHistory }),
        });

        if (!response.ok) {
          throw new Error(`${endpoint} failed with status ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.aiReply?.content || data.message || 'Sorry, I could not process your request.' 
        };
        setMessages([...updatedHistory, assistantMessage]);
        
        console.log(`✅ Success with ${endpoint}`);
        return; // Success, exit function
        
      } catch (error) {
        console.error(`❌ ${endpoint} failed:`, error);
        lastError = error as Error;
        continue; // Try next endpoint
      }
    }

    // All endpoints failed
    console.error('All chat endpoints failed:', lastError);
    const errorMessage: Message = {
      role: 'assistant',
      content: 'All chat services are temporarily unavailable. Please try again in a moment.',
    };
    setMessages([...updatedHistory, errorMessage]);
    setLoading(false);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
  };
}

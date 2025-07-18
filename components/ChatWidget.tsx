import { useState } from 'react';
import { useChat } from '../hooks/useChat';

export default function ChatWidget() {
  const { messages, loading, sendMessage } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Chat with Squeeze Alpha</h2>
      
      <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center">
            Start a conversation with your AI trading assistant...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 ml-8'
                    : 'bg-gray-100 mr-8'
                }`}
              >
                <div className="font-semibold text-sm mb-1">
                  {message.role === 'user' ? 'You' : 'Squeeze Alpha'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 mr-8 p-3 rounded-lg">
                <div className="font-semibold text-sm mb-1">Squeeze Alpha</div>
                <div className="text-gray-500">Thinking...</div>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about trading strategies, market analysis, or portfolio advice..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

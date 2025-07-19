import React from 'react';

const ChatRedirect: React.FC = () => {
  const gptUrl = 'https://chatgpt.com/g/g-68655f84391481918a47ecdf02589fdd-alphastack-squeeze-commander';
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        💬 AI Trading Assistant
      </h2>
      <p className="text-gray-600 mb-6">
        Chat with AlphaStack Squeeze Commander for real-time market analysis, 
        squeeze opportunities, and trading recommendations powered by live data.
      </p>
      <a 
        href={gptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        Open AlphaStack Squeeze Commander
      </a>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>🚀 Features:</strong> Real-time squeeze analysis • Live market data • 
          Pattern recognition • Multi-dimensional scoring • Trade recommendations
        </p>
      </div>
    </div>
  );
};

export default ChatRedirect;
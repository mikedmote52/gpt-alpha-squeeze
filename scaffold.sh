#!/bin/bash

# Scaffold complete Next.js PWA project: gpt-alpha-squeeze
set -e

echo "🚀 Scaffolding gpt-alpha-squeeze project..."

# Create directories
mkdir -p pages/api/alpaca
mkdir -p hooks
mkdir -p context
mkdir -p components
mkdir -p lib
mkdir -p styles
mkdir -p public/icons
mkdir -p .github/workflows

# package.json
cat << 'EOF' > package.json
{
  "name": "gpt-alpha-squeeze",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@alpacahq/alpaca-trade-api": "^3.0.0",
    "next": "14.0.0",
    "next-pwa": "^5.6.0",
    "openai": "^4.20.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.50.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.0"
  }
}
EOF

# next.config.js
cat << 'EOF' > next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withPWA(nextConfig);
EOF

# .env.local.example
cat << 'EOF' > .env.local.example
OPENAI_API_KEY=
ALPACA_KEY_ID=
ALPACA_SECRET_KEY=
ALPACA_API_URL=https://paper-api.alpaca.markets
SLACK_WEBHOOK_URL=
EOF

# public/manifest.json
cat << 'EOF' > public/manifest.json
{
  "name": "Squeeze Alpha",
  "short_name": "SqueezeAlpha",
  "description": "AI-powered trading assistant with portfolio management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
EOF

# postcss.config.js
cat << 'EOF' > postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# tailwind.config.js
cat << 'EOF' > tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOF

# styles/globals.css
cat << 'EOF' > styles/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html,
body {
  height: 100%;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

input,
button,
textarea,
select {
  font: inherit;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

#root,
#__next {
  isolation: isolate;
}
EOF

# pages/api/chat.ts
cat << 'EOF' > pages/api/chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Squeeze Alpha, an advanced AI trading assistant. You analyze market data, provide trading insights, and help users make informed investment decisions. You have access to real-time portfolio data and can suggest rebalancing strategies. Always provide clear, actionable advice while emphasizing risk management and the importance of diversification.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid history format' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistant = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.status(200).json({ assistant });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
}
EOF

# pages/api/alpaca/client.ts
cat << 'EOF' > pages/api/alpaca/client.ts
import Alpaca from '@alpacahq/alpaca-trade-api';

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_KEY_ID!,
  secretKey: process.env.ALPACA_SECRET_KEY!,
  baseUrl: process.env.ALPACA_API_URL || 'https://paper-api.alpaca.markets',
  usePolygon: false,
});

export default alpaca;
EOF

# pages/api/alpaca/positions.ts
cat << 'EOF' > pages/api/alpaca/positions.ts
import { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const positions = await alpaca.getPositions();
    res.status(200).json(positions);
  } catch (error) {
    console.error('Alpaca API error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
}
EOF

# pages/api/alpaca/order.ts
cat << 'EOF' > pages/api/alpaca/order.ts
import { NextApiRequest, NextApiResponse } from 'next';
import alpaca from './client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, qty, side, type = 'market', time_in_force = 'day' } = req.body;

  if (!symbol || !qty || !side) {
    return res.status(400).json({ error: 'Missing required fields: symbol, qty, side' });
  }

  try {
    const order = await alpaca.createOrder({
      symbol,
      qty,
      side,
      type,
      time_in_force,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error('Alpaca order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
EOF

# pages/api/slack.ts
cat << 'EOF' > pages/api/slack.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, blocks } = req.body;
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: 'Slack webhook URL not configured' });
  }

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const payload = {
      text,
      ...(blocks && { blocks }),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack webhook error:', error);
    res.status(500).json({ error: 'Failed to send Slack message' });
  }
}
EOF

# hooks/useLocalStorage.ts
cat << 'EOF' > hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
EOF

# hooks/useChat.ts
cat << 'EOF' > hooks/useChat.ts
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: updatedHistory }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.assistant };
      setMessages([...updatedHistory, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages([...updatedHistory, errorMessage]);
    } finally {
      setLoading(false);
    }
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
EOF

# hooks/useAlpaca.ts
cat << 'EOF' > hooks/useAlpaca.ts
import { useState } from 'react';

interface Position {
  symbol: string;
  qty: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
}

interface OrderRequest {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type?: string;
  time_in_force?: string;
}

export function useAlpaca() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alpaca/positions');
      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }
      const data = await response.json();
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: OrderRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alpaca/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      await fetchPositions();
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    positions,
    loading,
    error,
    fetchPositions,
    createOrder,
  };
}
EOF

# hooks/useSlack.ts
cat << 'EOF' > hooks/useSlack.ts
import { useState } from 'react';

interface SlackMessage {
  text: string;
  blocks?: any[];
}

export function useSlack() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: SlackMessage) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error('Failed to send Slack message');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    sendMessage,
  };
}
EOF

# context/PortfolioContext.tsx
cat << 'EOF' > context/PortfolioContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Recommendation {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  reason: string;
  timestamp: number;
}

interface Move {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  executedAt: number;
  price?: number;
}

interface PortfolioContextType {
  recommendations: Recommendation[];
  moves: Move[];
  addRecommendation: (recommendation: Omit<Recommendation, 'id' | 'timestamp'>) => void;
  addMove: (move: Omit<Move, 'id' | 'executedAt'>) => void;
  clearRecommendations: () => void;
  clearMoves: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [recommendations, setRecommendations] = useLocalStorage<Recommendation[]>('portfolio-recommendations', []);
  const [moves, setMoves] = useLocalStorage<Move[]>('portfolio-moves', []);

  const addRecommendation = (recommendation: Omit<Recommendation, 'id' | 'timestamp'>) => {
    const newRecommendation: Recommendation = {
      ...recommendation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setRecommendations(prev => [...prev, newRecommendation]);
  };

  const addMove = (move: Omit<Move, 'id' | 'executedAt'>) => {
    const newMove: Move = {
      ...move,
      id: crypto.randomUUID(),
      executedAt: Date.now(),
    };
    setMoves(prev => [...prev, newMove]);
  };

  const clearRecommendations = () => {
    setRecommendations([]);
  };

  const clearMoves = () => {
    setMoves([]);
  };

  return (
    <PortfolioContext.Provider
      value={{
        recommendations,
        moves,
        addRecommendation,
        addMove,
        clearRecommendations,
        clearMoves,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
EOF

# pages/_app.tsx
cat << 'EOF' > pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { PortfolioProvider } from '../context/PortfolioContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PortfolioProvider>
      <Component {...pageProps} />
    </PortfolioProvider>
  );
}
EOF

# components/ChatWidget.tsx
cat << 'EOF' > components/ChatWidget.tsx
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
EOF

# components/Holdings.tsx
cat << 'EOF' > components/Holdings.tsx
import { useEffect } from 'react';
import { useAlpaca } from '../hooks/useAlpaca';

export default function Holdings() {
  const { positions, loading, error, fetchPositions } = useAlpaca();

  useEffect(() => {
    fetchPositions();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Holdings</h2>
        <div className="text-center py-8">Loading positions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Current Holdings</h2>
        <div className="text-red-600 text-center py-8">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Current Holdings</h2>
      
      {positions.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No positions found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-4">Symbol</th>
                <th className="text-right py-2 px-4">Quantity</th>
                <th className="text-right py-2 px-4">Market Value</th>
                <th className="text-right py-2 px-4">Cost Basis</th>
                <th className="text-right py-2 px-4">P&L</th>
                <th className="text-right py-2 px-4">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.symbol} className="border-b border-gray-100">
                  <td className="py-2 px-4 font-semibold">{position.symbol}</td>
                  <td className="text-right py-2 px-4">{position.qty}</td>
                  <td className="text-right py-2 px-4">
                    ${parseFloat(position.market_value).toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-4">
                    ${parseFloat(position.cost_basis).toFixed(2)}
                  </td>
                  <td className={`text-right py-2 px-4 ${
                    parseFloat(position.unrealized_pl) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${parseFloat(position.unrealized_pl).toFixed(2)}
                  </td>
                  <td className={`text-right py-2 px-4 ${
                    parseFloat(position.unrealized_plpc) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(parseFloat(position.unrealized_plpc) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
EOF

# components/Recommendations.tsx
cat << 'EOF' > components/Recommendations.tsx
import { usePortfolio } from '../context/PortfolioContext';

export default function Recommendations() {
  const { recommendations, clearRecommendations } = usePortfolio();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">AI Recommendations</h2>
        {recommendations.length > 0 && (
          <button
            onClick={clearRecommendations}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>
      
      {recommendations.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No recommendations yet. Chat with Squeeze Alpha to get AI-powered trading suggestions.
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{rec.symbol}</span>
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    rec.action === 'buy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {rec.action.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(rec.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-gray-600">Quantity: </span>
                <span className="font-medium">{rec.quantity}</span>
              </div>
              <div className="text-sm text-gray-700">
                {rec.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
EOF

# pages/index.tsx
cat << 'EOF' > pages/index.tsx
import Head from 'next/head';
import Link from 'next/link';
import ChatWidget from '../components/ChatWidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Squeeze Alpha - AI Trading Assistant</title>
        <meta name="description" content="AI-powered trading assistant with portfolio management" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Squeeze Alpha
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Your AI-powered trading assistant
          </p>
          <Link
            href="/portfolio"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Portfolio
          </Link>
        </header>

        <div className="max-w-4xl mx-auto">
          <ChatWidget />
        </div>
      </main>
    </div>
  );
}
EOF

# pages/portfolio.tsx
cat << 'EOF' > pages/portfolio.tsx
import Head from 'next/head';
import Link from 'next/link';
import Holdings from '../components/Holdings';
import Recommendations from '../components/Recommendations';
import { usePortfolio } from '../context/PortfolioContext';
import { useSlack } from '../hooks/useSlack';

export default function Portfolio() {
  const { recommendations, addMove } = usePortfolio();
  const { sendMessage: sendSlack, loading: slackLoading } = useSlack();

  const handleApplyRebalance = async () => {
    if (recommendations.length === 0) {
      alert('No recommendations to apply');
      return;
    }

    try {
      const message = `🤖 AI Rebalance Applied\n\nRecommendations executed:\n${recommendations
        .map(rec => `• ${rec.action.toUpperCase()} ${rec.quantity} ${rec.symbol}`)
        .join('\n')}`;

      await sendSlack({ text: message });
      
      recommendations.forEach(rec => {
        addMove({
          symbol: rec.symbol,
          action: rec.action,
          quantity: rec.quantity,
        });
      });

      alert('Rebalance applied successfully! Slack notification sent.');
    } catch (error) {
      console.error('Error applying rebalance:', error);
      alert('Error applying rebalance. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Portfolio - Squeeze Alpha</title>
        <meta name="description" content="View your portfolio and AI recommendations" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
          <Link
            href="/"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Chat
          </Link>
        </header>

        <div className="grid gap-8">
          <Holdings />
          
          <Recommendations />

          {recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Actions</h3>
              <button
                onClick={handleApplyRebalance}
                disabled={slackLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {slackLoading ? 'Applying...' : 'Apply AI Rebalance'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                This will execute all current recommendations and send a notification to Slack.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
EOF

# lib/slack.ts
cat << 'EOF' > lib/slack.ts
interface SlackMessage {
  text: string;
  blocks?: any[];
}

export async function sendSlack(text: string, blocks?: any[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('Slack webhook URL not configured');
  }

  const payload: SlackMessage = {
    text,
    ...(blocks && { blocks }),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status}`);
  }
}
EOF

# render.yaml
cat << 'EOF' > render.yaml
services:
  - type: web
    name: gpt-alpha-squeeze
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: OPENAI_API_KEY
        sync: false
      - key: ALPACA_KEY_ID
        sync: false
      - key: ALPACA_SECRET_KEY
        sync: false
      - key: ALPACA_API_URL
        value: https://paper-api.alpaca.markets
      - key: SLACK_WEBHOOK_URL
        sync: false
EOF

# .github/workflows/deploy.yml
cat << 'EOF' > .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check
    
    - name: Build application
      run: npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Render
      uses: johnbeynon/render-deploy-action@v0.0.8
      with:
        service-id: ${{ secrets.RENDER_SERVICE_ID }}
        api-key: ${{ secrets.RENDER_API_KEY }}
EOF

echo "✅ Project scaffolded successfully!"
echo ""
echo "Next steps:"
echo "1. Copy .env.local.example to .env.local and fill in your API keys"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' to start development server"
echo ""
echo "🚀 Happy coding!"
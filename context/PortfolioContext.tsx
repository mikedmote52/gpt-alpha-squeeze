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

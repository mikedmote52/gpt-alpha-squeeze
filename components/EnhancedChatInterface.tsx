import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2
} from 'lucide-react';

interface TradeAction {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity?: number;
  price?: number;
  reasoning: string;
  confidence: number;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tradeActions?: TradeAction[];
  candidates?: any[];
  sessionId?: string;
}

interface EnhancedChatInterfaceProps {
  onTradeExecute: (action: TradeAction) => Promise<boolean>;
  portfolioData?: any;
}

export default function EnhancedChatInterface({ onTradeExecute, portfolioData }: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [executingTrade, setExecutingTrade] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate session ID
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Add welcome message
    setMessages([{
      id: '1',
      type: 'assistant',
      content: `Hello! I'm Squeeze Alpha, your AI trading assistant. I can analyze your portfolio, suggest trades, and help you execute them. 

Your current portfolio value: ${portfolioData?.totalValue ? `$${portfolioData.totalValue.toLocaleString()}` : 'Loading...'}

What would you like to analyze today?`,
      timestamp: new Date(),
      candidates: portfolioData?.candidates || []
    }]);
  }, [portfolioData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractTradeActions = (content: string, candidates: any[] = []): TradeAction[] => {
    const actions: TradeAction[] = [];
    
    // Parse AI recommendations for actionable trades
    const patterns = [
      { regex: /recommend.*?(buying|purchasing)\s+(\w+)/gi, action: 'BUY' as const },
      { regex: /suggest.*?(selling|disposing)\s+(\w+)/gi, action: 'SELL' as const },
      { regex: /hold.*?(\w+)/gi, action: 'HOLD' as const },
      { regex: /(\w+).*?(strong buy|buy signal)/gi, action: 'BUY' as const },
      { regex: /(\w+).*?(sell signal|take profit)/gi, action: 'SELL' as const },
    ];

    patterns.forEach(pattern => {
      const matches = content.matchAll(pattern.regex);
      for (const match of matches) {
        const symbol = pattern.action === 'BUY' ? match[2] : match[1];
        if (symbol && symbol.length >= 2 && symbol.length <= 5) {
          const candidate = candidates.find(c => c.symbol === symbol.toUpperCase());
          if (candidate) {
            actions.push({
              symbol: symbol.toUpperCase(),
              action: pattern.action,
              reasoning: match[0],
              confidence: candidate.enhanced_score || 50,
              price: candidate.price,
              quantity: pattern.action === 'BUY' ? Math.floor(1000 / (candidate.price || 100)) : undefined
            });
          }
        }
      }
    });

    return actions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      sessionId
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Smart endpoint selection with fallback
      const isPortfolioQuery = /portfolio|holdings|positions|my stocks|what do I own|current positions|analyze.*position/i.test(inputValue);
      const isScanQuery = /scan|screen|find|opportunities|search|discover|look for|what should I buy|recommend|suggestions/i.test(inputValue);
      
      const endpoints = isPortfolioQuery 
        ? ['/api/chat/portfolio', '/api/chat/basic', '/api/chat']  // Portfolio queries
        : ['/api/chat/basic', '/api/chat/portfolio', '/api/chat']; // General queries

      let response: Response | null = null;
      let lastError: Error | null = null;

      // Try endpoints in order
      for (const endpoint of endpoints) {
        try {
          console.log(`Enhanced chat trying: ${endpoint}`);
          
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-ID': sessionId
            },
            body: JSON.stringify({
              messages: [
                ...messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
                { role: 'user', content: inputValue }
              ]
            })
          });

          if (response.ok) {
            console.log(`✅ Enhanced chat success with: ${endpoint}`);
            break; // Success, use this response
          } else {
            throw new Error(`${endpoint} returned ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ ${endpoint} failed:`, error);
          lastError = error as Error;
          response = null;
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error(lastError?.message || 'All chat endpoints failed');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.message || data.aiReply?.content || 'No response received',
        timestamp: new Date(),
        candidates: data.candidates || [],
        sessionId: data.sessionId || sessionId
      };

      // Extract trade actions from AI response
      assistantMessage.tradeActions = extractTradeActions(assistantMessage.content, data.candidates);

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeAction = async (action: TradeAction) => {
    setExecutingTrade(`${action.action}-${action.symbol}`);
    
    try {
      const success = await onTradeExecute(action);
      
      const statusMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: success 
          ? `✅ ${action.action} order for ${action.symbol} executed successfully!`
          : `❌ Failed to execute ${action.action} order for ${action.symbol}. Please try again.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, statusMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `❌ Error executing ${action.action} order for ${action.symbol}: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setExecutingTrade(null);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Squeeze Alpha AI Assistant
          <Badge variant="secondary" className="ml-auto">
            {messages.length - 1} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-gray-50 text-gray-900'
              }`}>
                <div className="flex items-start gap-2">
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : message.type === 'system' ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    
                    {/* Trade Actions */}
                    {message.tradeActions && message.tradeActions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium">Recommended Actions:</div>
                        {message.tradeActions.map((action, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={
                                  action.action === 'BUY' ? 'bg-green-100 text-green-800' :
                                  action.action === 'SELL' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {action.action} {action.symbol}
                                </Badge>
                                {action.price && (
                                  <span className="text-xs text-gray-600">
                                    @ ${action.price.toFixed(2)}
                                  </span>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {action.confidence}% confidence
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleTradeAction(action)}
                                disabled={executingTrade === `${action.action}-${action.symbol}`}
                                className={
                                  action.action === 'BUY' ? 'bg-green-600 hover:bg-green-700' :
                                  action.action === 'SELL' ? 'bg-red-600 hover:bg-red-700' :
                                  'bg-blue-600 hover:bg-blue-700'
                                }
                              >
                                {executingTrade === `${action.action}-${action.symbol}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    {action.action === 'BUY' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                                     action.action === 'SELL' ? <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> :
                                     <Target className="h-3 w-3 mr-1" />}
                                    Execute
                                  </>
                                )}
                              </Button>
                            </div>
                            {action.reasoning && (
                              <div className="text-xs text-gray-600 mt-2">{action.reasoning}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Candidates Data */}
                    {message.candidates && message.candidates.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium">Market Analysis:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {message.candidates.slice(0, 4).map((candidate, index) => (
                            <div key={index} className="bg-white rounded p-2 text-xs">
                              <div className="font-medium">{candidate.symbol}</div>
                              <div className="text-gray-600">Score: {candidate.enhanced_score}/100</div>
                              <div className={`${candidate.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {candidate.changePercent >= 0 ? '+' : ''}{candidate.changePercent.toFixed(2)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-sm">Analyzing market data...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your portfolio, request analysis, or get trade recommendations..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
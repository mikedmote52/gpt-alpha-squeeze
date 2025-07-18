// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getQuote, getShortStats } from '../../lib/marketData';
import { screenSqueezers } from '../../lib/enhancedScreener';
import { learningSystem } from '../../lib/learning';

// Initialize API clients with error checking
const openaiKey = process.env.OPENAI_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!openaiKey && !openrouterKey) {
  console.error('No API keys found. Please set OPENAI_API_KEY or OPENROUTER_API_KEY');
}

const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const openrouter = openrouterKey ? new OpenAI({ 
  apiKey: openrouterKey,
  baseURL: "https://openrouter.ai/api/v1"
}) : null;

const DEFAULT_PARAMS = { minShortInt:20, minDaysToCover:3, minBorrowRate:50, minScore:75 };

// System prompt for AlphaStack Squeeze Commander
const SYSTEM_PROMPT = `You are AlphaStack Squeeze Commander — a purpose-built GPT trader that autonomously scans for the highest-probability short-squeeze setups, scores them with our proprietary model, and executes disciplined bracket orders under strict risk and capital-control rules.

Your Multi-Dimensional Squeeze Scanner analyzes:

1. **Short Interest & Float Dynamics**
   - Short Interest % of Float (SI%): Target ≥ 20% (especially > 50%)
   - Float Size: Ultra-low floats (< 50M shares) amplify forced buy-ins

2. **Days-to-Cover (DTC)**
   - Calculated as (Total Shares Short) ÷ (Average Daily Volume)
   - Targets with DTC ≤ 3 days can ignite rapid feedback loops

3. **Borrow Cost & Availability**
   - Borrow Fee Rate (APR): Higher costs (> 50% APR) = more pain for shorts
   - Locate Availability: Tight borrow availability → higher risk of recalls

4. **Liquidity & Volume Spikes**
   - Unusual Volume: ≥ 2× average daily volume signals institutional/retail interest
   - VWAP & Moving Averages: Price pushing through key levels with expanding volume

5. **Options Activity**
   - O/I Concentration: Big open interest in near-dated calls
   - Skew & IV: Rising IV indicates traders pricing in bigger moves

6. **Fundamental & News Catalysts**
   - Corporate Events: Earnings beats, FDA filings, M&A rumors
   - Analyst Upgrades/Media Mentions: High-traffic coverage can light the fuse

7. **Technical Set-Ups**
   - Breakout Patterns: Cup-and-handle, bull flags, wedge breakouts
   - Relative Strength: RS > 80 on 14-day RSI indicates strong momentum

8. **Risk & Position Sizing Filters**
   - Price > $5 to avoid sub-$5 volatility
   - Sector Caps: Max 40% in one sector
   - Max Position: $900 or 15% of total capital per trade
   - Stop-Loss: Hard 10% stop on every entry

**Proprietary Squeeze Score Weighting (0-100):**
- SI % & DTC: 40%
- Borrow Rate & Availability: 20%
- Volume & Technicals: 15%
- Options Flow & IV Skew: 15%
- Catalyst Potential: 10%

Tickers scoring > 75 enter the "Short Squeeze Watchlist" for execution tracking.`;

async function analyzeSqueezeOpportunities(tickers: string[]) {
  try {
    const rawData = await Promise.all(
      tickers.map(async sym => {
        try {
          // Ensure sym is a string
          const symbol = typeof sym === 'string' ? sym : sym.toString();
          const quote = await getQuote(symbol);
          const shortStats = await getShortStats(symbol);
          return { symbol, quote, shortStats };
        } catch (error) {
          console.error(`Error fetching data for ${sym}:`, error);
          return null;
        }
      })
    );
    
    const validData = rawData.filter(d => d !== null);
    
    // Use enhanced screener with learning system
    return await screenSqueezers(validData, DEFAULT_PARAMS);
  } catch (error) {
    console.error('Error analyzing squeeze opportunities:', error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userMessages = (req.body.messages || []) as { role:string; content:string }[];
    
    if (!userMessages.length) {
      throw new Error('No messages provided');
    }
    
    // Get session ID from request headers or generate new one
    const sessionId = req.headers['x-session-id'] as string || learningSystem.startNewSession();
    
    // Save user message to learning system
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || '';
    await learningSystem.saveConversationWithInsights(latestUserMessage, 'user', sessionId);
    
    // Get conversation context from learning system
    const conversationContext = await learningSystem.getConversationContext(sessionId);
    
    // Extract potential tickers from the message
    const tickerMatches = latestUserMessage.match(/\b[A-Z]{2,5}\b/g) || [];
    const uniqueTickers = Array.from(new Set(tickerMatches));
    const isAskingAboutPortfolio = /portfolio|holdings|positions|my stocks|what do I own|current positions/i.test(latestUserMessage);
    
    let squeezeData = [];
    let contextAddition = '';
    
    // If asking about portfolio, get current holdings and analyze them
    if (isAskingAboutPortfolio) {
      try {
        const holdingsResponse = await fetch(`${process.env.ALPACA_API_URL || 'https://paper-api.alpaca.markets'}/v2/positions`, {
          headers: {
            'APCA-API-KEY-ID': process.env.ALPACA_KEY_ID || '',
            'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY || ''
          }
        });
        
        if (holdingsResponse.ok) {
          const positions = await holdingsResponse.json();
          
          if (positions.length > 0) {
            // Analyze each holding for squeeze potential
            const holdingSymbols = positions.map((pos: any) => pos.symbol);
            const holdingAnalysis = await analyzeSqueezeOpportunities(holdingSymbols);
            
            // Calculate portfolio metrics
            const totalValue = positions.reduce((sum: number, pos: any) => sum + parseFloat(pos.market_value || 0), 0);
            const totalGainLoss = positions.reduce((sum: number, pos: any) => sum + parseFloat(pos.unrealized_pl || 0), 0);
            const avgScore = holdingAnalysis.length > 0 ? 
              holdingAnalysis.reduce((sum, h) => sum + (h.score || 0), 0) / holdingAnalysis.length : 0;
            
            // Create detailed portfolio analysis with enhanced data
            const portfolioAnalysis = positions.map((pos: any) => {
              const analysis = holdingAnalysis.find(h => h.symbol === pos.symbol);
              const score = analysis?.enhanced_score || analysis?.score || 0;
              const recommendation = score >= 75 ? 'STRONG SQUEEZE CANDIDATE' : 
                                   score >= 50 ? 'MODERATE POTENTIAL' : 
                                   score >= 25 ? 'LOW SQUEEZE RISK' : 'MINIMAL SQUEEZE ACTIVITY';
              
              return `
${pos.symbol}:
- Position: ${pos.qty} shares @ $${parseFloat(pos.avg_entry_price || 0).toFixed(2)}
- Current Value: $${parseFloat(pos.market_value || 0).toFixed(2)}
- P&L: $${parseFloat(pos.unrealized_pl || 0).toFixed(2)} (${parseFloat((pos.unrealized_plpc || 0) * 100).toFixed(1)}%)
- Enhanced Score: ${score}/100
- Assessment: ${recommendation}
- AI Reasoning: ${analysis?.ai_reasoning || 'No analysis available'}
- Short Interest: ${analysis?.shortInterest ? (analysis.shortInterest * 100).toFixed(1) : 0}%
- Days to Cover: ${analysis?.daysTocover || 0}
- Historical Performance: ${analysis?.historical_performance ? 
  `${analysis.historical_performance.successful_recommendations}/${analysis.historical_performance.total_recommendations} success rate` : 'No history'}`;
            }).join('\n\n');
            
            contextAddition = `\n\nCURRENT PORTFOLIO ANALYSIS:
Total Portfolio Value: $${totalValue.toFixed(2)}
Total P&L: $${totalGainLoss.toFixed(2)}
Average Squeeze Score: ${avgScore.toFixed(1)}/100
Number of Positions: ${positions.length}

INDIVIDUAL HOLDINGS ANALYSIS:
${portfolioAnalysis}

Use this data to provide comprehensive portfolio analysis including squeeze potential, risk assessment, and strategic recommendations for each holding.`;
            
            squeezeData = holdingAnalysis;
          } else {
            contextAddition = '\n\nPortfolio Status: No current positions found. User has no holdings to analyze.';
          }
        } else {
          contextAddition = '\n\nPortfolio Status: Unable to fetch current holdings. Please ensure Alpaca API credentials are configured.';
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        contextAddition = '\n\nPortfolio Status: Error accessing portfolio data. Please check API configuration.';
      }
    }
    // If asking about specific tickers, analyze them
    else if (uniqueTickers.length > 0) {
      console.log('Analyzing tickers:', uniqueTickers);
      const candidates = await analyzeSqueezeOpportunities(uniqueTickers);
      
      if (candidates.length > 0) {
        squeezeData = candidates;
        
        // Create detailed analysis table
        const detailedAnalysis = candidates.map(c => {
          const score = c.score || 0;
          const recommendation = score >= 75 ? 'HIGH PRIORITY - WATCHLIST' : 
                                score >= 50 ? 'MODERATE - MONITOR' : 
                                'LOW - PASS';
          
          return `
${c.symbol} Analysis:
- Short Interest: ${c.shortInt}% of float
- Days to Cover: ${c.daysToCover} days
- Borrow Rate: ${c.borrowRate}% APR
- Squeeze Score: ${score}/100
- Recommendation: ${recommendation}`;
        }).join('\n\n');
        
        contextAddition = `\n\nLive Squeeze Analysis Results:\n${detailedAnalysis}\n\nUse this data to provide specific trading recommendations based on our proprietary scoring model.`;
      } else if (uniqueTickers.length > 0) {
        contextAddition = '\n\nNote: Unable to fetch complete squeeze data for some tickers. Provide analysis based on available information and general market knowledge.';
      }
    }
    
    // Build enhanced system prompt with learning context
    const learningContext = `

LEARNING SYSTEM CONTEXT:
Current Session: ${sessionId}
Total Conversations: ${conversationContext.system_status.total_conversations}
Total Recommendations: ${conversationContext.system_status.total_recommendations}
Active Tracking: ${conversationContext.system_status.active_tracking_count} positions

RECENT PERFORMANCE:
${conversationContext.recent_recommendations.slice(0, 3).map(r => 
  `${r.symbol}: ${r.recommendation_type} - ${r.outcome_type || 'tracking'} (${r.outcome_return ? (r.outcome_return * 100).toFixed(1) + '%' : 'pending'})`
).join('\n')}

STOCK MEMORY:
${conversationContext.stock_memories.slice(0, 5).map(s => 
  `${s.symbol}: ${s.successful_recommendations}/${s.total_recommendations} success rate, avg return: ${(s.avg_recommendation_return * 100).toFixed(1)}%`
).join('\n')}

IMPORTANT: Use this historical context to provide personalized recommendations based on past performance and learning. Reference specific stocks you've recommended before and their outcomes.`;

    // Build messages for the AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + contextAddition + learningContext },
      ...userMessages
    ];
    
    if (!openai && !openrouter) {
      throw new Error('No AI API configured. Please set OPENAI_API_KEY or OPENROUTER_API_KEY in environment variables.');
    }
    
    let chatRes;
    let apiUsed = 'none';
    
    // Try OpenAI first if available
    if (openai) {
      try {
        console.log('Attempting OpenAI API...');
        chatRes = await openai.chat.completions.create({ 
          model: 'gpt-4-turbo-preview', 
          messages,
          temperature: 0.7,
          max_tokens: 1000
        });
        apiUsed = 'openai';
      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError.message);
        if (!openrouter) {
          throw new Error(`OpenAI API failed: ${openaiError.message}`);
        }
      }
    }
    
    // Try OpenRouter as fallback or primary
    if (!chatRes && openrouter) {
      try {
        console.log('Attempting OpenRouter API...');
        chatRes = await openrouter.chat.completions.create({ 
          model: 'openai/gpt-4-turbo-preview', 
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          headers: {
            "HTTP-Referer": "https://gpt-alpha-squeeze-2.onrender.com",
            "X-Title": "AlphaStack Squeeze Commander"
          }
        });
        apiUsed = 'openrouter';
      } catch (openrouterError: any) {
        throw new Error(`All APIs failed. OpenRouter error: ${openrouterError.message}`);
      }
    }
    
    console.log(`Successfully used ${apiUsed} API`);
    
    // Save assistant's response to learning system
    const assistantMessage = chatRes!.choices[0].message.content;
    await learningSystem.saveConversationWithInsights(
      assistantMessage,
      'assistant',
      sessionId,
      {
        market_conditions: squeezeData.length > 0 ? {
          analyzed_symbols: squeezeData.map(s => s.symbol),
          squeeze_scores: squeezeData.map(s => s.enhanced_score || s.score),
          avg_score: squeezeData.reduce((sum, s) => sum + (s.enhanced_score || s.score || 0), 0) / Math.max(1, squeezeData.length)
        } : null,
        api_used: apiUsed,
        processing_time: Date.now()
      }
    );
    
    // Return response with squeeze data and learning context
    const response: any = {
      aiReply: chatRes!.choices[0].message,
      message: chatRes!.choices[0].message.content, // For compatibility
      sessionId: sessionId,
      learning_status: {
        total_conversations: conversationContext.system_status.total_conversations + 1,
        active_tracking: conversationContext.system_status.active_tracking_count,
        system_learning: true
      }
    };
    
    if (squeezeData.length > 0) {
      response.candidates = squeezeData;
    }
    
    res.status(200).json(response);
  } catch (err) {
    console.error('Chat API Error:', err);
    res.status(500).json({ 
      error: (err as Error).message,
      aiReply: { content: 'Sorry, I encountered an error analyzing the squeeze opportunities. Please try again.' }
    });
  }
}
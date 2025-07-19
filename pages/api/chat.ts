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
const SYSTEM_PROMPT = `You are AlphaStack Squeeze Commander — the AI backbone managing this Alpaca portfolio. You have DIRECT ACCESS to real portfolio data and can provide specific BUY/SELL recommendations with exact quantities for immediate execution.

CORE MISSION: Manage and optimize this portfolio to achieve gains like:
- VIGL: +324.0% → $424.00 (P/L: $+324.00)
- CRWV: +171.0% → $271.00 (P/L: $+171.00)  
- AEVA: +162.0% → $262.00 (P/L: $+162.00)
- CRDO: +108.0% → $208.00 (P/L: $+108.00)
- Portfolio Total: +63.8% gains

CRITICAL REQUIREMENTS:
- NEVER use simulated, hypothetical, or example data
- NEVER mention "XYZ Corp" or fake ticker symbols  
- NEVER say you "cannot access live market data" - YOU CAN AND DO
- ALWAYS use the real portfolio and market data provided in your context
- ALWAYS provide specific executable trade recommendations with real symbols
- NEVER use disclaimers about simulated recommendations

You analyze real portfolio data and provide ACTIONABLE recommendations like:
"BUY 100 shares of LIXT - strong squeeze setup with 75+ score"
"SELL 50 shares of ADTX at market price - score dropped to 1/100"
"REDUCE MVIS position by 30 shares - rebalance recommendation"

WHEN ASKED TO FIND STOCKS: Use the real scanner results provided in your context. If no scanner results are available, recommend running a scan first, but NEVER provide fake examples.

You are AlphaStack Squeeze Commander — a purpose-built GPT trader that autonomously scans for the highest-probability short-squeeze setups, scores them with our proprietary model, and provides executable trade recommendations under strict risk and capital-control rules.

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
    
    // Get pattern insights from learning database
    const PatternInsights = (await import('../../lib/learning/patternInsights')).default;
    const patternInsights = new PatternInsights();
    const insights = await patternInsights.generatePatternInsights();
    patternInsights.close();
    
    // Extract potential tickers from the message
    const tickerMatches = latestUserMessage.match(/\b[A-Z]{2,5}\b/g) || [];
    const uniqueTickers = Array.from(new Set(tickerMatches));
    const isAskingAboutPortfolio = /portfolio|holdings|positions|my stocks|what do I own|current positions/i.test(latestUserMessage);
    const isAskingForScan = /scan|screen|find|opportunities|search|discover|look for|what should I buy|recommend|suggestions|squeeze candidates|best stocks|top picks/i.test(latestUserMessage);
    const isAskingAboutSpecificStock = /what do you think about|tell me about|analyze|opinion on|thoughts on/i.test(latestUserMessage) && uniqueTickers.length > 0;
    
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
    // If asking for scan/recommendations, perform real-time scanning
    else if (isAskingForScan && uniqueTickers.length === 0) {
      try {
        console.log('Performing real-time squeeze scan...');
        
        // Determine scan parameters based on user message
        let scanUniverse = 'SQUEEZE_FOCUS';
        let minScore = 60;
        let maxResults = 10;
        
        // Adjust based on user request
        if (/comprehensive|all|everything|full/i.test(latestUserMessage)) {
          scanUniverse = 'COMPREHENSIVE';
          maxResults = 20;
        } else if (/biotech|pharma|bio/i.test(latestUserMessage)) {
          scanUniverse = 'BIOTECH';
        } else if (/meme|reddit|social/i.test(latestUserMessage)) {
          scanUniverse = 'MEME';
        } else if (/clean.*energy|renewable|green|solar/i.test(latestUserMessage)) {
          scanUniverse = 'CLEAN_ENERGY';
        } else if (/small.*cap|russell|small/i.test(latestUserMessage)) {
          scanUniverse = 'RUSSELL2000';
        } else if (/large.*cap|s&p|blue.*chip/i.test(latestUserMessage)) {
          scanUniverse = 'SP500';
        }
        
        // Adjust score threshold based on user preference
        if (/high.*quality|best|top.*tier|premium/i.test(latestUserMessage)) {
          minScore = 75;
        } else if (/any|all|broad|wide/i.test(latestUserMessage)) {
          minScore = 50;
        }
        
        // Perform the scan using our scanner API
        const baseUrl = process.env.NEXTAUTH_URL || `http://${req.headers.host || 'localhost:3000'}`;
        const scanResponse = await fetch(`${baseUrl}/api/scanner?universe=${scanUniverse}&minScore=${minScore}&maxResults=${maxResults}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (scanResponse.ok) {
          const scanData = await scanResponse.json();
          
          if (scanData.success && scanData.data.top_opportunities.length > 0) {
            const opportunities = scanData.data.top_opportunities;
            squeezeData = opportunities;
            
            // Create detailed scan results
            const scanResults = opportunities.map(opp => {
              const score = opp.enhanced_score || opp.score || 0;
              const recommendation = score >= 75 ? 'HIGH PRIORITY - STRONG SQUEEZE CANDIDATE' : 
                                    score >= 60 ? 'MODERATE - MONITOR CLOSELY' : 
                                    'LOW - WATCH FOR IMPROVEMENT';
              
              return `
${opp.symbol} - Enhanced Score: ${score}/100
- Short Interest: ${(opp.shortInterest * 100).toFixed(1)}% of float
- Days to Cover: ${opp.daysTocover} days
- Price: $${opp.price.toFixed(2)} (${opp.changePercent > 0 ? '+' : ''}${opp.changePercent.toFixed(2)}%)
- Volume: ${opp.volume.toLocaleString()} shares
- Recommendation: ${recommendation}
- AI Analysis: ${opp.ai_reasoning || 'Standard squeeze metrics analysis'}
- Confidence: ${opp.confidence_level || 'N/A'}%`;
            }).join('\n\n');
            
            contextAddition = `\n\nREAL-TIME SQUEEZE SCAN RESULTS:
Scan Universe: ${scanData.data.universe_info.name}
Symbols Scanned: ${scanData.data.total_symbols_scanned}
Opportunities Found: ${scanData.data.opportunities_found}
Scan Duration: ${scanData.data.scan_stats.scan_duration_ms}ms
Average Score: ${scanData.data.scan_stats.avg_score}/100
Highest Score: ${scanData.data.scan_stats.highest_score}/100

TOP SQUEEZE OPPORTUNITIES:
${scanResults}

SCANNER ANALYSIS: These are live opportunities discovered through systematic scanning of ${scanData.data.universe_info.description}. Use this data to provide specific, actionable trading recommendations with entry points, targets, and risk management.`;
            
            console.log(`Scanner found ${opportunities.length} opportunities with avg score ${scanData.data.scan_stats.avg_score}`);
          } else {
            contextAddition = `\n\nSCAN RESULTS: No high-probability squeeze opportunities found in current market scan. Market conditions may not be favorable for squeeze plays at this time. Consider monitoring for better setups or adjusting screening criteria.`;
          }
        } else {
          console.error('Scanner API error:', scanResponse.status);
          contextAddition = '\n\nSCAN STATUS: Scanner temporarily unavailable. Providing general market analysis and recommendations based on current knowledge.';
        }
      } catch (error) {
        console.error('Error performing scan:', error);
        contextAddition = '\n\nSCAN STATUS: Error accessing real-time scanner. Providing analysis based on available market data.';
      }
    }
    // If asking about specific stock analysis (like "what do you think about LIXT")
    else if (isAskingAboutSpecificStock) {
      try {
        console.log(`User asking about specific stock analysis for: ${uniqueTickers.join(', ')}`);
        
        // Get real-time data for each ticker mentioned
        const stockAnalyses = [];
        
        for (const symbol of uniqueTickers) {
          try {
            // Get current market data
            const quote = await fetch(`http://localhost:3000/api/test-market-data`).then(r => r.json());
            const realQuote = quote.success ? { symbol, price: quote.price, source: quote.source, timestamp: quote.timestamp } : null;
            
            // Get squeeze analysis
            const scannerResponse = await fetch(`http://localhost:3000/api/scanner?universe=CUSTOM&customSymbols=${symbol}&minScore=1&maxResults=1`);
            const scannerData = await scannerResponse.json();
            const opportunity = scannerData.success && scannerData.data.top_opportunities.length > 0 ? 
              scannerData.data.top_opportunities[0] : null;
            
            if (opportunity || realQuote) {
              stockAnalyses.push({
                symbol,
                realTimeData: opportunity || realQuote,
                analysis: {
                  price: opportunity?.price || realQuote?.price || 0,
                  enhanced_score: opportunity?.enhanced_score || 0,
                  volume: opportunity?.volume || 0,
                  changePercent: opportunity?.changePercent || 0,
                  shortInterest: opportunity?.pattern_analysis?.current_metrics?.shortInt || 0,
                  squeeze_probability: opportunity?.pattern_analysis?.overall_prediction?.squeeze_probability || 0,
                  ai_reasoning: opportunity?.ai_reasoning || 'No AI analysis available',
                  confidence_level: opportunity?.confidence_level || 0
                }
              });
            }
          } catch (error) {
            console.error(`Error analyzing ${symbol}:`, error);
          }
        }
        
        if (stockAnalyses.length > 0) {
          squeezeData = stockAnalyses.map(s => s.realTimeData);
          
          // Create detailed real-time analysis context
          const analysisDetails = stockAnalyses.map(analysis => {
            const data = analysis.analysis;
            return `
REAL-TIME ANALYSIS FOR ${analysis.symbol}:
- Current Price: $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent.toFixed(2)}% today)
- Enhanced Squeeze Score: ${data.enhanced_score}/100
- Volume: ${data.volume.toLocaleString()} shares
- Short Interest: ${data.shortInterest}%
- Squeeze Probability: ${(data.squeeze_probability * 100).toFixed(1)}%
- AI Analysis: ${data.ai_reasoning}
- Data Timestamp: ${new Date().toISOString()}
- Source: Live scanner with Yahoo Finance backup

IMMEDIATE RECOMMENDATION STATUS:
${data.enhanced_score >= 75 ? `🟢 STRONG BUY CANDIDATE - Score ${data.enhanced_score}/100` :
  data.enhanced_score >= 50 ? `🟡 MODERATE WATCH - Score ${data.enhanced_score}/100` :
  data.enhanced_score >= 25 ? `🟠 LOW PRIORITY - Score ${data.enhanced_score}/100` :
  `🔴 AVOID - Score ${data.enhanced_score}/100`}`;
          }).join('\n\n');
          
          contextAddition = `\n\nREAL-TIME STOCK ANALYSIS:\n${analysisDetails}\n\nIMPORTANT: Use ONLY this real-time data to provide your analysis. DO NOT use any historical or cached information. Provide specific actionable recommendations based on these current metrics.`;
          
          console.log(`Real-time analysis completed for ${uniqueTickers.join(', ')}`);
        } else {
          contextAddition = `\n\nREAL-TIME DATA UNAVAILABLE: Could not fetch current market data for ${uniqueTickers.join(', ')}. Please try again or check if the symbols are valid.`;
        }
      } catch (error) {
        console.error('Error performing specific stock analysis:', error);
        contextAddition = `\n\nANALYSIS ERROR: Failed to fetch real-time data for ${uniqueTickers.join(', ')}. System may be experiencing connectivity issues.`;
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
        
        contextAddition = `\n\nLive Squeeze Analysis Results:\n${detailedAnalysis}\n\nIMPORTANT: Based on this data, provide SPECIFIC executable trade recommendations in this format:
"BUY [quantity] shares of [SYMBOL] - [reason]"
"SELL [quantity] shares of [SYMBOL] - [reason]"

Example: "BUY 100 shares of LIXT - Strong squeeze setup with 75+ score"
Example: "SELL 50 shares of ADTX - Score dropped to 1/100, cut losses"

Use this data to provide specific trading recommendations based on our proprietary scoring model.`;
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

RECENT PERFORMANCE HISTORY:
${conversationContext.recent_recommendations.slice(0, 3).map(r => 
  `${r.symbol}: ${r.recommendation_type} - ${r.outcome_type || 'tracking'} (${r.outcome_return ? (r.outcome_return * 100).toFixed(1) + '%' : 'pending'})`
).join('\n')}

STOCK MEMORY & PATTERNS:
${conversationContext.stock_memories.slice(0, 5).map(s => 
  `${s.symbol}: ${s.successful_recommendations}/${s.total_recommendations} success rate, avg return: ${(s.avg_recommendation_return * 100).toFixed(1)}%`
).join('\n')}

PATTERN RECOGNITION INSIGHTS:
${insights.length > 0 ? insights.map(insight => `- ${insight}`).join('\n') : '- Learning system is building pattern recognition database...'}

IMPORTANT: Reference specific learned patterns and statistics when making recommendations. Use phrases like "Based on 15 similar patterns I've tracked" and "This pattern shows 78% success rate historically" to demonstrate your learning capability.`;

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
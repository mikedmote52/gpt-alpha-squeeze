// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getQuote, getShortStats } from '../../lib/marketData';
import { screenSqueezers } from '../../lib/screener';

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
          const quote = await getQuote(sym);
          const shortStats = await getShortStats(sym);
          return { symbol: sym, quote, shortStats };
        } catch (error) {
          console.error(`Error fetching data for ${sym}:`, error);
          return null;
        }
      })
    );
    
    const validData = rawData.filter(d => d !== null);
    return screenSqueezers(validData, DEFAULT_PARAMS);
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
    
    // Get the latest user message
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || '';
    
    // Extract potential tickers from the message
    const tickerMatches = latestUserMessage.match(/\b[A-Z]{2,5}\b/g) || [];
    const uniqueTickers = Array.from(new Set(tickerMatches));
    
    // Always analyze tickers if present
    let squeezeData = [];
    let contextAddition = '';
    
    if (uniqueTickers.length > 0) {
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
    
    // Build messages for the AI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + contextAddition },
      ...userMessages
    ];
    
    if (!openai && !openrouter) {
      throw new Error('No AI API configured. Please set OPENAI_API_KEY or OPENROUTER_API_KEY in environment variables.');
    }
    
    let chatRes;
    let apiUsed = 'none';
    
    // Try OpenAI first if available (currently disabled due to connection issues)
    if (openai && false) {
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
    
    // Return response with squeeze data
    const response: any = {
      aiReply: chatRes!.choices[0].message,
      message: chatRes!.choices[0].message.content // For compatibility
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
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

const DEFAULT_PARAMS = { minShortInt:30, minDaysToCover:7, minBorrowRate:15, minScore:80 };

// System prompt for general trading assistant
const SYSTEM_PROMPT = `You are Squeeze Alpha, an advanced AI trading assistant specializing in stock market analysis, trading strategies, and investment advice. You have expertise in:

- Technical and fundamental analysis
- Short squeeze identification and analysis
- Risk management and portfolio optimization
- Market trends and sentiment analysis
- Options trading strategies
- Day trading and swing trading techniques

You can help with any trading-related questions, from beginner concepts to advanced strategies. When users mention specific stock tickers, you can analyze them for short squeeze potential if requested. Be helpful, informative, and provide actionable insights while always reminding users to do their own research and consider their risk tolerance.`;

async function analyzeSqueezeOpportunities(tickers: string[]) {
  try {
    const rawData = await Promise.all(
      tickers.map(async sym => {
        const quote = await getQuote(sym);
        const shortStats = await getShortStats(sym);
        return { symbol: sym, quote, shortStats };
      })
    );
    return screenSqueezers(rawData, DEFAULT_PARAMS);
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
    
    // Check if user is asking about specific tickers or squeeze analysis
    const tickerMatches = latestUserMessage.match(/\b[A-Z]{2,5}\b/g) || [];
    const uniqueTickers = Array.from(new Set(tickerMatches));
    const isAskingAboutSqueeze = /squeeze|short|shorted|borrow|days to cover/i.test(latestUserMessage);
    
    // Only analyze tickers if user is asking about squeeze potential
    let squeezeData = null;
    let contextAddition = '';
    
    if (uniqueTickers.length > 0 && isAskingAboutSqueeze) {
      const candidates = await analyzeSqueezeOpportunities(uniqueTickers);
      if (candidates.length > 0) {
        squeezeData = candidates;
        const tableText = candidates.map(c =>
          `${c.symbol} — SI ${c.shortInt}% • DTC ${c.daysToCover}d • Borrow ${c.borrowRate}% • Score ${c.score}`
        ).join('\n');
        contextAddition = `\n\nCurrent squeeze analysis for requested tickers:\n${tableText}`;
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
          messages 
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
          headers: {
            "HTTP-Referer": "https://gpt-alpha-squeeze-2.onrender.com",
            "X-Title": "Squeeze Alpha Trading System"
          }
        });
        apiUsed = 'openrouter';
      } catch (openrouterError: any) {
        throw new Error(`All APIs failed. OpenRouter error: ${openrouterError.message}`);
      }
    }
    
    console.log(`Successfully used ${apiUsed} API`);
    
    // Return response with optional squeeze data
    const response: any = {
      aiReply: chatRes!.choices[0].message,
      message: chatRes!.choices[0].message.content // For compatibility
    };
    
    if (squeezeData) {
      response.candidates = squeezeData;
    }
    
    res.status(200).json(response);
  } catch (err) {
    console.error('Chat API Error:', err);
    res.status(500).json({ 
      error: (err as Error).message,
      aiReply: { content: 'Sorry, I encountered an error. Please try again.' }
    });
  }
}
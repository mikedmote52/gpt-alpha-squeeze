import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Simple AI chat without external dependencies
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

const BASIC_SYSTEM_PROMPT = `You are AlphaStack Squeeze Commander — an AI assistant focused on stock market analysis and trading strategies. 

You provide helpful responses about:
- General market analysis concepts
- Trading strategy education
- Stock screening methodology
- Risk management principles

CRITICAL: You have no access to real-time data or portfolio information in this mode. Only provide educational content and general guidance. If asked about specific stocks, portfolio analysis, or real-time recommendations, direct users to use the portfolio chat mode for live data analysis.

Never provide specific stock recommendations, price targets, or trading advice without real-time data.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Only POST allowed' });
    }

    const userMessages = (req.body.messages || []) as { role: string; content: string }[];
    
    if (!userMessages.length) {
      throw new Error('No messages provided');
    }

    // Build simple messages for AI
    const messages = [
      { role: 'system', content: BASIC_SYSTEM_PROMPT },
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
        console.log('Using OpenAI API for basic chat...');
        chatRes = await openai.chat.completions.create({ 
          model: 'gpt-4-turbo-preview', 
          messages,
          temperature: 0.7,
          max_tokens: 800
        });
        apiUsed = 'openai';
      } catch (openaiError: any) {
        console.error('OpenAI API error:', openaiError.message);
        if (!openrouter) {
          throw new Error(`OpenAI API failed: ${openaiError.message}`);
        }
      }
    }
    
    // Try OpenRouter as fallback
    if (!chatRes && openrouter) {
      try {
        console.log('Using OpenRouter API for basic chat...');
        chatRes = await openrouter.chat.completions.create({ 
          model: 'openai/gpt-4-turbo-preview', 
          messages,
          temperature: 0.7,
          max_tokens: 800,
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
    
    console.log(`Basic chat completed using ${apiUsed} API`);
    
    res.status(200).json({
      aiReply: chatRes!.choices[0].message,
      message: chatRes!.choices[0].message.content,
      type: 'basic_chat',
      apiUsed
    });
    
  } catch (err) {
    console.error('Basic Chat API Error:', err);
    res.status(500).json({ 
      error: (err as Error).message,
      aiReply: { content: 'Sorry, I encountered an error. Please try again.' },
      type: 'error'
    });
  }
}
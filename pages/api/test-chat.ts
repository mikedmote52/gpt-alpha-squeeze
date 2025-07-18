import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const results: any = {};
  
  // Test OpenAI
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      results.openai = { error: 'OPENAI_API_KEY not found' };
    } else {
      const openai = new OpenAI({ apiKey: openaiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello"' }
        ],
        max_tokens: 10
      });
      results.openai = {
        success: true,
        message: completion.choices[0].message.content
      };
    }
  } catch (error: any) {
    results.openai = {
      error: error.message,
      details: error.response?.data || error.cause || 'No details'
    };
  }
  
  // Test OpenRouter
  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      results.openrouter = { error: 'OPENROUTER_API_KEY not found' };
    } else {
      const openrouter = new OpenAI({ 
        apiKey: openrouterKey,
        baseURL: "https://openrouter.ai/api/v1"
      });
      const completion = await openrouter.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello"' }
        ],
        max_tokens: 10
      });
      results.openrouter = {
        success: true,
        message: completion.choices[0].message.content
      };
    }
  } catch (error: any) {
    results.openrouter = {
      error: error.message,
      details: error.response?.data || error.cause || 'No details'
    };
  }
  
  res.status(200).json(results);
}
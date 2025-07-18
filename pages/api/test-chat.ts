import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test OpenAI connection
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not found' });
    }
    
    const openai = new OpenAI({ apiKey: openaiKey });
    
    // Simple test completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello from Squeeze Alpha!"' }
      ],
      max_tokens: 50
    });
    
    res.status(200).json({
      success: true,
      message: completion.choices[0].message.content,
      model: completion.model
    });
    
  } catch (error: any) {
    console.error('Test chat error:', error);
    res.status(500).json({
      error: error.message,
      type: error.type || 'unknown',
      code: error.code || 'unknown'
    });
  }
}
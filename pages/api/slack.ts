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

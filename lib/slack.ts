interface SlackMessage {
  text: string;
  blocks?: any[];
}

export async function sendSlack(text: string, blocks?: any[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('Slack webhook URL not configured');
  }

  const payload: SlackMessage = {
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
}

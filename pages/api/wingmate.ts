import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { appConfig } from '../../config/app';

const openai = new OpenAI({
  apiKey: appConfig.api.openai.apiKey,
});

const systemPrompt = `You are a friendly and helpful digital wingmate for a dating app called MatchBox. 
Your role is to help users with dating advice, profile optimization, and conversation starters. 
You should be supportive, encouraging, and provide practical suggestions while maintaining a casual, friendly tone.
Always keep your responses concise and focused on helping users improve their dating experience.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages must be an array' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const message = completion.choices[0]?.message?.content || 'No response generated';
    res.status(200).json({ message });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ message: 'Failed to generate response' });
  }
} 
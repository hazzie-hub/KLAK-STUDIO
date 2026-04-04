import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt gerekli' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        transformedPrompt: `${prompt}, cinematic lighting, ultra-detailed, 8k, dramatic composition, photorealistic`,
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `You are an expert AI image prompt engineer. Transform the user's raw idea into an optimized English image generation prompt.

Rules:
- Write only the prompt, no explanations
- Write in English
- Make it cinematic, detailed and atmospheric
- Keep it 40-70 words
- Include style, lighting, atmosphere, composition details
- Never include harmful or inappropriate content`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        transformedPrompt: `${prompt}, cinematic lighting, ultra-detailed, 8k, dramatic composition, photorealistic`,
      });
    }

    const data = await response.json();
    const transformedPrompt = data.choices?.[0]?.message?.content?.trim() ?? prompt;

    return NextResponse.json({ transformedPrompt });
  } catch (error) {
    console.error('Transform error:', error);
    return NextResponse.json({
      transformedPrompt: `${prompt}, cinematic lighting, ultra-detailed, 8k`,
    });
  }
}

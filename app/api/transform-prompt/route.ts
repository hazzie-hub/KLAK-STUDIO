import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_SYSTEM = `You are an expert AI image prompt engineer. Transform the user's raw idea into an optimized English image generation prompt.

Rules:
- Write only the prompt, no explanations
- Write in English
- Make it cinematic, detailed and atmospheric
- Keep it 40-70 words
- Include style, lighting, atmosphere, composition details
- Never include harmful or inappropriate content`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, imageBase64 } = body as {
      prompt?: unknown;
      systemPrompt?: unknown;
      imageBase64?: unknown;
    };

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt gerekli' }, { status: 400 });
    }

    const systemContent =
      typeof systemPrompt === 'string' && systemPrompt.trim().length > 0
        ? systemPrompt.trim()
        : DEFAULT_SYSTEM;

    const apiKey = process.env.OPENAI_API_KEY;
    const hasImage =
      typeof imageBase64 === 'string' &&
      imageBase64.startsWith('data:image');

    if (!apiKey) {
      const suffix =
        ', cinematic lighting, ultra-detailed, 8k, dramatic composition, photorealistic';
      return NextResponse.json({
        transformedPrompt: `${prompt}${suffix}`,
      });
    }

    const userText = hasImage
      ? `User input prompt:\n${prompt}\n\nUsing the attached reference image, produce a single optimized English image generation prompt that reflects the scene, mood, and composition. Output only the prompt text.`
      : prompt;

    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content:
        | string
        | Array<
            | { type: 'text'; text: string }
            | { type: 'image_url'; image_url: { url: string } }
          >;
    }> = [
      { role: 'system', content: systemContent },
      {
        role: 'user',
        content: hasImage
          ? [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: imageBase64 as string } },
            ]
          : userText,
      },
    ];

    const model = hasImage ? 'gpt-4o' : 'gpt-4o-mini';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: hasImage ? 400 : 200,
        messages,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        transformedPrompt: `${prompt}, cinematic lighting, ultra-detailed, 8k, dramatic composition, photorealistic`,
      });
    }

    const data = await response.json();
    const transformedPrompt =
      data.choices?.[0]?.message?.content?.trim() ?? prompt;

    return NextResponse.json({ transformedPrompt });
  } catch (error) {
    console.error('Transform error:', error);
    return NextResponse.json({
      transformedPrompt:
        'cinematic wide shot, atmospheric lighting, ultra-detailed, 8k, film grain',
    });
  }
}

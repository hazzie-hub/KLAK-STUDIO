import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio, n = 3 } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt gerekli' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API anahtarı eksik' }, { status: 500 });
    }

    // Aspect ratio → DALL-E 3 boyutu
    const sizeMap: Record<string, string> = {
      '1:1':  '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '4:3':  '1024x1024',
      '3:4':  '1024x1024',
    };
    const size = sizeMap[aspectRatio] ?? '1024x1024';

    // DALL-E 3 tek seferde 1 görsel üretiyor, 3 paralel istek atıyoruz
    const requests = Array.from({ length: 3 }, (_, i) =>
      fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `${prompt}. Variation ${i + 1}.`,
          n: 1,
          size,
          quality: 'standard',
          response_format: 'url',
        }),
      })
    );

    const responses = await Promise.allSettled(requests);

    const images: { url: string; revisedPrompt?: string }[] = [];

    for (const result of responses) {
      if (result.status === 'fulfilled') {
        const res = result.value;
        if (res.ok) {
          const data = await res.json();
          const item = data.data?.[0];
          if (item?.url) {
            images.push({
              url: item.url,
              revisedPrompt: item.revised_prompt,
            });
          }
        }
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: 'Görsel üretilemedi' }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

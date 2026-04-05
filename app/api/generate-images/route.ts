import { NextRequest, NextResponse } from 'next/server';

function mockImages(
  prompt: string,
  aspectRatio: string,
): { url: string; revisedPrompt?: string }[] {
  const sizeMap: Record<string, [number, number]> = {
    '1:1': [1024, 1024],
    '16:9': [1792, 1024],
    '9:16': [1024, 1792],
    '4:3': [1024, 1024],
    '3:4': [1024, 1024],
  };
  const [w, h] = sizeMap[aspectRatio] ?? [1024, 1024];
  const seed = Date.now();
  return [0, 1, 2].map((i) => ({
    url: `https://picsum.photos/seed/${seed + i}/${w}/${h}`,
    revisedPrompt: prompt,
  }));
}

export async function POST(req: NextRequest) {
  let prompt = '';
  let aspectRatio = '1:1';

  try {
    const body = await req.json();
    prompt = typeof body.prompt === 'string' ? body.prompt : '';
    aspectRatio = typeof body.aspectRatio === 'string' ? body.aspectRatio : '1:1';

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt gerekli' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        images: mockImages(prompt, aspectRatio),
        mock: true,
      });
    }

    const sizeMap: Record<string, string> = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '4:3': '1024x1024',
      '3:4': '1024x1024',
    };
    const size = sizeMap[aspectRatio] ?? '1024x1024';

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
      }),
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
      return NextResponse.json({
        images: mockImages(prompt, aspectRatio),
        mock: true,
      });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Generate error:', error);
    if (prompt.trim()) {
      return NextResponse.json({
        images: mockImages(prompt, aspectRatio),
        mock: true,
      });
    }
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

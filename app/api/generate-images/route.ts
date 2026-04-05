import { NextRequest, NextResponse } from 'next/server';
import { generateSingleFluxImage } from '@/lib/replicate/fluxProImage';

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

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({
        images: mockImages(prompt, aspectRatio),
        mock: true,
      });
    }

    const results = await Promise.allSettled([
      generateSingleFluxImage(token, `${prompt}. Variation 1.`, aspectRatio, 0),
      generateSingleFluxImage(token, `${prompt}. Variation 2.`, aspectRatio, 1),
      generateSingleFluxImage(token, `${prompt}. Variation 3.`, aspectRatio, 2),
    ]);

    const images: { url: string; revisedPrompt?: string }[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        images.push({ url: result.value, revisedPrompt: prompt });
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

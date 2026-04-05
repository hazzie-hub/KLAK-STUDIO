import { NextRequest, NextResponse } from 'next/server';

const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
const REPLICATE_API = 'https://api.replicate.com/v1';

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

function mapAspectRatio(aspectRatio: string): string {
  const allowed = new Set([
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    '3:4',
    '4:5',
    '5:4',
    '3:2',
    '2:3',
    'custom',
  ]);
  if (allowed.has(aspectRatio)) return aspectRatio;
  return '1:1';
}

function extractImageUrl(output: unknown): string | null {
  if (typeof output === 'string' && output.startsWith('http')) {
    return output;
  }
  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string' && first.startsWith('http')) return first;
  }
  return null;
}

type PredictionBody = {
  status?: string;
  output?: unknown;
  error?: string;
  urls?: { get?: string };
};

async function pollUntilTerminal(getUrl: string, token: string): Promise<PredictionBody> {
  const maxAttempts = 90;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as PredictionBody;
    if (
      data.status === 'succeeded' ||
      data.status === 'failed' ||
      data.status === 'canceled'
    ) {
      return data;
    }
  }
  return { status: 'failed', error: 'Zaman aşımı' };
}

async function runFluxOnce(
  token: string,
  prompt: string,
  aspectRatio: string,
  variation: number,
): Promise<string | null> {
  const ar = mapAspectRatio(aspectRatio);
  const seed = Math.floor(Date.now() / 1000) + variation * 9973;

  const createRes = await fetch(
    `${REPLICATE_API}/models/${FLUX_MODEL}/predictions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt: `${prompt}. Variation ${variation + 1}.`,
          aspect_ratio: ar,
          seed,
          output_format: 'webp',
        },
      }),
    },
  );

  const data = (await createRes.json()) as PredictionBody;

  if (!createRes.ok) {
    console.error('Replicate create failed:', createRes.status, data);
    return null;
  }

  if (data.status === 'succeeded' && data.output) {
    return extractImageUrl(data.output);
  }

  if (data.urls?.get) {
    const final = await pollUntilTerminal(data.urls.get, token);
    if (final.status === 'succeeded' && final.output) {
      return extractImageUrl(final.output);
    }
    console.error('Replicate prediction failed:', final.status, final.error);
  }

  return null;
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
      runFluxOnce(token, prompt, aspectRatio, 0),
      runFluxOnce(token, prompt, aspectRatio, 1),
      runFluxOnce(token, prompt, aspectRatio, 2),
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

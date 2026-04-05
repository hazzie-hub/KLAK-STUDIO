const FLUX_MODEL = 'black-forest-labs/flux-1.1-pro';
const REPLICATE_API = 'https://api.replicate.com/v1';

export function mapAspectRatio(aspectRatio: string): string {
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
  for (let i = 0; i < maxAttempts; i += 1) {
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

/** Tek bir Flux 1.1 Pro görseli (Replicate). */
export async function generateSingleFluxImage(
  token: string,
  prompt: string,
  aspectRatio: string,
  seedSalt: number,
): Promise<string | null> {
  const ar = mapAspectRatio(aspectRatio);
  const seed = Math.floor(Date.now() / 1000) + seedSalt * 9973;

  const createRes = await fetch(`${REPLICATE_API}/models/${FLUX_MODEL}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: ar,
        seed,
        output_format: 'webp',
      },
    }),
  });

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

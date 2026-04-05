import { NextRequest, NextResponse } from 'next/server';
import { generateSingleFluxImage } from '@/lib/replicate/fluxProImage';

export const maxDuration = 300;

const SCENE_COUNTS = new Set([3, 5, 8]);

type ScenePlan = {
  index: number;
  description: string;
  imagePrompt: string;
};

function mockStoryboard(
  brief: string,
  sceneCount: number,
): { scenes: (ScenePlan & { imageUrl: string })[]; mock: boolean } {
  const seed = Date.now();
  const scenes = Array.from({ length: sceneCount }, (_, i) => ({
    index: i + 1,
    description: `Sahne ${i + 1}: ${brief.slice(0, 80)}${brief.length > 80 ? '…' : ''}`,
    imagePrompt: `Cinematic storyboard frame ${i + 1}, ${brief.slice(0, 120)}, dramatic lighting, film grain, ultra detailed`,
    imageUrl: `https://picsum.photos/seed/${seed + i}/1280/720`,
  }));
  return { scenes, mock: true };
}

function parseScenesJson(raw: string, expected: number): ScenePlan[] | null {
  try {
    const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
    const o = JSON.parse(cleaned) as { scenes?: unknown };
    if (!Array.isArray(o.scenes)) return null;
    const out: ScenePlan[] = [];
    for (let i = 0; i < o.scenes.length; i += 1) {
      const s = o.scenes[i] as Record<string, unknown>;
      const description = typeof s.description === 'string' ? s.description.trim() : '';
      const imagePrompt = typeof s.imagePrompt === 'string' ? s.imagePrompt.trim() : '';
      const index = typeof s.index === 'number' ? s.index : i + 1;
      if (!description || !imagePrompt) return null;
      out.push({ index, description, imagePrompt });
    }
    if (out.length !== expected) return null;
    return out;
  } catch {
    return null;
  }
}

function fallbackScenesFromBrief(brief: string, sceneCount: number): ScenePlan[] {
  const sentences = brief
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  if (sentences.length >= sceneCount) {
    const per = Math.ceil(sentences.length / sceneCount);
    for (let i = 0; i < sceneCount; i += 1) {
      chunks.push(sentences.slice(i * per, (i + 1) * per).join('. '));
    }
  } else {
    const n = Math.max(1, Math.floor(brief.length / sceneCount));
    for (let i = 0; i < sceneCount; i += 1) {
      chunks.push(brief.slice(i * n, (i + 1) * n).trim() || brief);
    }
  }
  return chunks.map((c, i) => ({
    index: i + 1,
    description: c.slice(0, 400) || `Sahne ${i + 1}`,
    imagePrompt: `Cinematic film storyboard panel, scene ${i + 1}: ${c.slice(0, 300)}. Wide shot, moody lighting, photorealistic, 8k, anamorphic lens`,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const brief = typeof body.brief === 'string' ? body.brief.trim() : '';
    const sceneCount = Number(body.sceneCount);

    if (!brief || brief.length < 10) {
      return NextResponse.json(
        { error: 'Senaryo en az birkaç cümle olmalı.' },
        { status: 400 },
      );
    }

    if (!SCENE_COUNTS.has(sceneCount)) {
      return NextResponse.json({ error: 'Geçersiz sahne sayısı' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    let plans: ScenePlan[];

    if (apiKey) {
      const sys = `Sen profesyonel bir storyboard sanat yönetmenisin. Kullanıcının senaryo/brief metnini tam ${sceneCount} sahneye böl.

Yanıtın YALNIZCA bu JSON şemasında olsun (ek metin yok):
{"scenes":[{"index":1,"description":"Sahneyi Türkçe, 2-4 cümle; oyuncu/aksiyon/atmosfer","imagePrompt":"İngilizce, sinematik görsel prompt; 40-90 kelime; kamera açısı, ışık, ortam, duygu; FLUX için net"}]}

Kurallar:
- scenes dizisi tam ${sceneCount} elemanlı olmalı, index 1..${sceneCount}.
- description: prodüksiyon ekibine sahne özeti (Türkçe).
- imagePrompt: tek karelik film karesi; İngilizce; stil tutarlı; şiddet/içerik politikasına uygun.
- Hikâyeyi kronolojik böl.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 2500,
          temperature: 0.65,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: sys },
            {
              role: 'user',
              content: `Senaryo / brief:\n\n${brief.slice(0, 12000)}`,
            },
          ],
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim() ?? '';
      const parsed = parseScenesJson(content, sceneCount);
      plans = parsed ?? fallbackScenesFromBrief(brief, sceneCount);
    } else {
      plans = fallbackScenesFromBrief(brief, sceneCount);
    }

    plans.sort((a, b) => a.index - b.index);

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      const { scenes } = mockStoryboard(brief, sceneCount);
      return NextResponse.json({
        scenes: scenes.map((s) => ({
          index: s.index,
          description: s.description,
          imagePrompt: s.imagePrompt,
          imageUrl: s.imageUrl,
        })),
        mock: true,
      });
    }

    const aspectRatio = '16:9';
    const settled = await Promise.allSettled(
      plans.map((p, i) =>
        generateSingleFluxImage(token, p.imagePrompt, aspectRatio, i + sceneCount * 100),
      ),
    );

    const scenesOut: (ScenePlan & { imageUrl: string | null })[] = plans.map((p, i) => {
      const r = settled[i];
      const url =
        r.status === 'fulfilled' && r.value ? r.value : null;
      return { ...p, imageUrl: url };
    });

    const anyFailed = scenesOut.some((s) => !s.imageUrl);
    if (anyFailed) {
      const seed = Date.now();
      return NextResponse.json({
        scenes: scenesOut.map((s, i) => ({
          ...s,
          imageUrl:
            s.imageUrl ??
            `https://picsum.photos/seed/${seed + s.index}/${1280 + i}/720`,
        })),
        mock: true,
        note: 'Bazı görseller yedek olarak üretildi.',
      });
    }

    return NextResponse.json({ scenes: scenesOut, mock: false });
  } catch (e) {
    console.error('storyboard:', e);
    return NextResponse.json({ error: 'Storyboard oluşturulamadı' }, { status: 500 });
  }
}

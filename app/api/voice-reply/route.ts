import { NextRequest, NextResponse } from 'next/server';

const SYSTEM = `Kullanıcı Türkçe konuştu; sen kısa, sıcak bir sesli asistan gibi Türkçe yanıt ver.
Kurallar:
- En fazla 2 kısa cümle.
- Görsel oluşturacağını veya fikri aldığını kısaca belirt.
- Sadece düz metin; tırnak, liste, emoji kullanma.
- Başka dil kullanma.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userText = typeof body.userText === 'string' ? body.userText.trim() : '';

    if (!userText) {
      return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: 'Tamam, hemen görselini oluşturuyorum.',
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
        max_tokens: 120,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userText.slice(0, 2000) },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        reply: 'Anladım, şimdi görselini hazırlıyorum.',
      });
    }

    const data = await response.json();
    let reply = data.choices?.[0]?.message?.content?.trim() ?? '';
    reply = reply.replace(/^["']|["']$/g, '').replace(/\n+/g, ' ').slice(0, 400);
    if (!reply) {
      reply = 'Harika, hemen oluşturuyorum.';
    }

    return NextResponse.json({ reply });
  } catch (e) {
    console.error('voice-reply:', e);
    return NextResponse.json({
      reply: 'Tamam, görsel üretimine geçiyorum.',
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';

type ChatTurn = { role: 'user' | 'assistant'; content: string };

const SYSTEM = `Sen Türkçe konuşan bir görsel fikir asistanısın. Kullanıcıyla sohbet ederek ne çizmek istediğini netleştiriyorsun; görseli ANCAK kullanıcı açıkça üretmeni istediğinde oluşturacaksın.

Her seferinde SADECE şu alanlara sahip tek bir JSON nesnesi döndür (ek açıklama, markdown yok):
{"reply":"Kullanıcıya seslendirilecek kısa Türkçe metin, en fazla 2 cümle","shouldGenerate":false,"imageBrief":""}

shouldGenerate kuralları:
- true YALNIZCA kullanıcı net bir üretim komutu verdiğinde: örn. "üret", "oluştur", "şimdi çiz", "görseli yap", "görsel üret", "haydi üret", "tamam üret", "bunu çiz", "hadi oluştur", "şimdi yap", "çiz bunu", "üret artık", "oluştur hadi".
- Fikir anlatma, renk/stil tartışması, soru-cevap, "nasıl yapsak" gibi durumlarda false; önce sohbet et.
- shouldGenerate true ise imageBrief: tüm konuşmadaki görsel isteğini tek paragrafta özetle (İngilizce veya Türkçe, görüntü üreticisi için net). Geçmişteki tüm detayları birleştir.
- shouldGenerate false iken imageBrief her zaman boş string "".

reply her zaman doğal Türkçe olsun. Üretime geçerken kısa onay verebilirsin (örn. "Tamam, hemen oluşturuyorum.").`;

function lastUserText(messages: ChatTurn[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') return messages[i].content.trim();
  }
  return '';
}

function heuristicReply(messages: ChatTurn[]): {
  reply: string;
  shouldGenerate: boolean;
  imageBrief: string;
} {
  const last = lastUserText(messages);
  const wants =
    /(?:^|\s)(üret|oluştur|görsel(?:i)?\s*üret|şimdi\s*çiz|çiz\s*bunu|hadi\s*üret|tamam\s*üret|haydi\s*oluştur|şimdi\s*yap|üret\s*artık|oluştur\s*hadi)\b/i.test(
      last,
    );
  if (wants) {
    return {
      reply: 'Tamam, konuştuklarımıza göre görseli şimdi oluşturuyorum.',
      shouldGenerate: true,
      imageBrief: messages.map((m) => `${m.role}: ${m.content}`).join('\n'),
    };
  }
  return {
    reply:
      'Anladım. İstersen biraz daha detay ver: stil, renk, ortam? Hazır olduğunda üret demen yeterli.',
    shouldGenerate: false,
    imageBrief: '',
  };
}

function parseVoiceJson(raw: string): {
  reply: string;
  shouldGenerate: boolean;
  imageBrief: string;
} | null {
  try {
    const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
    const o = JSON.parse(cleaned) as Record<string, unknown>;
    const reply = typeof o.reply === 'string' ? o.reply.trim() : '';
    const shouldGenerate = o.shouldGenerate === true;
    const imageBrief = typeof o.imageBrief === 'string' ? o.imageBrief.trim() : '';
    if (!reply) return null;
    return { reply, shouldGenerate, imageBrief };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messagesRaw = body.messages;
    let messages: ChatTurn[] = [];

    if (Array.isArray(messagesRaw)) {
      messages = messagesRaw
        .filter(
          (m: unknown) =>
            m &&
            typeof m === 'object' &&
            (m as ChatTurn).role &&
            typeof (m as ChatTurn).content === 'string' &&
            ((m as ChatTurn).role === 'user' || (m as ChatTurn).role === 'assistant'),
        )
        .map((m: ChatTurn) => ({
          role: m.role,
          content: m.content.slice(0, 4000),
        }))
        .slice(-20);
    }

    if (messages.length === 0 && typeof body.userText === 'string') {
      messages = [{ role: 'user', content: body.userText.trim().slice(0, 4000) }];
    }

    if (messages.length === 0 || !lastUserText(messages)) {
      return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const h = heuristicReply(messages);
      return NextResponse.json(h);
    }

    const openaiMessages = [
      { role: 'system' as const, content: SYSTEM },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 350,
        temperature: 0.65,
        response_format: { type: 'json_object' },
        messages: openaiMessages,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(heuristicReply(messages));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';
    const parsed = parseVoiceJson(content);
    if (parsed) {
      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      reply: content.slice(0, 400) || 'Devam edelim, nasıl bir görsel düşünüyorsun?',
      shouldGenerate: false,
      imageBrief: '',
    });
  } catch (e) {
    console.error('voice-reply:', e);
    return NextResponse.json({
      reply: 'Bir sorun oldu, tekrar dener misin?',
      shouldGenerate: false,
      imageBrief: '',
    });
  }
}

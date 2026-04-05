import type { Edge, Node } from 'reactflow';
import type { AspectRatio } from '@/types';
import { getTextFromNode } from './graph';

export interface RunWorkflowResult {
  ok: boolean;
  error?: string;
  transformedPrompt?: string;
  images?: { url: string; revisedPrompt?: string }[];
}

/**
 * 1) System Prompt + Input Prompt node metinlerini alır.
 * 2) POST /api/transform-prompt { systemPrompt, prompt }
 * 3) POST /api/generate-images { prompt: transformedPrompt, aspectRatio }
 * Görsel üretimi Image Output node’unda gösterilir; AI Process varsa ara metin oraya yazılır.
 */
export async function runWorkflowPipeline(
  nodes: Node[],
  _edges: Edge[],
): Promise<RunWorkflowResult> {

  const systemNode = nodes.find((n) => n.type === 'systemPrompt');
  const inputNode = nodes.find((n) => n.type === 'inputPrompt');
  const imageOut = nodes.find((n) => n.type === 'imageOutput');

  if (!systemNode) {
    return { ok: false, error: 'System Prompt node’u ekleyin.' };
  }
  if (!inputNode) {
    return { ok: false, error: 'Input Prompt node’u ekleyin.' };
  }
  if (!imageOut) {
    return { ok: false, error: 'Image Output node’u ekleyin.' };
  }

  const systemText = getTextFromNode(systemNode);
  const promptText = getTextFromNode(inputNode);

  if (!systemText.trim()) {
    return { ok: false, error: 'System Prompt metnini doldurun.' };
  }
  if (!promptText.trim()) {
    return { ok: false, error: 'Input Prompt metnini doldurun.' };
  }

  const aspectRatio =
    (imageOut.data as { aspectRatio?: AspectRatio })?.aspectRatio ?? '16:9';

  const trRes = await fetch('/api/transform-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: systemText,
      prompt: promptText,
    }),
  });
  const trData = (await trRes.json()) as {
    error?: string;
    transformedPrompt?: string;
  };
  if (!trRes.ok) {
    return { ok: false, error: trData.error ?? 'Prompt dönüşümü başarısız.' };
  }
  const transformedPrompt = trData.transformedPrompt ?? '';

  const genRes = await fetch('/api/generate-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: transformedPrompt, aspectRatio }),
  });
  const genData = (await genRes.json()) as {
    error?: string;
    images?: { url: string; revisedPrompt?: string }[];
  };
  if (!genRes.ok) {
    return {
      ok: false,
      error: genData.error ?? 'Görsel üretilemedi.',
      transformedPrompt,
    };
  }

  return {
    ok: true,
    transformedPrompt,
    images: genData.images ?? [],
  };
}

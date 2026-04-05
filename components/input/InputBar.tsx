'use client';

import { AIModel, AspectRatio } from '@/types';
import PromptInput from './PromptInput';
import MicButton from './MicButton';
import ModelSelector from './ModelSelector';
import AspectSelector from './AspectSelector';
import GenerateButton from './GenerateButton';

interface InputBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isListening: boolean;
  onMicPointerDown: () => void;
  onMicPointerUp: () => void;
  /** Web Speech API yoksa mikrofon kapalı */
  micSupported?: boolean;
  model: AIModel;
  onModelChange: (m: AIModel) => void;
  aspect: AspectRatio;
  onAspectChange: (a: AspectRatio) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function InputBar({
  value,
  onChange,
  onSubmit,
  isListening,
  onMicPointerDown,
  onMicPointerUp,
  micSupported = true,
  model,
  onModelChange,
  aspect,
  onAspectChange,
  isLoading = false,
  disabled = false,
}: InputBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 20px',
        background: 'linear-gradient(to top, var(--bg-surface) 75%, transparent)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}
    >
      <ModelSelector value={model} onChange={onModelChange} disabled={disabled || isLoading} />
      <AspectSelector value={aspect} onChange={onAspectChange} disabled={disabled || isLoading} />
      <PromptInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        disabled={disabled || isLoading}
        isListening={isListening}
      />
      <MicButton
        isListening={isListening}
        onPointerDownHold={onMicPointerDown}
        onPointerUpHold={onMicPointerUp}
        disabled={disabled || isLoading || !micSupported}
      />
      <GenerateButton
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        isLoading={isLoading}
      />
    </div>
  );
}

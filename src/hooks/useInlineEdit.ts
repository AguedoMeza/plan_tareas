// src/hooks/useInlineEdit.ts
// Hook for inline cell editing (double-click → input → Enter/Esc)

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInlineEditOptions {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel?: () => void;
  validate?: (value: string) => boolean;
}

export function useInlineEdit({ initialValue, onSave, onCancel, validate }: UseInlineEditOptions) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync value when initialValue changes from outside
  useEffect(() => {
    if (!isEditing) setValue(initialValue);
  }, [initialValue, isEditing]);

  const startEdit = useCallback(() => {
    setValue(initialValue);
    setIsEditing(true);
  }, [initialValue]);

  const save = useCallback(() => {
    const trimmed = value.trim();
    if (validate && !validate(trimmed)) return;
    onSave(trimmed);
    setIsEditing(false);
  }, [value, onSave, validate]);

  const cancel = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
    onCancel?.();
  }, [initialValue, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing]);

  return {
    isEditing,
    value,
    setValue,
    inputRef,
    startEdit,
    save,
    cancel,
    handleKeyDown,
  };
}

// A simpler hook for numeric/select inline cycling (prioridad)
export function usePriorityCycle(
  initialValue: string,
  onSave: (value: string) => void
) {
  const ORDER = ['', '1', '2', '3'] as const;
  const cycle = useCallback(() => {
    const idx = ORDER.indexOf(initialValue as typeof ORDER[number]);
    const next = ORDER[(idx + 1) % ORDER.length];
    onSave(next);
  }, [initialValue, onSave]);

  return { cycle };
}

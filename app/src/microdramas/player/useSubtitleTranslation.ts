import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api/api';
import type { SubtitleRange } from './SelectableSubtitle';

type Options = {
  episodeId?: string;
  subtitle?: string;
  supportLanguage: string;
  paused: boolean;
  onPause: () => void;
};

type Selection = {
  episodeId?: string;
  subtitle: string;
  text: string;
  target: string;
  range?: SubtitleRange;
};

export function useSubtitleTranslation({ episodeId, subtitle, supportLanguage, paused, onPause }: Options) {
  const [selection, setSelection] = useState<Selection>();
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    requestId.current += 1;
    setSelection(undefined);
    setTranslations({});
    setLoading(false);
    setError(false);
    return () => { requestId.current += 1; };
  }, [episodeId, supportLanguage]);

  const pinned = paused && selection?.episodeId === episodeId && selection?.target === supportLanguage
    ? selection : undefined;
  const displayedSubtitle = pinned?.subtitle ?? subtitle;
  const selectedText = pinned?.text ?? displayedSubtitle;
  const translatedText = selectedText ? translations[`${supportLanguage}:${selectedText}`] : undefined;

  const clear = useCallback(() => {
    requestId.current += 1;
    setSelection(undefined);
    setLoading(false);
    setError(false);
  }, []);

  useEffect(() => {
    if (!paused) clear();
  }, [clear, paused]);

  const hold = useCallback(() => {
    if (!displayedSubtitle) return;
    if (!pinned) setSelection({ episodeId, subtitle: displayedSubtitle, text: displayedSubtitle, target: supportLanguage });
    onPause();
  }, [displayedSubtitle, episodeId, onPause, pinned, supportLanguage]);

  const translate = useCallback(async (fragment?: string, range?: SubtitleRange) => {
    if (!displayedSubtitle) return;
    const text = fragment === undefined ? displayedSubtitle : fragment.trim();
    if (!text) return;
    const key = `${supportLanguage}:${text}`;
    const currentRequest = ++requestId.current;
    // Pin both the caption and requested text before awaiting pause/network work.
    // The last playback update may advance to a different caption while pausing.
    setSelection({ episodeId, subtitle: displayedSubtitle, text, target: supportLanguage, range });
    onPause();
    setError(false);
    if (translations[key]) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = supportLanguage === 'en'
        ? text
        : (await api.post<{ translatedText?: string }>('/translate', {
          text, source: 'en', target: supportLanguage,
        })).translatedText?.trim();
      if (!result) throw new Error('Empty translation');
      if (requestId.current === currentRequest) {
        setTranslations(current => ({ ...current, [key]: result }));
      }
    } catch {
      if (requestId.current === currentRequest) setError(true);
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [displayedSubtitle, episodeId, onPause, supportLanguage, translations]);

  return { displayedSubtitle, selectedText, range: pinned?.range, translatedText, loading, error, hold, translate, clear };
}

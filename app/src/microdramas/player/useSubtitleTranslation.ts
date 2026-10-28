import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../api/api';

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

  useEffect(() => {
    if (!paused) setSelection(undefined);
  }, [paused]);

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

  const translate = useCallback(async (word?: string) => {
    if (!displayedSubtitle || loading) return;
    const text = word?.trim() || displayedSubtitle;
    const key = `${supportLanguage}:${text}`;
    // Pin both the caption and requested text before awaiting pause/network work.
    // The last playback update may advance to a different caption while pausing.
    setSelection({ episodeId, subtitle: displayedSubtitle, text, target: supportLanguage });
    onPause();
    setError(false);
    if (translations[key]) return;

    const currentRequest = ++requestId.current;
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
  }, [displayedSubtitle, episodeId, loading, onPause, supportLanguage, translations]);

  return { displayedSubtitle, selectedText, translatedText, loading, error, translate, clear };
}

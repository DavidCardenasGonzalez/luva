import { useCallback, useEffect, useState } from 'react';
import { hasSeenTour, markTourAsSeen, type TourScreenId } from './tourProgress';

// Wait for both focus and useful content: a catalog or the first real caption.
export function useMicrodramaTour(screen: TourScreenId, active: boolean, ready = true) {
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEligible(false);
    setOpen(false);
    if (active) {
      void hasSeenTour(screen).then(seen => {
        if (!cancelled) setEligible(!seen);
      });
    }
    return () => { cancelled = true; };
  }, [active, screen]);

  useEffect(() => {
    if (active && ready && eligible) setOpen(true);
  }, [active, eligible, ready]);

  const dismiss = useCallback(() => {
    setEligible(false);
    setOpen(false);
    void markTourAsSeen(screen);
  }, [screen]);

  return { visible: active && open, dismiss };
}

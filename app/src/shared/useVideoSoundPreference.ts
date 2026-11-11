import { useSyncExternalStore } from 'react';

// Keep the user's choice across player instances and episode changes this session.
let isMuted = true;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  return isMuted;
}

function toggleMuted() {
  isMuted = !isMuted;
  listeners.forEach(listener => listener());
}

export function useVideoSoundPreference() {
  return { isMuted: useSyncExternalStore(subscribe, getSnapshot, getSnapshot), toggleMuted };
}

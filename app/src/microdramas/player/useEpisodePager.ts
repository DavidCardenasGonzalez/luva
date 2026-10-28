import { useLayoutEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder } from 'react-native';

type Options = {
  enabled: boolean;
  episodeIndex: number;
  episodeCount: number;
  height: number;
  onSelect: (index: number) => void;
  onIdle?: () => void;
};

export function useEpisodePager(options: Options) {
  const translateY = useRef(new Animated.Value(0)).current;
  const latest = useRef(options);
  latest.current = options;
  const dragging = useRef(false);
  const settling = useRef(false);

  useLayoutEffect(() => {
    translateY.stopAnimation();
    translateY.setValue(0);
    dragging.current = false;
    settling.current = false;
    return () => translateY.stopAnimation();
  }, [options.enabled, options.episodeIndex, options.height, translateY]);

  // Playback updates re-render the player every 500 ms. Keep the responder and
  // its gesture state alive, and read current episode/callback data through refs.
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, gesture) =>
      latest.current.enabled && !settling.current && Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2,
    onPanResponderGrant: () => {
      if (!latest.current.enabled) return;
      translateY.stopAnimation();
      dragging.current = true;
    },
    onPanResponderMove: (_event, gesture) => {
      if (!latest.current.enabled) return;
      const { episodeIndex, episodeCount, height } = latest.current;
      const atEdge = (gesture.dy > 0 && episodeIndex === 0) ||
        (gesture.dy < 0 && episodeIndex === episodeCount - 1);
      translateY.setValue(Math.max(-height, Math.min(height, gesture.dy * (atEdge ? 0.2 : 1))));
    },
    onPanResponderRelease: (_event, gesture) => {
      if (!latest.current.enabled) return;
      const { episodeIndex, episodeCount, height } = latest.current;
      dragging.current = false;
      const direction = gesture.dy < 0 ? 1 : -1;
      const target = episodeIndex + direction;
      const passedThreshold = Math.abs(gesture.dy) >= 55 ||
        (Math.abs(gesture.dy) >= 12 && gesture.vy * direction < -0.5);
      if (!passedThreshold || target < 0 || target >= episodeCount) {
        settling.current = true;
        Animated.spring(translateY, {
          toValue: 0, useNativeDriver: true, tension: 120, friction: 20,
        }).start(({ finished }) => {
          settling.current = false;
          if (finished && latest.current.enabled) latest.current.onIdle?.();
        });
        return;
      }
      settling.current = true;
      Animated.timing(translateY, {
        toValue: -direction * height, duration: 180, useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && latest.current.enabled) latest.current.onSelect(target);
        else settling.current = false;
        // The layout effect resets the offset together with the new episode.
        // There is no second entrance animation after completing the drag.
      });
    },
    onPanResponderTerminate: () => {
      if (!latest.current.enabled) return;
      dragging.current = false;
      settling.current = true;
      Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true, tension: 120, friction: 20,
      }).start(({ finished }) => {
        settling.current = false;
        if (finished && latest.current.enabled) latest.current.onIdle?.();
      });
    },
    onPanResponderTerminationRequest: () => !latest.current.enabled,
  }), [translateY]);

  return { translateY, panHandlers: responder.panHandlers, isInteracting: () => dragging.current || settling.current };
}

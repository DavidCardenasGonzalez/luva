import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent, type LayoutRectangle } from 'react-native';
import { useLanguage } from '../../i18n/LanguageProvider';

export type SubtitleRange = { start: number; end: number };

type Props = {
  subtitle: string;
  range?: SubtitleRange;
  disabled?: boolean;
  onHold: () => void;
  onTranslate: (text: string, range: SubtitleRange) => void;
  onGestureChange: (selecting: boolean) => void;
};

type Drag = { anchor: number; end: number; originX: number; originY: number; x: number; y: number; moved: boolean };

export default function SelectableSubtitle({ subtitle, range, disabled, onHold, onTranslate, onGestureChange }: Props) {
  const { t } = useLanguage();
  const words = useMemo(() => Array.from(subtitle.matchAll(/\S+/g), match => ({
    text: match[0],
    start: match.index!,
    end: match.index! + match[0].length,
  })), [subtitle]);
  const layouts = useRef<Array<LayoutRectangle | undefined>>([]);
  const drag = useRef<Drag | undefined>(undefined);
  const [preview, setPreview] = useState<SubtitleRange>();

  useEffect(() => () => {
    if (drag.current) {
      drag.current = undefined;
      onGestureChange(false);
    }
  }, [onGestureChange]);

  const translateRange = (anchor: number, end: number) => {
    const startWord = words[Math.min(anchor, end)];
    const endWord = words[Math.max(anchor, end)];
    const selection = { start: startWord.start, end: endWord.end };
    const selectedText = subtitle.slice(selection.start, selection.end);
    // Remove punctuation around a single word; preserve punctuation within phrases.
    const text = anchor === end
      ? selectedText.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      : selectedText;
    if (text) onTranslate(text, selection);
  };

  const start = (index: number, { nativeEvent }: GestureResponderEvent) => {
    const layout = layouts.current[index];
    const { pageX, pageY, locationX, locationY } = nativeEvent;
    // The word owns the touch target; subtract its offset to locate the caption row.
    drag.current = {
      anchor: index, end: index, x: pageX, y: pageY, moved: false,
      originX: pageX - locationX - (layout?.x ?? 0),
      originY: pageY - locationY - (layout?.y ?? 0),
    };
    onGestureChange(true);
    onHold();
    setPreview(words[index]);
    return true;
  };

  const update = ({ nativeEvent: { pageX, pageY } }: GestureResponderEvent) => {
    const current = drag.current;
    if (!current || (!current.moved && Math.hypot(pageX - current.x, pageY - current.y) < 5)) return;
    current.moved = true;
    const x = pageX - current.originX;
    const y = pageY - current.originY;
    // Choose the nearest line first so the selection can follow wrapped captions.
    let bestY = Infinity;
    let bestX = Infinity;
    let end = current.end;
    layouts.current.forEach((layout, index) => {
      if (!layout) return;
      const dy = Math.max(layout.y - y, y - layout.y - layout.height, 0);
      const dx = Math.max(layout.x - x, x - layout.x - layout.width, 0);
      if (dy < bestY || (dy === bestY && dx < bestX)) {
        bestY = dy;
        bestX = dx;
        end = index;
      }
    });
    if (end === current.end) return;
    current.end = end;
    setPreview({ start: words[Math.min(current.anchor, end)].start, end: words[Math.max(current.anchor, end)].end });
  };

  const stop = () => {
    const current = drag.current;
    if (current) {
      drag.current = undefined;
      setPreview(undefined);
      onGestureChange(false);
    }
    return current;
  };

  const selected = preview ?? range;
  return (
    <View style={styles.row}>
      {words.map((word, index) => {
        const highlighted = !!selected && word.start >= selected.start && word.end <= selected.end;
        const activate = () => { if (!disabled) translateRange(index, index); };
        return (
          <View
            key={word.start}
            accessible
            accessibilityRole="button"
            accessibilityLabel={word.text}
            accessibilityState={{ disabled, selected: highlighted }}
            accessibilityActions={[{ name: 'activate', label: t('subtitles.translateWord') }]}
            onAccessibilityTap={activate}
            onAccessibilityAction={({ nativeEvent }) => {
              if (nativeEvent.actionName === 'activate') activate();
            }}
            onLayout={({ nativeEvent }) => { layouts.current[index] = nativeEvent.layout; }}
            onStartShouldSetResponder={() => !disabled}
            onResponderGrant={event => start(index, event)}
            onResponderStart={event => { if (event.nativeEvent.touches.length > 1) stop(); }}
            onResponderMove={update}
            onResponderRelease={event => {
              update(event);
              const current = stop();
              if (current && !disabled) translateRange(current.anchor, current.end);
            }}
            onResponderTerminationRequest={() => false}
            onResponderTerminate={stop}
            style={[styles.word, highlighted && styles.highlighted]}
          >
            <View pointerEvents="none">
              <Text style={[styles.text, highlighted && styles.highlightedText]}>{word.text}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  word: { paddingHorizontal: 3, borderRadius: 4, maxWidth: '100%' },
  text: { color: 'white', fontSize: 20, lineHeight: 28, fontWeight: '800' },
  highlighted: { backgroundColor: '#a5f3fc' },
  highlightedText: { color: '#164e63' },
});

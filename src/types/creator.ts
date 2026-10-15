/**
 * Creator Mode contracts (Phase 5). Interfaces only — Creator Mode is not built.
 * Capture is planned as screen recording (OBS/browser), not in-app video export.
 */

export type FramePreset = {
  readonly id: 'vertical-9x16' | 'horizontal-16x9';
  readonly label: string;
  readonly width: number;
  readonly height: number;
};

export const FRAME_PRESETS: readonly FramePreset[] = [
  { id: 'vertical-9x16', label: 'Vertical 9:16 (1080×1920)', width: 1080, height: 1920 },
  { id: 'horizontal-16x9', label: 'Horizontal 16:9 (1920×1080)', width: 1920, height: 1080 },
];

export type CaptureOverlay = 'clean' | 'historical' | 'alternate' | 'comparison';

export type PlaybackSpeed = 0.5 | 1 | 2;

export const PLAYBACK_SPEEDS: readonly PlaybackSpeed[] = [0.5, 1, 2];

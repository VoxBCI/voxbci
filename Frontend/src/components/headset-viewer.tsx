import { VoxLogo } from '@/components/vox-logo';

type HeadsetViewerProps = {
  /** Height of the viewer area in points. Ignored when `fill` is true. */
  height?: number;
  /** Expand to fill the parent container instead of using a fixed height. */
  fill?: boolean;
};

/**
 * Native fallback for the headset model viewer. The interactive 3D view is
 * implemented on web; other platforms show the Vox mark in its place.
 */
export function HeadsetViewer({ height = 160, fill = false }: HeadsetViewerProps) {
  if (fill) {
    return <VoxLogo size={112} />;
  }
  return <VoxLogo size={Math.min(height, 112)} />;
}

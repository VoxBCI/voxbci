import { VoxLogo } from '@/components/vox-logo';

type HeadsetViewerProps = {
  /** Height of the viewer area in points. */
  height?: number;
};

/**
 * Native fallback for the headset model viewer. The interactive 3D view is
 * implemented on web; other platforms show the Vox mark in its place.
 */
export function HeadsetViewer({ height = 160 }: HeadsetViewerProps) {
  return <VoxLogo size={Math.min(height, 112)} />;
}

import { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PhotoPicker({ label, fileName, disabled = false, onChange }: {
  label: string;
  fileName?: string;
  disabled?: boolean;
  onChange: (file: File) => void;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  async function takePhoto() {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Camera: NativeCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const photo = await NativeCamera.getPhoto({ source: CameraSource.Camera, resultType: CameraResultType.Uri, quality: 80, width: 1600, correctOrientation: true });
        if (!photo.webPath) return;
        const blob = await (await fetch(photo.webPath)).blob();
        const type = blob.type || `image/${photo.format === 'png' ? 'png' : 'jpeg'}`;
        onChange(new File([blob], `photo-${Date.now()}.${type.split('/')[1]}`, { type }));
        return;
      }
    } catch (error) {
      if (String((error as Error)?.message ?? error).toLowerCase().includes('cancel')) return;
    }
    camera.current?.click();
  }
  function select(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (file) onChange(file);
  }
  return <div className="min-w-0 space-y-2">
    <p className="text-sm">{label}</p>
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="secondary" disabled={disabled} onClick={() => void takePhoto()}><Camera />Take photo</Button>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => gallery.current?.click()}><ImagePlus />Upload photo</Button>
    </div>
    <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={`${label} camera`} className="hidden" disabled={disabled} onChange={select} />
    <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" aria-label={`${label} gallery`} className="hidden" disabled={disabled} onChange={select} />
    {fileName && <p translate="no" className="break-all text-xs text-muted-foreground">{fileName}</p>}
  </div>;
}
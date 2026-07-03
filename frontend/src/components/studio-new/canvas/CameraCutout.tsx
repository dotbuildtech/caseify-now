'use client';

interface CameraCutoutData {
  x: number; y: number; w: number; h: number;
  type?: string;
}

interface CameraCutoutProps {
  cameraCutout?: CameraCutoutData | null;
  deviceId?: string | null;
}

function getPreset(deviceId?: string | null): CameraCutoutData {
  const id = deviceId?.toLowerCase() || '';
  if (id.startsWith('iphone') || id.startsWith('apple-iphone')) {
    const isPro = id.includes('pro');
    return { x: 2.5, y: 6, w: isPro ? 34 : 42, h: isPro ? 15 : 16, type: isPro ? 'square-3' : 'square-2' };
  }
  if (id.startsWith('galaxy') || id.startsWith('samsung')) {
    const isUltra = id.includes('ultra');
    return { x: 2, y: 6, w: isUltra ? 24 : 20, h: isUltra ? 28 : 24, type: isUltra ? 'vertical-3' : 'vertical-2' };
  }
  if (id.startsWith('pixel')) return { x: 2, y: 6, w: 96, h: 11, type: 'bar' };
  if (id.includes('oneplus')) return { x: 2, y: 6, w: 28, h: 14, type: 'circle' };
  return { x: 2.5, y: 6, w: 34, h: 15, type: 'square-3' };
}

type LensType = 'square-3' | 'square-2' | 'vertical-3' | 'vertical-2' | 'bar' | 'circle';

export default function CameraCutout({ cameraCutout, deviceId }: CameraCutoutProps) {
  const preset = getPreset(deviceId);
  const cam: CameraCutoutData & { type: LensType } = {
    ...preset,
    ...cameraCutout,
    type: (cameraCutout?.type || preset.type) as LensType,
  };

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        left: `${cam.x}%`, top: `${cam.y}%`, width: `${cam.w}%`, height: `${cam.h}%`,
        borderRadius: cam.type === 'bar' ? '8px' : cam.type === 'circle' ? '50%' : '18% / 28%',
        background: 'linear-gradient(145deg, rgba(180,185,200,0.35) 0%, rgba(140,145,160,0.25) 50%, rgba(100,105,120,0.35) 100%)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute inset-0" style={{ borderRadius: 'inherit', background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)' }} />
      <div className="absolute -top-[3px] inset-x-[10%] h-[3px] bg-gradient-to-b from-white/4 to-transparent rounded-t-full" />

      {cam.type === 'square-3' && (
        <>
          <div className="absolute left-[15%] top-[18%] h-[28%] w-[24%] rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute right-[15%] top-[16%] h-[26%] w-[24%] rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute left-[50%] top-[55%] h-[24%] w-[22%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute right-[18%] bottom-[10%] h-[10%] w-[14%] rounded-sm bg-black/70 ring-1 ring-white/8" />
        </>
      )}
      {cam.type === 'square-2' && (
        <>
          <div className="absolute left-[20%] top-[22%] h-[32%] w-[26%] rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute right-[20%] top-[20%] h-[30%] w-[26%] rounded-full bg-black/85 ring-1 ring-white/12" />
        </>
      )}
      {cam.type === 'vertical-3' && (
        <>
          <div className="absolute left-[50%] top-[8%] h-[20%] w-[40%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute left-[50%] top-[36%] h-[20%] w-[40%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute left-[50%] top-[64%] h-[20%] w-[40%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute right-[12%] bottom-[4%] h-[12%] w-[30%] rounded-sm bg-black/70 ring-1 ring-white/8" />
        </>
      )}
      {cam.type === 'vertical-2' && (
        <>
          <div className="absolute left-[50%] top-[14%] h-[26%] w-[46%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute left-[50%] top-[52%] h-[26%] w-[46%] -translate-x-1/2 rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute right-[10%] bottom-[5%] h-[10%] w-[28%] rounded-sm bg-black/70 ring-1 ring-white/8" />
        </>
      )}
      {cam.type === 'bar' && (
        <>
          <div className="absolute left-[5%] top-[50%] -translate-y-1/2 h-[55%] w-[7%] rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute left-[16%] top-[50%] -translate-y-1/2 h-[55%] w-[7%] rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute left-[27%] top-[50%] -translate-y-1/2 h-[45%] w-[5%] rounded-sm bg-black/70 ring-1 ring-white/8" />
        </>
      )}
      {cam.type === 'circle' && (
        <>
          <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 h-[45%] w-[35%] rounded-full bg-black/85 ring-1 ring-white/12" />
          <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 h-[30%] w-[22%] rounded-full bg-black/70 ring-1 ring-white/10" />
        </>
      )}
    </div>
  );
}

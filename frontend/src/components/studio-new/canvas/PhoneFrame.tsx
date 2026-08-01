'use client';

interface PhoneFrameProps {
  bezelColor?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
  children?: React.ReactNode;
}

export default function PhoneFrame({
  bezelColor = '#1f1f23',
  width,
  height,
  cornerRadius = 42,
  children,
}: PhoneFrameProps) {
  const maskId = 'phone-bezel-mask';

  return (
    <div className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden="true">
        <defs>
          <clipPath id={maskId}>
            <rect
              x="0" y="0"
              width="100%" height="100%"
              rx={cornerRadius} ry={cornerRadius}
            />
          </clipPath>
        </defs>
      </svg>
      <div className="absolute inset-0 z-5" style={{ clipPath: `url(#${maskId})` }}>
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          borderRadius: `${cornerRadius}px`,
          background: `linear-gradient(160deg, ${bezelColor}11 0%, ${bezelColor}22 40%, ${bezelColor}33 100%)`,
          boxShadow: `
            inset 0 0 0 1px rgba(255,255,255,0.04),
            inset 0 0 0 3px rgba(0,0,0,0.06),
            0 0 0 1px rgba(0,0,0,0.15),
            0 8px 32px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.06)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-[3px] z-0"
        style={{
          borderRadius: `${cornerRadius - 3}px`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)',
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[1.5%] z-20 h-[1.2%] w-[15%] -translate-x-1/2 rounded-full bg-black/20" />
    </div>
  );
}

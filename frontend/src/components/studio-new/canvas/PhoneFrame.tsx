'use client';

interface PhoneFrameProps {
  bezelColor?: string;
}

export default function PhoneFrame({ bezelColor = '#1f1f23' }: PhoneFrameProps) {
  return (
    <>
      {/* Outer phone bezel */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[14%]/[8%]"
        style={{
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
      {/* Inner screen highlight */}
      <div
        className="pointer-events-none absolute inset-[3px] z-0 rounded-[13%]/[7%]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)',
        }}
      />
      {/* Top notch / speaker */}
      <div className="pointer-events-none absolute left-1/2 top-[1.5%] z-20 h-[1.2%] w-[15%] -translate-x-1/2 rounded-full bg-black/20" />
    </>
  );
}

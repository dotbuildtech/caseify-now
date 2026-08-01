'use client';

interface CameraCutoutProps {
  cutoutSvg?: string | null;
  width?: number;
  height?: number;
}

export default function CameraCutout({ cutoutSvg, width = 2400, height = 5200 }: CameraCutoutProps) {
  if (!cutoutSvg) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-25">
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="camera-cutout-clip">
            <path d={cutoutSvg} />
          </clipPath>
        </defs>
        <rect
          x="0" y="0"
          width={width}
          height={height}
          fill="rgba(0,0,0,0.4)"
          clipPath="url(#camera-cutout-clip)"
        />
      </svg>
    </div>
  );
}

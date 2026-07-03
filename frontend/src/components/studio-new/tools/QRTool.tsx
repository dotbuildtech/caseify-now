'use client';
import { useState } from 'react';
import { useStudioStore } from '@/store/studioStore';
import ColorPicker from '../shared/ColorPicker';
import Slider from '../shared/Slider';
import { Plus, QrCode } from 'lucide-react';

export default function QRTool() {
  const addLayer = useStudioStore((s) => s.addLayer);
  const [data, setData] = useState('https://example.com');
  const [color, setColor] = useState('#0A0A0A');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [size, setSize] = useState(120);

  const handleAdd = () => {
    if (!data.trim()) return;
    addLayer({
      type: 'qrcode',
      data: data.trim(),
      color,
      bgColor,
      size,
      opacity: 1,
      rotation: 0,
      x: 50, y: 150,
      width: size, height: size,
      visible: true, locked: false, name: 'QR Code',
    } as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-accent/30">
        <QrCode className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">QR Code Generator</p>
          <p className="text-[10px] text-muted-foreground">Generate a scannable QR code</p>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">URL or Text</label>
        <input value={data} onChange={(e) => setData(e.target.value)}
          placeholder="https://..."
          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
        />
      </div>

      <ColorPicker label="QR Color" value={color} onChange={setColor} />
      <ColorPicker label="Background" value={bgColor} onChange={setBgColor} />
      <Slider label="Size" value={size} min={40} max={300} suffix="px" onChange={setSize} />

      <button onClick={handleAdd}
        className="w-full h-10 rounded-xl bg-foreground text-background text-xs font-semibold shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <Plus className="h-3.5 w-3.5" /> Add QR Code
      </button>

      {data && (
        <div className="flex items-center justify-center p-4 rounded-xl bg-white border border-border">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=${Math.min(size, 200)}x${Math.min(size, 200)}&data=${encodeURIComponent(data)}&color=${color.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`}
            alt="QR Code"
            className="max-w-full"
            style={{ width: Math.min(size, 200), height: Math.min(size, 200) }}
          />
        </div>
      )}
    </div>
  );
}

'use client';
import { useCallback } from 'react';
import { Trash2, Copy, ChevronDown } from 'lucide-react';
import type { EditableAreaData, AreaType, AreaShapeType } from '@/types/studio';

interface AreaPropertiesPanelProps {
  area: EditableAreaData;
  onUpdate: (patch: Partial<EditableAreaData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const AREA_TYPES: { value: AreaType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'text', label: 'Text' },
  { value: 'logo', label: 'Logo' },
  { value: 'qr_code', label: 'QR Code' },
  { value: 'sticker', label: 'Sticker' },
  { value: 'mixed', label: 'Mixed' },
];

const SHAPE_TYPES: { value: AreaShapeType; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'rounded_rectangle', label: 'Rounded Rectangle' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'custom', label: 'Custom Path' },
];

function NumberInput({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-medium text-text-light uppercase tracking-wider">{label}</label>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-20 px-2 py-1 text-[11px] text-right border border-border rounded bg-background focus:outline-none focus:border-primary tabular-nums"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-medium text-text-light uppercase tracking-wider">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}

export default function AreaPropertiesPanel({ area, onUpdate, onDelete, onDuplicate }: AreaPropertiesPanelProps) {
  return (
    <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-background/50 overflow-y-auto" style={{ maxHeight: '600px' }}>
      <div className="p-3 border-b border-border bg-background-light/30">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-foreground">Area Properties</h4>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onDuplicate} className="p-1 rounded text-text-light hover:text-foreground hover:bg-accent transition-colors" title="Duplicate">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onDelete} className="p-1 rounded text-error/70 hover:text-error hover:bg-error/10 transition-colors" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <input
          type="text"
          value={area.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:border-primary"
          placeholder="Area Name"
        />
      </div>

      <div className="p-3 space-y-3 divide-y divide-border">
        <Section title="Type">
          <SelectField
            label="Area Type"
            value={area.areaType}
            options={AREA_TYPES}
            onChange={(v) => onUpdate({ areaType: v as AreaType })}
          />
          <SelectField
            label="Shape"
            value={area.shapeType}
            options={SHAPE_TYPES}
            onChange={(v) => onUpdate({ shapeType: v as AreaShapeType })}
          />
        </Section>

        <Section title="Position">
          <NumberInput label="X" value={area.x} onChange={(v) => onUpdate({ x: v })} />
          <NumberInput label="Y" value={area.y} onChange={(v) => onUpdate({ y: v })} />
          <NumberInput label="Width" value={area.width} onChange={(v) => onUpdate({ width: v })} min={10} />
          <NumberInput label="Height" value={area.height} onChange={(v) => onUpdate({ height: v })} min={10} />
          <NumberInput label="Rotation" value={area.rotation || 0} onChange={(v) => onUpdate({ rotation: v })} min={-360} max={360} />
        </Section>

        <Section title="Border Radius">
          {area.shapeType !== 'polygon' && area.shapeType !== 'custom' ? (
            <>
              <NumberInput label="All Corners" value={area.borderRadius} onChange={(v) => onUpdate({ borderRadius: v })} min={0} step={1} />
              <NumberInput label="Top" value={area.borderRadiusTop} onChange={(v) => onUpdate({ borderRadiusTop: v })} min={0} step={1} />
              <NumberInput label="Bottom" value={area.borderRadiusBottom} onChange={(v) => onUpdate({ borderRadiusBottom: v })} min={0} step={1} />
            </>
          ) : area.shapeType === 'polygon' ? (
            <NumberInput label="Sides" value={area.polygonSides ?? 3} onChange={(v) => onUpdate({ polygonSides: v })} min={3} max={6} step={1} />
          ) : area.shapeType === 'custom' ? (
            <div>
              <label className="text-[10px] font-medium text-text-light uppercase tracking-wider">Path Data</label>
              <textarea
                value={area.pathData || ''}
                onChange={(e) => onUpdate({ pathData: e.target.value })}
                className="w-full mt-1 px-2 py-1.5 text-[10px] font-mono border border-border rounded bg-background focus:outline-none focus:border-primary min-h-[80px] resize-y"
                placeholder="M 0.1 0.1 L 0.9 0.1 L 0.9 0.9 L 0.1 0.9 Z"
                spellCheck={false}
              />
              <p className="text-[9px] text-text-light/50 mt-1 leading-tight">
                SVG path data (normalized 0–1 within bounding box). Use relative or absolute coordinates.
              </p>
            </div>
          ) : null}
        </Section>

        <Section title="Zoom Limits">
          <NumberInput label="Min Zoom" value={area.minZoom ?? 0.1} onChange={(v) => onUpdate({ minZoom: v })} min={0.05} max={1} step={0.05} />
          <NumberInput label="Max Zoom" value={area.maxZoom ?? 5} onChange={(v) => onUpdate({ maxZoom: v })} min={1} max={10} step={0.5} />
        </Section>

        <Section title="Constraints">
          <Toggle label="Allow Rotation" value={area.allowRotation} onChange={(v) => onUpdate({ allowRotation: v })} />
          <Toggle label="Allow Flip" value={area.allowFlip} onChange={(v) => onUpdate({ allowFlip: v })} />
          <Toggle label="Lock Aspect Ratio" value={area.lockAspectRatio} onChange={(v) => onUpdate({ lockAspectRatio: v })} />
        </Section>

        <Section title="Behavior">
          <Toggle label="Required" value={area.isRequired} onChange={(v) => onUpdate({ isRequired: v })} />
          <Toggle label="Visible" value={area.isVisible} onChange={(v) => onUpdate({ isVisible: v })} />
          <Toggle label="Enabled" value={area.isEnabled} onChange={(v) => onUpdate({ isEnabled: v })} />
          <NumberInput label="Z-Index" value={area.zIndex} onChange={(v) => onUpdate({ zIndex: v })} min={0} />
          <NumberInput label="Opacity" value={area.opacity} onChange={(v) => onUpdate({ opacity: v })} min={0} max={1} step={0.05} />
        </Section>

        <Section title="Upload">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-text-light uppercase tracking-wider">Max Size (MB)</label>
            <input
              type="number"
              value={(area.maxUploadSize ?? 5242880) / 1048576}
              onChange={(e) => onUpdate({ maxUploadSize: (parseFloat(e.target.value) || 1) * 1048576 })}
              min={0.5}
              step={0.5}
              className="w-20 px-2 py-1 text-[11px] text-right border border-border rounded bg-background focus:outline-none focus:border-primary tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-light uppercase tracking-wider">Accepted Types</label>
            <input
              type="text"
              value={area.acceptedFileTypes || ''}
              onChange={(e) => onUpdate({ acceptedFileTypes: e.target.value })}
              className="w-full mt-1 px-2 py-1 text-[11px] border border-border rounded bg-background focus:outline-none focus:border-primary"
              placeholder="image/jpeg,image/png"
            />
          </div>
        </Section>

        <Section title="Placeholder">
          {area.placeholderImage ? (
            <div className="relative w-full aspect-video rounded border border-border overflow-hidden bg-background">
              <img src={area.placeholderImage} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onUpdate({ placeholderImage: null })}
                className="absolute top-1 right-1 bg-error/80 text-white rounded-full p-0.5 text-[10px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full py-3 border border-dashed border-border rounded cursor-pointer hover:border-primary/50 transition-colors">
              <span className="text-[10px] text-text-light">+ Add Placeholder</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    onUpdate({ placeholderImage: url });
                  }
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </Section>

        <Section title="Notes">
          <textarea
            value={area.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full px-2 py-1.5 text-[11px] border border-border rounded bg-background focus:outline-none focus:border-primary min-h-[60px] resize-y"
            placeholder="Internal notes..."
          />
        </Section>
      </div>

      <div className="p-3 border-t border-border bg-background-light/20">
        <div className="text-[9px] text-text-light/60 font-mono">
          ID: {area.id} | Sort: {area.sortOrder}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2 first:pt-0 last:pb-0 space-y-2">
      <h5 className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-light/70">{title}</h5>
      {children}
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-medium text-text-light uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 px-2 py-1 text-[11px] border border-border rounded bg-background focus:outline-none focus:border-primary appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='%23999' d='M4 6L0 2h8z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 6px center',
          paddingRight: '20px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

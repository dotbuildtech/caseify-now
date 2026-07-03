'use client';
import { useStudioStore } from '@/store/studioStore';
import { MATERIALS_DATA } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/utils';
import { Check } from 'lucide-react';

export default function MaterialSelector() {
  const materialId = useStudioStore((s) => s.materialId);
  const setMaterialId = useStudioStore((s) => s.setMaterialId);
  const materials = useStudioStore((s) => s.materials);

  const displayMaterials = materials.length > 0 ? materials : MATERIALS_DATA;

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Material</h3>

      <div className="grid grid-cols-2 gap-1.5">
        {displayMaterials.map((mat: any) => {
          const id = mat.id || mat.name?.toLowerCase();
          const label = mat.label || mat.name;
          const price = mat.price ?? 0;
          const icon = mat.icon || '📱';
          const isSelected = materialId === id;

          return (
            <button
              key={id}
              onClick={() => setMaterialId(id)}
              className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left',
                isSelected
                  ? 'border-foreground bg-accent shadow-sm'
                  : 'border-border bg-background hover:border-foreground/50 hover:bg-accent/50'
              )}
            >
              <span className="text-lg shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[11px] font-medium truncate', isSelected ? 'text-foreground' : 'text-foreground')}>{label}</p>
                <p className={cn('text-[9px] truncate', isSelected ? 'text-foreground/60' : 'text-muted-foreground')}>
                  {price > 0 ? `+${formatINR(price)}` : 'Included'}
                </p>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />}
            </button>
          );
        })}
      </div>

      {/* Selected material details */}
      {materialId && (
        <div className="rounded-lg border border-border bg-accent/30 p-2.5">
          <p className="text-[9px] text-muted-foreground/60">{MATERIALS_DATA.find(m => m.id === materialId)?.description || 'Standard material'}</p>
        </div>
      )}
    </div>
  );
}

'use client';
import dynamic from 'next/dynamic';
import { useStudioStore } from '@/store/studioStore';

const StudioPage = dynamic(() => import('@/components/studio-new/StudioPage'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Studio...</p>
      </div>
    </div>
  ),
});

const StudioLanding = dynamic(() => import('@/components/studio-new/StudioLanding'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </div>
  ),
});

export default function CustomizePage() {
  const inStudio = useStudioStore((s) => s.inStudio);

  return (
    <>
      <div style={{ display: inStudio ? 'none' : undefined }}>
        <StudioLanding />
      </div>
      {inStudio && <StudioPage />}
    </>
  );
}
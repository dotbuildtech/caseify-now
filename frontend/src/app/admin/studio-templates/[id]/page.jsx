'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudioTemplateForm from '../StudioTemplateForm';
import { adminGetStudioTemplateV2 } from '@/services/adminApi';

export default function EditStudioTemplatePage() {
  const params = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    adminGetStudioTemplateV2(params.id)
      .then(setTemplate)
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="h-32 bg-background-light animate-pulse" />;
  if (!template) return <p className="text-sm text-error">Template not found</p>;

  return <StudioTemplateForm mode="edit" initial={template} />;
}

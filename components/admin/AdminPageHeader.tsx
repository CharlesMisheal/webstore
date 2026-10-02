import React from 'react';

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone pb-4">
      <div>
        <span className="text-xs font-semibold text-gold-dark uppercase tracking-widest block">{eyebrow}</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">{title}</h1>
        {description && <p className="text-xs text-text-3 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="p-12 text-center space-y-3">
      <Icon className="w-10 h-10 mx-auto text-text-3" />
      <h2 className="font-serif text-lg text-navy">{title}</h2>
      <p className="text-xs text-text-3">{body}</p>
    </div>
  );
}

export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', { dateStyle: 'medium' });
}

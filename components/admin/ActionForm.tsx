'use client';

import React, { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { ActionResult } from '@/app/(admin)/admin/actions';

type ServerAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

interface ActionFormProps {
  action: ServerAction;
  children: React.ReactNode;
  className?: string;
  /** Optional native confirm() before submit (for destructive actions). */
  confirmMessage?: string;
  /** Called after a successful action (e.g. to close a dialog). */
  onSuccess?: (message: string) => void;
  /** Hide the inline result message (when a parent shows a toast instead). */
  hideResult?: boolean;
}

export function SubmitButton({ children, pendingLabel, className = '' }: { children: React.ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:opacity-60 disabled:cursor-wait`}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/**
 * Thin wrapper around a server action + useFormState that renders the result
 * (role=alert / role=status) and resets the form on success.
 */
export function ActionForm({ action, children, className = '', confirmMessage, onSuccess, hideResult }: ActionFormProps) {
  const [state, formAction] = useFormState<ActionResult, FormData>(action, { ok: false, message: '' });
  const formRef = useRef<HTMLFormElement>(null);
  const lastHandled = useRef<string>('');

  useEffect(() => {
    if (state.ok && state.message && lastHandled.current !== state.message) {
      lastHandled.current = state.message;
      onSuccess?.(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
      {!hideResult && state.message && (
        <p
          role={state.ok ? 'status' : 'alert'}
          className={`mt-2 text-[11px] px-2.5 py-1.5 rounded border ${
            state.ok ? 'bg-emerald-50 text-aplus-success border-emerald-200' : 'bg-red-50 text-aplus-error border-red-200'
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

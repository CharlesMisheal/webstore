import fs from 'node:fs';
import path from 'node:path';

/**
 * Minimal Handlebars-compatible renderer for the three transactional templates
 * in /emails (design pack). Supports exactly what those templates use:
 *   {{var}}                      HTML-escaped substitution
 *   {{#each items}}…{{/each}}    iteration with {{this.prop}}
 * Unknown variables render as empty strings; `%unsubscribe_url%` is left for Mailgun.
 */

export type TemplateName = 'order-confirmation' | 'welcome' | 'quotation-received';

export type TemplateScalar = string | number | boolean | null | undefined;
export type TemplateVars = Record<string, TemplateScalar | Array<Record<string, TemplateScalar>>>;

const cache = new Map<TemplateName, string>();

export function loadTemplate(name: TemplateName): string {
  const cached = cache.get(name);
  if (cached) return cached;
  const file = path.join(process.cwd(), 'emails', `${name}.html`);
  const html = fs.readFileSync(file, 'utf8');
  cache.set(name, html);
  return html;
}

export function escapeHtml(value: TemplateScalar): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EACH_RE = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
const VAR_RE = /\{\{\s*(this\.)?([\w.]+)\s*\}\}/g;

export function renderTemplate(source: string, vars: TemplateVars): string {
  const withLoops = source.replace(EACH_RE, (_m, listName: string, block: string) => {
    const list = vars[listName];
    if (!Array.isArray(list)) return '';
    return list
      .map((item) => block.replace(VAR_RE, (_mm, isThis: string | undefined, key: string) => {
        const scope: Record<string, TemplateScalar> = isThis ? item : { ...(vars as Record<string, TemplateScalar>), ...item };
        return escapeHtml(scope[key]);
      }))
      .join('');
  });

  return withLoops.replace(VAR_RE, (_m, _isThis: string | undefined, key: string) => {
    const value = vars[key];
    return Array.isArray(value) ? '' : escapeHtml(value);
  });
}

export function renderEmail(name: TemplateName, vars: TemplateVars): string {
  return renderTemplate(loadTemplate(name), vars);
}

/** Crude text alternative for clients that block HTML (and for deliverability). */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<div style="display:none[^"]*"[^>]*>[\s\S]*?<\/div>/i, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’')
    .replace(/&rarr;/g, '→')
    .replace(/&amp;/g, '&')
    .replace(/&#\d+;|&zwnj;/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

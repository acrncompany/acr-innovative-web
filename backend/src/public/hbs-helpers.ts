import hbs from 'hbs';

const escape = (s: string) => hbs.handlebars.Utils.escapeExpression(s);
const safe = (s: string) => new hbs.handlebars.SafeString(s);

/**
 * Template helpers. Text fields entered in the admin use two tiny conventions:
 *   [[highlighted words]]  -> <span class="in-highlight">..</span>
 *   newline                -> <br>
 */
export function registerHelpers() {
  const h = hbs.registerHelper.bind(hbs);

  // {{hl text}} or {{hl text 'uk-text-primary'}}: escape, highlight [[..]], newlines -> <br>
  h('hl', (text: unknown, cls: unknown) => {
    const css = typeof cls === 'string' ? cls : 'in-highlight';
    const out = escape(String(text ?? ''))
      .replace(/\[\[(.+?)\]\]/g, `<span class="${css}">$1</span>`)
      .replace(/\r?\n/g, '<br>');
    return safe(out);
  });

  // {{lines text}}: escape + newlines -> <br> (addresses)
  h('lines', (text: unknown) => safe(escape(String(text ?? '')).replace(/\r?\n/g, '<br>')));

  // {{paragraphs text 'class'}}: blank-line separated text -> <p> elements
  h('paragraphs', (text: unknown, cls: unknown) => {
    const attr = typeof cls === 'string' ? ` class="${escape(cls)}"` : '';
    const parts = String(text ?? '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
    return safe(parts.map((p) => `<p${attr}>${escape(p)}</p>`).join('\n'));
  });

  // {{monthYear date}} -> "March 2025"
  h('monthYear', (d: unknown) =>
    d ? new Date(d as any).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
  // {{isoDate date}} -> 2025-03-01
  h('isoDate', (d: unknown) => (d ? new Date(d as any).toISOString().slice(0, 10) : ''));

  h('eq', (a: unknown, b: unknown) => a === b);
  h('inc', (n: unknown) => Number(n) + 1);
  h('pad2', (n: unknown) => String(Number(n)).padStart(2, '0'));
  h('json', (o: unknown) => safe(JSON.stringify(o).replace(/</g, '\u003c')));
}

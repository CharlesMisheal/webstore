import { describe, it, expect } from 'vitest';
import { renderTemplate, renderEmail, htmlToText } from '../lib/email-templates';

describe('email template renderer', () => {
  it('substitutes and HTML-escapes variables', () => {
    expect(renderTemplate('Hi {{name}}!', { name: '<Tobi & co>' })).toBe('Hi &lt;Tobi &amp; co&gt;!');
  });

  it('renders #each blocks with this.* access', () => {
    const out = renderTemplate('{{#each items}}[{{this.name}}:{{this.qty}}]{{/each}}', {
      items: [
        { name: 'Suit', qty: 1 },
        { name: 'Shirt', qty: 2 },
      ],
    });
    expect(out).toBe('[Suit:1][Shirt:2]');
  });

  it('renders unknown variables as empty strings and leaves Mailgun tokens alone', () => {
    expect(renderTemplate('a{{missing}}b %unsubscribe_url%', {})).toBe('ab %unsubscribe_url%');
  });

  it('loads the real order-confirmation template from /emails', () => {
    const html = renderEmail('order-confirmation', {
      customer_name: 'Tobi',
      order_number: 'APF-261002-1234',
      items: [{ name: 'Suit', size: '40R', fit_type: 'Ready to wear', qty: 1, line_total: '₦185,000', image_url: 'x' }],
      total: '₦189,500',
    });
    expect(html).toContain('APF-261002-1234');
    expect(html).toContain('₦189,500');
    expect(html).not.toContain('{{');
    expect(htmlToText(html)).toContain('Thank you, Tobi.');
  });
});

import { describe, it, expect } from 'vitest';
import { highlightJson } from './jsonHighlight';

describe('highlightJson', () => {
  it('wraps keys in blue span', () => {
    const result = highlightJson('{"key": "value"}');
    expect(result).toContain('text-blue-600');
    expect(result).toContain('dark:text-blue-400');
    expect(result).toContain('"key":');
  });

  it('wraps string values in green span', () => {
    const result = highlightJson('{"key": "value"}');
    expect(result).toContain('text-green-600');
    expect(result).toContain('dark:text-green-400');
    expect(result).toContain('"value"');
  });

  it('wraps booleans in amber span', () => {
    const result = highlightJson('{"flag": true}');
    expect(result).toContain('text-amber-600');
    expect(result).toContain('dark:text-amber-400');
    expect(result).toContain('>true<');
  });

  it('wraps null in amber span', () => {
    const result = highlightJson('{"field": null}');
    expect(result).toContain('text-amber-600');
    expect(result).toContain('dark:text-amber-400');
    expect(result).toContain('>null<');
  });

  it('wraps numbers in violet span', () => {
    const result = highlightJson('{"count": 42}');
    expect(result).toContain('text-violet-600');
    expect(result).toContain('dark:text-violet-400');
    expect(result).toContain('>42<');
  });

  it('escapes & to &amp;', () => {
    const result = highlightJson('{"key": "a & b"}');
    expect(result).toContain('&amp;');
  });

  it('escapes < to &lt; and > to &gt;', () => {
    const result = highlightJson('{"key": "<value>"}');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  it('does not throw on empty object', () => {
    expect(() => highlightJson('{}')).not.toThrow();
  });
});

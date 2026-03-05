import { describe, it, expect } from 'vitest';
import { highlightJson } from './jsonHighlight';

describe('highlightJson', () => {
  it('wraps keys in text-blue-400 span', () => {
    const result = highlightJson('{"key": "value"}');
    expect(result).toContain('class="text-blue-400"');
    expect(result).toContain('"key":');
  });

  it('wraps string values in text-green-400 span', () => {
    const result = highlightJson('{"key": "value"}');
    expect(result).toContain('class="text-green-400"');
    expect(result).toContain('"value"');
  });

  it('wraps booleans in text-amber-400 span', () => {
    const result = highlightJson('{"flag": true}');
    expect(result).toContain('class="text-amber-400"');
    expect(result).toContain('>true<');
  });

  it('wraps null in text-amber-400 span', () => {
    const result = highlightJson('{"field": null}');
    expect(result).toContain('class="text-amber-400"');
    expect(result).toContain('>null<');
  });

  it('wraps numbers in text-violet-400 span', () => {
    const result = highlightJson('{"count": 42}');
    expect(result).toContain('class="text-violet-400"');
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

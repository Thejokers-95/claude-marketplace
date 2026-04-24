import { describe, it, expect } from 'vitest';
import { escapeHtml, renderSimpleVars, renderConditionals, renderLoops, renderTemplate } from './render.js';

describe('escapeHtml', () => {
  it('escapes <, >, &, quotes', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles numbers', () => {
    expect(escapeHtml(42)).toBe('42');
  });

  it('handles undefined/null as empty', () => {
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
  });
});

describe('renderSimpleVars', () => {
  it('substitutes {{key}} with escaped value', () => {
    const tpl = 'Hello {{name}}!';
    expect(renderSimpleVars(tpl, { name: 'Fred' })).toBe('Hello Fred!');
  });

  it('escapes HTML by default', () => {
    const tpl = 'Hi {{name}}';
    expect(renderSimpleVars(tpl, { name: '<b>x</b>' })).toBe('Hi &lt;b&gt;x&lt;/b&gt;');
  });

  it('{{{raw}}} injects unescaped', () => {
    const tpl = 'Svg: {{{icon}}}';
    expect(renderSimpleVars(tpl, { icon: '<svg/>' })).toBe('Svg: <svg/>');
  });

  it('supports nested keys via dot notation', () => {
    const tpl = 'Value: {{bloc1.clicks}}';
    expect(renderSimpleVars(tpl, { bloc1: { clicks: 100 } })).toBe('Value: 100');
  });

  it('leaves unresolved placeholders as empty', () => {
    const tpl = '{{missing}}';
    expect(renderSimpleVars(tpl, {})).toBe('');
  });
});

describe('renderConditionals', () => {
  it('keeps block if condition truthy', () => {
    const tpl = 'pre{{#if show}}HELLO{{/if}}post';
    expect(renderConditionals(tpl, { show: true })).toBe('preHELLOpost');
  });

  it('removes block if condition falsy', () => {
    const tpl = 'pre{{#if show}}HELLO{{/if}}post';
    expect(renderConditionals(tpl, { show: false })).toBe('prepost');
  });

  it('handles nested object condition', () => {
    const tpl = '{{#if flags.enabled}}ON{{/if}}';
    expect(renderConditionals(tpl, { flags: { enabled: 1 } })).toBe('ON');
  });

  it('handles missing key as falsy', () => {
    const tpl = '{{#if missing}}X{{/if}}';
    expect(renderConditionals(tpl, {})).toBe('');
  });

  it('handles empty array as falsy', () => {
    const tpl = '{{#if items}}X{{/if}}';
    expect(renderConditionals(tpl, { items: [] })).toBe('');
  });
});

describe('renderLoops', () => {
  it('iterates array with {{this.field}} resolution', () => {
    const tpl = '{{#each items}}<li>{{this.name}}: {{this.value}}</li>{{/each}}';
    const data = { items: [{ name: 'a', value: 1 }, { name: 'b', value: 2 }] };
    expect(renderLoops(tpl, data)).toBe('<li>a: 1</li><li>b: 2</li>');
  });

  it('supports @index', () => {
    const tpl = '{{#each items}}{{@index}}:{{this}}|{{/each}}';
    const data = { items: ['x', 'y'] };
    expect(renderLoops(tpl, data)).toBe('0:x|1:y|');
  });

  it('produces empty when array empty', () => {
    const tpl = 'A{{#each items}}X{{/each}}B';
    expect(renderLoops(tpl, { items: [] })).toBe('AB');
  });

  it('produces empty when array missing', () => {
    const tpl = 'A{{#each items}}X{{/each}}B';
    expect(renderLoops(tpl, {})).toBe('AB');
  });
});

describe('renderTemplate (orchestrator)', () => {
  it('processes loops, conditionals, and vars in correct order', () => {
    const tpl = `
<h1>{{title}}</h1>
{{#if show_items}}
<ul>
{{#each items}}<li>{{this.name}}</li>{{/each}}
</ul>
{{/if}}
`;
    const data = {
      title: 'Test',
      show_items: true,
      items: [{ name: 'a' }, { name: 'b' }],
    };
    const out = renderTemplate(tpl, data);
    expect(out).toContain('<h1>Test</h1>');
    expect(out).toContain('<li>a</li>');
    expect(out).toContain('<li>b</li>');
  });

  it('hides section when condition false', () => {
    const tpl = '{{#if show}}<div>X</div>{{/if}}';
    expect(renderTemplate(tpl, { show: false })).toBe('');
  });
});

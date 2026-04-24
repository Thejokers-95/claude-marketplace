/**
 * HTML Dashboard Renderer.
 * Supports simple variable substitution, {{{raw}}}, {{#if}}, {{#each}}.
 * See SKILL.md for full syntax.
 */

export function escapeHtml(v) {
  if (v === undefined || v === null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveKey(data, key) {
  const parts = key.split('.');
  let v = data;
  for (const p of parts) {
    if (v == null) return undefined;
    v = v[p];
  }
  return v;
}

export function renderSimpleVars(template, data) {
  // Raw first: {{{key}}} before {{key}}
  let result = template.replace(/\{\{\{([^}]+)\}\}\}/g, (_, key) => {
    const v = resolveKey(data, key.trim());
    return v === undefined ? '' : String(v);
  });
  result = result.replace(/\{\{([^}#/!][^}]*)\}\}/g, (_, key) => {
    const v = resolveKey(data, key.trim());
    return escapeHtml(v);
  });
  return result;
}

export function renderConditionals(template, data) {
  return template.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, block) => {
    const v = resolveKey(data, key.trim());
    const truthy = Array.isArray(v) ? v.length > 0 : !!v;
    return truthy ? block : '';
  });
}

export function renderLoops(template, data) {
  return template.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, key, block) => {
    const arr = resolveKey(data, key.trim());
    if (!Array.isArray(arr)) return '';
    return arr.map((item, idx) => {
      // Inside each, {{this.x}} refers to item.x, {{this}} refers to item
      let rendered = block.replace(/\{\{@index\}\}/g, String(idx));
      rendered = rendered.replace(/\{\{\{this\.([^}]+)\}\}\}/g, (_, f) => {
        const v = resolveKey(item, f.trim());
        return v === undefined ? '' : String(v);
      });
      rendered = rendered.replace(/\{\{this\.([^}]+)\}\}/g, (_, f) => {
        const v = resolveKey(item, f.trim());
        return escapeHtml(v);
      });
      rendered = rendered.replace(/\{\{\{this\}\}\}/g, () => (item === undefined ? '' : String(item)));
      rendered = rendered.replace(/\{\{this\}\}/g, () => escapeHtml(item));
      return rendered;
    }).join('');
  });
}

export function renderTemplate(template, data) {
  // Order matters: loops (can contain conditionals), then conditionals (can contain vars), then vars.
  let result = renderLoops(template, data);
  result = renderConditionals(result, data);
  result = renderSimpleVars(result, data);
  return result;
}

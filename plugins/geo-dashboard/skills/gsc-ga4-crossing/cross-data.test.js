import { describe, it, expect } from 'vitest';
import { normalizeUrl } from './cross-data.js';
import { aggregateClicksByUrl } from './cross-data.js';
import { computeQueryWeights } from './cross-data.js';
import { attributeConversions } from './cross-data.js';
import { applyMinClicksThreshold } from './cross-data.js';
import { crossData } from './cross-data.js';

describe('normalizeUrl', () => {
  it('strips protocol and domain, keeps path', () => {
    expect(normalizeUrl('https://example.com/blog/post')).toBe('/blog/post');
  });

  it('strips trailing slash', () => {
    expect(normalizeUrl('https://example.com/blog/')).toBe('/blog');
  });

  it('keeps root slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('/');
  });

  it('handles already-normalized path', () => {
    expect(normalizeUrl('/blog/post')).toBe('/blog/post');
  });

  it('strips query string', () => {
    expect(normalizeUrl('https://example.com/blog?utm=foo')).toBe('/blog');
  });

  it('strips fragment', () => {
    expect(normalizeUrl('https://example.com/blog#section')).toBe('/blog');
  });
});

describe('aggregateClicksByUrl', () => {
  it('groups clicks by normalized URL', () => {
    const rows = [
      { query: 'a', page: 'https://ex.com/blog', clicks: 100 },
      { query: 'b', page: 'https://ex.com/blog', clicks: 50 },
      { query: 'c', page: 'https://ex.com/home', clicks: 20 },
    ];
    const result = aggregateClicksByUrl(rows);
    expect(result['/blog']).toBe(150);
    expect(result['/home']).toBe(20);
  });

  it('returns empty object for empty input', () => {
    expect(aggregateClicksByUrl([])).toEqual({});
  });
});

describe('computeQueryWeights', () => {
  it('computes per-query weight within a URL', () => {
    const rows = [
      { query: 'a', page: 'https://ex.com/blog', clicks: 100 },
      { query: 'b', page: 'https://ex.com/blog', clicks: 50 },
    ];
    const result = computeQueryWeights(rows);
    // For /blog, query 'a' weight = 100/150 = 0.6667
    expect(result['/blog']['a']).toBeCloseTo(0.6667, 3);
    expect(result['/blog']['b']).toBeCloseTo(0.3333, 3);
  });

  it('handles single-query URL (weight=1)', () => {
    const rows = [
      { query: 'solo', page: 'https://ex.com/page', clicks: 10 },
    ];
    const result = computeQueryWeights(rows);
    expect(result['/page']['solo']).toBe(1);
  });
});

describe('attributeConversions', () => {
  it('distributes URL conversions proportionally to keyword weights', () => {
    const gscRows = [
      { query: 'a', page: 'https://ex.com/blog', clicks: 100 },
      { query: 'b', page: 'https://ex.com/blog', clicks: 50 },
    ];
    const ga4Rows = [
      { page_path: '/blog', conversions: 15 },
    ];
    const result = attributeConversions(gscRows, ga4Rows);
    // /blog total=150, weight a=0.6667 b=0.3333
    // 15 conversions attributed: a=10, b=5
    expect(result['a']).toBeCloseTo(10, 1);
    expect(result['b']).toBeCloseTo(5, 1);
  });

  it('ignores GSC URLs without matching GA4 data', () => {
    const gscRows = [
      { query: 'x', page: 'https://ex.com/missing', clicks: 10 },
    ];
    const ga4Rows = [];
    const result = attributeConversions(gscRows, ga4Rows);
    expect(result['x']).toBeUndefined();
  });

  it('aggregates same query across multiple URLs', () => {
    const gscRows = [
      { query: 'shared', page: 'https://ex.com/p1', clicks: 50 },
      { query: 'shared', page: 'https://ex.com/p2', clicks: 30 },
    ];
    const ga4Rows = [
      { page_path: '/p1', conversions: 10 },
      { page_path: '/p2', conversions: 6 },
    ];
    const result = attributeConversions(gscRows, ga4Rows);
    // p1: 50 clicks, weight=1, attributed=10
    // p2: 30 clicks, weight=1, attributed=6
    // Total for 'shared': 16
    expect(result['shared']).toBeCloseTo(16, 1);
  });
});

describe('applyMinClicksThreshold', () => {
  it('excludes URLs below threshold', () => {
    const gscRows = [
      { query: 'a', page: 'https://ex.com/big', clicks: 100 },
      { query: 'b', page: 'https://ex.com/small', clicks: 5 },
    ];
    const result = applyMinClicksThreshold(gscRows, 10);
    expect(result.filtered.length).toBe(1);
    expect(result.filtered[0].page).toContain('big');
    expect(result.excluded_urls).toContain('/small');
  });

  it('keeps all if all above threshold', () => {
    const gscRows = [
      { query: 'a', page: 'https://ex.com/p1', clicks: 20 },
    ];
    const result = applyMinClicksThreshold(gscRows, 10);
    expect(result.filtered.length).toBe(1);
    expect(result.excluded_urls).toHaveLength(0);
  });
});

describe('crossData (orchestrator)', () => {
  it('returns structured output matching SKILL.md spec', () => {
    const gscData = [
      { query: 'agent ia', page: 'https://ex.com/blog/agent-ia', clicks: 100, impressions: 2000, position: 5 },
      { query: 'plugin claude', page: 'https://ex.com/blog/agent-ia', clicks: 50, impressions: 1500, position: 7 },
      { query: 'agent ia', page: 'https://ex.com/home', clicks: 20, impressions: 500, position: 12 },
    ];
    const ga4Data = [
      { page_path: '/blog/agent-ia', sessions: 150, conversions: 6 },
      { page_path: '/home', sessions: 20, conversions: 1 },
    ];
    const thresholds = { min_clicks_for_conversion_crossing: 10, min_days_for_crossing: 30 };
    const periodDays = 30;

    const result = crossData({ gscData, ga4Data, thresholds, periodDays, topN: 5 });

    expect(result.period_days).toBe(30);
    expect(result.top_queries).toBeDefined();
    expect(Array.isArray(result.top_queries)).toBe(true);
    expect(result.top_queries.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain('probabiliste');

    const agentIa = result.top_queries.find(q => q.query === 'agent ia');
    expect(agentIa).toBeDefined();
    expect(agentIa.attributed_conversions).toBeGreaterThan(0);
  });

  it('excludes queries whose URLs are all below threshold', () => {
    const gscData = [
      { query: 'rare', page: 'https://ex.com/p', clicks: 3 },
    ];
    const ga4Data = [
      { page_path: '/p', conversions: 1 },
    ];
    const result = crossData({ gscData, ga4Data, thresholds: { min_clicks_for_conversion_crossing: 10 }, periodDays: 30, topN: 5 });
    expect(result.top_queries.find(q => q.query === 'rare')).toBeUndefined();
  });
});

import { describe, it, expect } from 'vitest';
import { classifySession, ENGINE_PATTERNS, aggregateByTag, computeShares, detectLlmTraffic } from './detect-llm.js';

describe('classifySession', () => {
  it('classifies ChatGPT referrer as llm:ChatGPT', () => {
    expect(classifySession({ referrer_host: 'chatgpt.com' })).toBe('llm:ChatGPT');
  });

  it('classifies Perplexity', () => {
    expect(classifySession({ referrer_host: 'www.perplexity.ai' })).toBe('llm:Perplexity');
  });

  it('classifies Gemini', () => {
    expect(classifySession({ referrer_host: 'gemini.google.com' })).toBe('llm:Gemini');
  });

  it('classifies Google organic as seo:organic', () => {
    expect(classifySession({ source: 'google', medium: 'organic', referrer_host: 'google.com' })).toBe('seo:organic');
  });

  it('classifies unknown as other', () => {
    expect(classifySession({ source: 'facebook', medium: 'social', referrer_host: 'facebook.com' })).toBe('other');
  });

  it('classifies direct traffic as other', () => {
    expect(classifySession({ source: '(direct)', medium: '(none)' })).toBe('other');
  });

  it('catches new .ai subdomain as Other LLM', () => {
    expect(classifySession({ referrer_host: 'newchatbot.ai' })).toBe('llm:Other LLM');
  });
});

describe('ENGINE_PATTERNS', () => {
  it('has at least 7 engines defined', () => {
    expect(Object.keys(ENGINE_PATTERNS).length).toBeGreaterThanOrEqual(7);
  });
});

describe('aggregateByTag', () => {
  it('sums sessions and weighted metrics per tag', () => {
    const sessions = [
      { source: 'chatgpt.com', referrer_host: 'chatgpt.com', sessions: 100, bounce_rate: 40, pages_per_session: 3, avg_session_duration: 120, conversions: 5 },
      { source: 'perplexity.ai', referrer_host: 'perplexity.ai', sessions: 50, bounce_rate: 35, pages_per_session: 4, avg_session_duration: 150, conversions: 3 },
      { source: 'google', medium: 'organic', referrer_host: 'google.com', sessions: 1000, bounce_rate: 60, pages_per_session: 2, avg_session_duration: 80, conversions: 20 },
    ];
    const result = aggregateByTag(sessions);
    expect(result['llm:ChatGPT'].sessions).toBe(100);
    expect(result['llm:Perplexity'].sessions).toBe(50);
    expect(result['seo:organic'].sessions).toBe(1000);
    expect(result['seo:organic'].conversions).toBe(20);
  });
});

describe('computeShares', () => {
  it('computes LLM share as % of total', () => {
    const aggregated = {
      'llm:ChatGPT': { sessions: 100 },
      'llm:Perplexity': { sessions: 50 },
      'seo:organic': { sessions: 1000 },
      'other': { sessions: 200 },
    };
    const result = computeShares(aggregated);
    expect(result.total_sessions).toBe(1350);
    expect(result.llm_total).toBe(150);
    expect(result.llm_share_pct).toBeCloseTo(11.1, 1);
    expect(result.seo_share_pct).toBeCloseTo(74.1, 1);
  });

  it('returns 0 shares when no sessions', () => {
    const result = computeShares({});
    expect(result.total_sessions).toBe(0);
    expect(result.llm_share_pct).toBe(0);
  });
});

describe('detectLlmTraffic', () => {
  it('produces full output structure with engines array and behavior_comparison', () => {
    const sessions = [
      { referrer_host: 'chatgpt.com', sessions: 670, bounce_rate: 35, pages_per_session: 4.5, avg_session_duration: 240, conversions: 35 },
      { referrer_host: 'perplexity.ai', sessions: 194, bounce_rate: 40, pages_per_session: 3.5, avg_session_duration: 200, conversions: 10 },
      { source: 'google', medium: 'organic', referrer_host: 'google.com', sessions: 12847, bounce_rate: 52, pages_per_session: 2.4, avg_session_duration: 92, conversions: 360 },
    ];
    const result = detectLlmTraffic({ ga4Sessions: sessions, periodDays: 30 });

    expect(result.period_days).toBe(30);
    expect(result.total_sessions).toBe(13711);
    expect(result.llm_total_sessions).toBe(864);
    expect(Array.isArray(result.engines)).toBe(true);
    expect(result.engines.length).toBeGreaterThan(0);
    expect(result.engines[0].name).toBe('ChatGPT');
    expect(result.engines[0].share_pct).toBeCloseTo(77.5, 0);
    expect(result.behavior_comparison.seo_organic).toBeDefined();
    expect(result.behavior_comparison.llm).toBeDefined();
    expect(result.disclaimer).toContain('plancher');
  });
});

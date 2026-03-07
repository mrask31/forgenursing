import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../src/lib/ai/system-prompt';

describe('buildSystemPrompt', () => {
  it('LPN + tutor mode contains NCLEX-PN and Full Socratic engagement', () => {
    const prompt = buildSystemPrompt('LPN', 'tutor');
    
    expect(prompt).toContain('NCLEX-PN');
    expect(prompt).toContain('Full Socratic engagement');
  });

  it('MSN + strict mode contains DNP-level and commit to an answer', () => {
    const prompt = buildSystemPrompt('MSN', 'strict');
    
    expect(prompt).toContain('DNP-level');
    expect(prompt).toContain('commit to an answer');
  });

  it('BSN + notes mode contains uploaded materials ONLY', () => {
    const prompt = buildSystemPrompt('BSN', 'notes');
    
    expect(prompt).toContain('uploaded materials ONLY');
  });

  it('all outputs contain ADPIE framework and all 6 response format sections', () => {
    const prompts = [
      buildSystemPrompt('LPN', 'tutor'),
      buildSystemPrompt('ADN', 'strict'),
      buildSystemPrompt('BSN', 'notes'),
      buildSystemPrompt('MSN', 'topic'),
    ];

    prompts.forEach((prompt) => {
      // Check for ADPIE framework
      expect(prompt).toContain('ADPIE Nursing Process');
      expect(prompt).toContain('Assessment → Diagnosis → Planning → Implementation → Evaluation');

      // Check for all 6 response format sections
      expect(prompt).toContain('1. ORIENT');
      expect(prompt).toContain('2. THE MAP');
      expect(prompt).toContain('3. REASONING');
      expect(prompt).toContain('4. TRAP');
      expect(prompt).toContain('5. YOUR MATERIALS');
      expect(prompt).toContain('6. CHECK');
    });
  });
});

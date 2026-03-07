import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildMessageHistory } from '../src/lib/ai/history-manager';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn((model: string) => ({ model })),
}));

import { generateText } from 'ai';

describe('buildMessageHistory', () => {
  let mockSupabaseClient: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Supabase client (not used in current implementation but required by signature)
    mockSupabaseClient = {} as SupabaseClient;
  });

  it('returns all messages unchanged when array has 8 messages (4 pairs)', async () => {
    const messages = [
      { role: 'user' as const, content: 'What is heart failure?' },
      { role: 'assistant' as const, content: 'Heart failure is...' },
      { role: 'user' as const, content: 'What are the symptoms?' },
      { role: 'assistant' as const, content: 'Common symptoms include...' },
      { role: 'user' as const, content: 'How is it treated?' },
      { role: 'assistant' as const, content: 'Treatment includes...' },
      { role: 'user' as const, content: 'What medications are used?' },
      { role: 'assistant' as const, content: 'Common medications are...' },
    ];

    const result = await buildMessageHistory(messages, mockSupabaseClient);

    expect(result).toEqual(messages);
    expect(result.length).toBe(8);
    expect(generateText).not.toHaveBeenCalled();
  });

  it('returns 11 messages (1 summary + 10 recent) when array has 14 messages (7 pairs)', async () => {
    const messages = [
      { role: 'user' as const, content: 'What is heart failure?' },
      { role: 'assistant' as const, content: 'Heart failure is...' },
      { role: 'user' as const, content: 'What are the symptoms?' },
      { role: 'assistant' as const, content: 'Common symptoms include...' },
      { role: 'user' as const, content: 'How is it treated?' },
      { role: 'assistant' as const, content: 'Treatment includes...' },
      { role: 'user' as const, content: 'What medications are used?' },
      { role: 'assistant' as const, content: 'Common medications are...' },
      { role: 'user' as const, content: 'What are side effects?' },
      { role: 'assistant' as const, content: 'Side effects include...' },
      { role: 'user' as const, content: 'What about diet?' },
      { role: 'assistant' as const, content: 'Diet recommendations...' },
      { role: 'user' as const, content: 'Any exercise restrictions?' },
      { role: 'assistant' as const, content: 'Exercise guidelines...' },
    ];

    // Mock the Haiku API response
    (generateText as any).mockResolvedValue({
      text: 'Student studied heart failure, covering symptoms, treatments, and medications. Discussed side effects and moved to lifestyle modifications.',
    });

    const result = await buildMessageHistory(messages, mockSupabaseClient);

    expect(result.length).toBe(11); // 1 summary + 10 recent
    expect(result[0].role).toBe('user');
    expect(result[0].content).toContain('[Session Summary]:');
    expect(result[0].content).toContain('heart failure');
    
    // Verify last 10 messages are preserved
    expect(result.slice(1)).toEqual(messages.slice(-10));
    
    // Verify generateText was called
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it('returns full history if summarization fails (fail-open)', async () => {
    const messages = Array.from({ length: 14 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Message ${i + 1}`,
    }));

    // Mock API failure
    (generateText as any).mockRejectedValue(new Error('API error'));

    const result = await buildMessageHistory(messages, mockSupabaseClient);

    expect(result).toEqual(messages);
    expect(result.length).toBe(14);
  });
});

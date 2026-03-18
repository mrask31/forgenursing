import { NextRequest } from 'next/server';
import { stripMarkdown, truncateForTTS } from '@/lib/tts-utils';

export const maxDuration = 30;

const VOICE_IDS: Record<string, string> = {
  forge: 'dkgmw0OA1OcdgloYE1O0',
  patient: '6cZCb8earrlp5MtZ4MXP',
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ElevenLabs API key is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { text?: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { text, voice = 'forge' } = body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const voiceId = VOICE_IDS[voice] || VOICE_IDS.forge;

  // Strip markdown first, then truncate
  const cleanText = truncateForTTS(stripMarkdown(text));

  if (cleanText.length === 0) {
    return new Response(JSON.stringify({ error: 'No speakable text after processing' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[TTS] ElevenLabs error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Text-to-speech generation failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream the audio response back
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('[TTS] Error:', error?.message);
    return new Response(JSON.stringify({ error: 'Text-to-speech service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

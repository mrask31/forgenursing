'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Volume2, Loader2, Square, AlertCircle } from 'lucide-react'

type PlayerState = 'idle' | 'loading' | 'playing' | 'error'

interface ForgeAudioPlayerProps {
  text: string
  autoPlay?: boolean
}

export default function ForgeAudioPlayer({ text, autoPlay = false }: ForgeAudioPlayerProps) {
  const [state, setState] = useState<PlayerState>('idle')
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
      } catch {
        // Already stopped
      }
      sourceNodeRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setState('idle')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback()
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [stopPlayback])

  const play = useCallback(async () => {
    if (state === 'loading') return
    if (state === 'playing') {
      stopPlayback()
      return
    }

    setState('loading')
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'forge' }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('TTS request failed')
      }

      const arrayBuffer = await response.arrayBuffer()

      // Create or reuse AudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }

      // Resume if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      const sourceNode = audioContextRef.current.createBufferSource()
      sourceNode.buffer = audioBuffer
      sourceNode.connect(audioContextRef.current.destination)

      sourceNode.onended = () => {
        sourceNodeRef.current = null
        setState('idle')
      }

      sourceNodeRef.current = sourceNode
      sourceNode.start()
      setState('playing')
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setState('idle')
        return
      }
      console.error('[ForgeAudioPlayer] Error:', error)
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }, [text, state, stopPlayback])

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && state === 'idle') {
      play()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className="w-3.5 h-3.5 animate-spin" />
      case 'playing':
        return <Square className="w-3 h-3" />
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5" />
      default:
        return <Volume2 className="w-3.5 h-3.5" />
    }
  }

  const getTitle = () => {
    switch (state) {
      case 'loading': return 'Loading audio...'
      case 'playing': return 'Stop playback'
      case 'error': return 'Audio failed — try again'
      default: return 'Listen to response'
    }
  }

  return (
    <button
      onClick={play}
      disabled={state === 'loading'}
      title={getTitle()}
      className={`
        inline-flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200
        ${state === 'playing'
          ? 'bg-[#0D8F9C] text-white'
          : state === 'error'
            ? 'bg-red-50 text-red-500 hover:bg-red-100'
            : 'text-[#94A3B8] hover:text-[#0D8F9C] hover:bg-[#E0F4F6]'
        }
        disabled:cursor-wait
      `}
      aria-label={getTitle()}
    >
      {getIcon()}
    </button>
  )
}

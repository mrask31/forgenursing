/**
 * Strip markdown formatting from text for clean TTS output.
 */
export function stripMarkdown(text: string): string {
  return text
    // Remove headers (# ## ### etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove blockquotes
    .replace(/^>\s?/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove link syntax, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove image syntax
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove list markers (-, *, numbered)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove emoji shortcodes (common pattern)
    .replace(/:[a-z_]+:/g, '')
    // Remove UI formatting labels (not meant to be spoken)
    .replace(/\b(ORIENT|THE MAP|REASONING|TRAP|CHECK|YOUR MATERIALS|CONTINUE LEARNING)\s*:/gi, '')
    // Remove ASCII art / structured text boxes (lines with arrows, box-drawing chars, heavy bracket/pipe structure)
    .replace(/^.*[→←↓↑│├└┌┐┘┤┬┴┼╔╗╚╝║═]+.*$/gm, '')
    // Remove lines that are mostly brackets, pipes, dashes (ASCII diagrams)
    .replace(/^[\s]*[|+\-[\]]{3,}[\s|+\-[\]]*$/gm, '')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim()
}

/**
 * Truncate text for TTS to stay within character limits.
 * Tries to break at sentence boundaries.
 */
export function truncateForTTS(text: string, maxChars: number = 2000): string {
  if (text.length <= maxChars) return text

  // Try to break at last sentence boundary before limit
  const truncated = text.slice(0, maxChars)
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('?\n'),
    truncated.lastIndexOf('!\n'),
  )

  if (lastSentenceEnd > maxChars * 0.5) {
    return truncated.slice(0, lastSentenceEnd + 1).trim()
  }

  return truncated.trim()
}

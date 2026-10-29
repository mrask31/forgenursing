export default function TutorEmptyState({ activeChunkCount }: { activeChunkCount: number; hasSeenOnboarding?: boolean }) {
  if (activeChunkCount > 0) return null
  return <div className="p-6 text-center text-slate-600">Ask about a missed answer, a clinical cue, or a concept you want to revisit.</div>
}

// In-memory session usage counters (resets on server restart, fine for MVP)
interface UsageCounters {
  groqRequests: number;       // STT calls
  geminiRequests: number;     // LLM calls
  elevenlabsChars: number;    // TTS characters sent
  turnCount: number;
}

const counters: UsageCounters = {
  groqRequests: 0,
  geminiRequests: 0,
  elevenlabsChars: 0,
  turnCount: 0,
};

export function incrementGroq() { counters.groqRequests++; }
export function incrementGemini() { counters.geminiRequests++; }
export function incrementElevenLabs(chars: number) { counters.elevenlabsChars += chars; }
export function incrementTurns() { counters.turnCount++; }
export function getUsage() { return { ...counters }; }
export function resetUsage() {
  counters.groqRequests = 0;
  counters.geminiRequests = 0;
  counters.elevenlabsChars = 0;
  counters.turnCount = 0;
}

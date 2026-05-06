// ============================================================
// Conversational Learning Companion Service
// Adaptive AI tutor that adjusts communication style,
// supports voice-first interaction, and simplifies language
// for beginners.
// ============================================================

import {
  CompanionMessage,
  CompanionSession,
  CommunicationStyle,
  ExplanationStyle,
  LearningTwinState,
} from '../../../shared/types';
import { store } from '../store/inMemoryStore';
import { v4 as uuidv4 } from 'uuid';

// ── Response templates by style ──────────────────────────────

const STYLE_PROMPTS: Record<CommunicationStyle, string> = {
  beginner: 'Use very simple words. Short sentences. One idea at a time. Be encouraging.',
  intermediate: 'Use clear language. Explain concepts with examples. Be friendly and supportive.',
  advanced: 'Use precise technical language. Assume prior knowledge. Be concise and thorough.',
};

// ── Companion response generator ─────────────────────────────

/**
 * Generates a companion response adapted to the user's
 * communication style and current learning context.
 *
 * In production, this would call an LLM API (OpenAI, Bedrock, etc.)
 * Here we use a rule-based engine that demonstrates the adaptation logic.
 */
export function generateCompanionResponse(
  userMessage: string,
  session: CompanionSession,
  twin: LearningTwinState | null
): string {
  const style = session.currentStyle;
  const topic = session.topic || 'this topic';

  // Detect question type
  const isQuestion = userMessage.includes('?') ||
    /^(what|how|why|when|where|who|can|is|are|do|does)/i.test(userMessage);
  const isStruggling = /don't understand|confused|hard|difficult|help|stuck/i.test(userMessage);
  const isPositive = /got it|understand|makes sense|clear|thanks|great/i.test(userMessage);

  let response = '';

  if (isStruggling) {
    response = buildStrugglingResponse(style, topic, twin);
  } else if (isPositive) {
    response = buildPositiveResponse(style, topic);
  } else if (isQuestion) {
    response = buildQuestionResponse(userMessage, style, topic);
  } else {
    response = buildGeneralResponse(userMessage, style, topic);
  }

  return response;
}

function buildStrugglingResponse(
  style: CommunicationStyle,
  topic: string,
  twin: LearningTwinState | null
): string {
  const weakAreas = twin?.predictedWeakAreas || [];

  if (style === 'beginner') {
    return `That's okay! ${topic} can be tricky at first. Let's slow down and try again together. 

Here's the simplest way to think about it:
• Break it into tiny pieces
• Focus on just one part at a time
• Ask me anything — there are no silly questions!

Which part is confusing you most?`;
  }

  if (style === 'intermediate') {
    return `No worries — ${topic} trips up a lot of people. Let me try a different approach.

${weakAreas.length > 0 ? `I've noticed you've had some difficulty with ${weakAreas.slice(0, 2).join(' and ')} before, so let's connect those ideas.` : ''}

Would you like me to:
1. Explain it with a real-world example?
2. Walk through it step by step?
3. Show you a diagram?`;
  }

  return `Let's revisit ${topic} from a different angle. Sometimes a fresh perspective clarifies things.

${weakAreas.length > 0 ? `Given your history with ${weakAreas[0]}, I'd suggest we approach this through that lens.` : ''}

What specific aspect is unclear?`;
}

function buildPositiveResponse(style: CommunicationStyle, topic: string): string {
  if (style === 'beginner') {
    return `Amazing! You're doing so well! 🌟 

You just understood ${topic}. That's a big deal! 

Ready for the next step? Or would you like to practice this a bit more?`;
  }

  if (style === 'intermediate') {
    return `Great work! You've got a solid grasp of ${topic}.

Want to test your understanding with a quick challenge, or shall we move on to the next concept?`;
  }

  return `Good. You've internalized ${topic} correctly. 

The next logical step would be to apply this to more complex scenarios. Shall we proceed?`;
}

function buildQuestionResponse(
  question: string,
  style: CommunicationStyle,
  topic: string
): string {
  if (style === 'beginner') {
    return `Great question! Let me explain in a simple way.

Think of ${topic} like this: imagine you have a box of building blocks...

Each block is one small idea. When you put them together, you get the big picture.

Does that help? Want me to give you an example from real life?`;
  }

  if (style === 'intermediate') {
    return `Good question about ${topic}. Here's how I'd explain it:

The key idea is that ${topic} works by connecting related concepts together. 

For example, in everyday life you can see this when...

Does that answer your question, or would you like me to go deeper?`;
  }

  return `Regarding your question about ${topic}:

The underlying principle here involves the relationship between core concepts and their applications. 

The nuance you're picking up on is actually a common point of confusion — the distinction lies in...

Want me to elaborate on any specific aspect?`;
}

function buildGeneralResponse(
  message: string,
  style: CommunicationStyle,
  topic: string
): string {
  if (style === 'beginner') {
    return `I hear you! Let's keep going with ${topic}.

Remember: we're learning together, one step at a time. You're doing great!

What would you like to explore next?`;
  }

  if (style === 'intermediate') {
    return `Thanks for sharing that. As we continue with ${topic}, keep in mind the connections we've been building.

Is there a specific direction you'd like to take this?`;
  }

  return `Noted. Continuing with ${topic} — the next logical progression would be to examine the implications of what we've covered.

Shall we proceed with that analysis?`;
}

// ── Style adaptation ─────────────────────────────────────────

/**
 * Detects if the communication style should be adjusted based
 * on the user's messages and twin state.
 */
export function adaptCommunicationStyle(
  session: CompanionSession,
  twin: LearningTwinState | null
): CommunicationStyle {
  if (!twin) return session.currentStyle;

  // If understanding is very low, simplify
  if (twin.understandingScore < 35) return 'beginner';

  // If understanding is high, can use advanced
  if (twin.understandingScore > 80) return 'advanced';

  return 'intermediate';
}

// ── Session management ───────────────────────────────────────

export function addMessageToSession(
  sessionId: string,
  role: 'user' | 'companion',
  content: string,
  style: ExplanationStyle = 'step-by-step'
): CompanionMessage | null {
  const session = store.getCompanionSession(sessionId);
  if (!session) return null;

  const message: CompanionMessage = {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date().toISOString(),
    format: session.voiceEnabled ? 'audio' : 'text',
    style,
  };

  const updatedMessages = [...session.messages, message];
  store.updateCompanionSession(sessionId, { messages: updatedMessages });

  return message;
}

// ── Voice-first support ──────────────────────────────────────

/**
 * Prepares a companion message for voice output.
 * Strips markdown, adds natural pauses.
 */
export function prepareForVoice(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/•/g, ',')
    .replace(/\d+\.\s/g, ', ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .trim();
}

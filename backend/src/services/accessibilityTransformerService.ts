// ============================================================
// One-Click Accessibility Transformer Service
// Converts any content into audio, simplified text, or visual
// diagrams in real time.
// ============================================================

import {
  ContentItem,
  TransformedContent,
  AudioContent,
  SimplifiedContent,
  VisualContent,
  DiagramNode,
  DiagramEdge,
  ContentFormat,
} from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

// ── Audio Transformer ────────────────────────────────────────

/**
 * Converts content body to SSML-ready text for TTS engines.
 * Adds pauses, emphasis, and appropriate pacing.
 */
export function transformToAudio(content: ContentItem, voiceStyle: AudioContent['voiceStyle'] = 'calm'): AudioContent {
  // Strip markdown-like syntax
  const cleanText = content.body
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();

  // Build SSML with appropriate pacing
  const rate = voiceStyle === 'slow' ? 'slow' : voiceStyle === 'calm' ? 'medium' : 'fast';
  const ssml = `<speak>
  <prosody rate="${rate}" pitch="medium">
    <p>${content.title}.</p>
    <break time="500ms"/>
    <p>${cleanText}</p>
  </prosody>
</speak>`;

  // Estimate duration: ~130 words per minute for slow, ~160 for medium
  const wordCount = cleanText.split(/\s+/).length;
  const wpm = voiceStyle === 'slow' ? 110 : voiceStyle === 'calm' ? 140 : 170;
  const durationEstimate = Math.ceil((wordCount / wpm) * 60);

  return {
    text: ssml,
    durationEstimate,
    voiceStyle,
  };
}

// ── Simplified Text Transformer ──────────────────────────────

/**
 * Simplifies content to a target reading level.
 * Uses sentence shortening, vocabulary simplification, and
 * key-point extraction.
 */
export function transformToSimplified(
  content: ContentItem,
  readingLevel: SimplifiedContent['readingLevel'] = 'grade-5'
): SimplifiedContent {
  const sentences = content.body
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Simplify based on reading level
  const maxSentenceLength = readingLevel === 'grade-3' ? 8 : readingLevel === 'grade-5' ? 12 : 18;

  const simplified = sentences
    .map(sentence => {
      const words = sentence.split(/\s+/);
      if (words.length <= maxSentenceLength) return sentence;
      // Truncate long sentences at a natural break
      return words.slice(0, maxSentenceLength).join(' ') + '...';
    })
    .join('. ');

  // Extract key points (sentences with important signal words)
  const signalWords = ['important', 'key', 'main', 'first', 'second', 'finally', 'because', 'therefore', 'means'];
  const keyPoints = sentences
    .filter(s => signalWords.some(w => s.toLowerCase().includes(w)))
    .slice(0, 5);

  // If no signal-word sentences found, take first 3 sentences
  const finalKeyPoints = keyPoints.length > 0
    ? keyPoints
    : sentences.slice(0, 3);

  return {
    text: simplified,
    readingLevel,
    keyPoints: finalKeyPoints,
  };
}

// ── Visual Diagram Transformer ───────────────────────────────

/**
 * Converts content into a structured diagram representation.
 * The frontend renders this as a flowchart, mindmap, etc.
 */
export function transformToVisual(content: ContentItem): VisualContent {
  const sentences = content.body
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, 8); // limit nodes for clarity

  const nodes: DiagramNode[] = [
    {
      id: 'root',
      label: content.title,
      type: 'concept',
    },
  ];

  const edges: DiagramEdge[] = [];

  // Create concept nodes from sentences
  sentences.forEach((sentence, i) => {
    const nodeId = `node-${i}`;
    const words = sentence.split(/\s+/);
    // Use first 6 words as label
    const label = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');

    let type: DiagramNode['type'] = 'step';
    if (i === 0) type = 'concept';
    else if (sentence.toLowerCase().includes('example') || sentence.toLowerCase().includes('for instance')) type = 'example';
    else if (i === sentences.length - 1) type = 'result';

    nodes.push({ id: nodeId, label, type });
    edges.push({
      from: i === 0 ? 'root' : `node-${i - 1}`,
      to: nodeId,
      label: i === 0 ? 'explains' : 'then',
    });
  });

  // Determine best diagram type based on content
  let diagramType: VisualContent['diagramType'] = 'flowchart';
  if (content.tags.includes('comparison')) diagramType = 'comparison';
  else if (content.tags.includes('timeline') || content.tags.includes('history')) diagramType = 'timeline';
  else if (content.tags.includes('concept') || content.tags.includes('overview')) diagramType = 'mindmap';

  return { diagramType, nodes, edges };
}

// ── Story Format Transformer ─────────────────────────────────

export function transformToStory(content: ContentItem): string {
  return `Once upon a time, in the world of ${content.subject}, there was a concept called "${content.title}".

${content.body
    .split('\n')
    .filter(p => p.trim().length > 0)
    .map((p, i) => {
      if (i === 0) return `Our journey begins: ${p}`;
      if (i === 1) return `As we explore further, we discover that ${p.toLowerCase()}`;
      return p;
    })
    .join('\n\n')}

And that is the story of ${content.title} — a key idea in ${content.subject} that helps us understand the world better.`;
}

// ── Step-by-Step Transformer ─────────────────────────────────

export function transformToStepByStep(content: ContentItem): string[] {
  const sentences = content.body
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  return sentences.map((sentence, i) => `Step ${i + 1}: ${sentence}.`);
}

// ── Example Generator ────────────────────────────────────────

export function transformToExamples(content: ContentItem): string[] {
  // Extract existing examples or generate placeholder examples
  const examplePatterns = /(?:for example|e\.g\.|such as|like|instance)[,:]?\s*([^.!?]+)/gi;
  const found: string[] = [];
  let match;

  while ((match = examplePatterns.exec(content.body)) !== null) {
    found.push(match[1].trim());
  }

  if (found.length === 0) {
    // Generate generic examples based on subject
    found.push(
      `Example 1: Think about ${content.title} in everyday life.`,
      `Example 2: In ${content.subject}, ${content.title} appears when you...`,
      `Example 3: A simple way to see ${content.title} is to...`
    );
  }

  return found.slice(0, 5);
}

// ── Master Transformer ───────────────────────────────────────

export function transformContent(
  content: ContentItem,
  formats: ContentFormat[]
): TransformedContent {
  const result: TransformedContent = { original: content };

  if (formats.includes('audio')) {
    result.audio = transformToAudio(content);
  }
  if (formats.includes('simplified')) {
    result.simplified = transformToSimplified(content);
  }
  if (formats.includes('visual')) {
    result.visual = transformToVisual(content);
  }

  // Always include all explanation styles
  result.storyFormat = transformToStory(content);
  result.stepByStep = transformToStepByStep(content);
  result.examples = transformToExamples(content);

  return result;
}

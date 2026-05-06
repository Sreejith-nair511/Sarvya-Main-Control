import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, formats = ['audio', 'simplified', 'visual'] } = await req.json();
    if (!content?.body) return NextResponse.json({ error: 'content.body required' }, { status: 400 });

    const { title = 'Untitled', body, subject = 'General' } = content;

    // Use Groq to generate all transformations in parallel
    const [simplifiedRes, storyRes, stepsRes, examplesRes] = await Promise.all([
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: `Simplify this text to a grade-5 reading level. Return JSON: {"text":"...","keyPoints":["...","..."]}. Content: ${body}` }],
        max_tokens: 400, temperature: 0.3,
      }),
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: `Rewrite this as an engaging story for a learner. Keep it under 150 words. Topic: "${title}" in ${subject}. Content: ${body}` }],
        max_tokens: 300, temperature: 0.8,
      }),
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: `Convert this into 4-6 clear numbered steps. Return JSON array: ["Step 1: ...","Step 2: ..."]. Content: ${body}` }],
        max_tokens: 300, temperature: 0.3,
      }),
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: `Give 3 real-world examples that illustrate this concept. Return JSON array: ["Example 1: ...","Example 2: ...","Example 3: ..."]. Concept: ${title}. Content: ${body}` }],
        max_tokens: 300, temperature: 0.5,
      }),
    ]);

    // Parse responses safely
    function safeJson(text: string, fallback: any) {
      try {
        const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : fallback;
      } catch { return fallback; }
    }

    const simplifiedText = simplifiedRes.choices[0]?.message?.content || '';
    const simplified = safeJson(simplifiedText, { text: body.slice(0, 300), keyPoints: [body.split('.')[0]] });

    const stepsText = stepsRes.choices[0]?.message?.content || '';
    const stepByStep = safeJson(stepsText, body.split('.').filter(Boolean).slice(0, 5).map((s: string, i: number) => `Step ${i + 1}: ${s.trim()}.`));

    const examplesText = examplesRes.choices[0]?.message?.content || '';
    const examples = safeJson(examplesText, [`Example 1: Think about ${title} in everyday life.`]);

    // Audio SSML
    const cleanBody = body.replace(/\n+/g, ' ').slice(0, 500);
    const audio = {
      text: `<speak><prosody rate="medium"><p>${title}.</p><break time="400ms"/><p>${cleanBody}</p></prosody></speak>`,
      durationEstimate: Math.ceil(cleanBody.split(' ').length / 140 * 60),
      voiceStyle: 'calm',
    };

    // Visual diagram from content structure
    const sentences = body.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 10).slice(0, 6);
    const visual = {
      diagramType: 'flowchart',
      nodes: [
        { id: 'root', label: title, type: 'concept' },
        ...sentences.map((s: string, i: number) => ({
          id: `n${i}`, label: s.split(' ').slice(0, 5).join(' ') + '...', type: i === sentences.length - 1 ? 'result' : 'step',
        })),
      ],
      edges: sentences.map((_: string, i: number) => ({ from: i === 0 ? 'root' : `n${i - 1}`, to: `n${i}`, label: i === 0 ? 'leads to' : 'then' })),
    };

    return NextResponse.json({
      original: content,
      audio,
      simplified: typeof simplified === 'object' && !Array.isArray(simplified) ? { ...simplified, readingLevel: 'grade-5' } : { text: simplified, keyPoints: [], readingLevel: 'grade-5' },
      visual,
      storyFormat: storyRes.choices[0]?.message?.content || '',
      stepByStep: Array.isArray(stepByStep) ? stepByStep : [stepByStep],
      examples: Array.isArray(examples) ? examples : [examples],
    });
  } catch (e: any) {
    console.error('[Transform API]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

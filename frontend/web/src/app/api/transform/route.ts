import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Detect if content is technical / mathematical ─────────────
function isTechnical(body: string, subject: string): boolean {
  const techSubjects = ['math', 'mathematics', 'physics', 'chemistry', 'calculus',
    'algebra', 'statistics', 'quantum', 'engineering', 'computer science',
    'biology', 'biochemistry', 'thermodynamics', 'mechanics'];
  const techPatterns = /\b(equation|formula|theorem|derivative|integral|matrix|vector|function|proof|algorithm|coefficient|variable|constant|hypothesis|reaction|molecule|force|energy|velocity|acceleration|probability|logarithm|polynomial|differential|eigenvalue|gradient|divergence|entropy|wavelength|frequency|amplitude|resistance|voltage|current|momentum|torque|flux|tensor|manifold|topology|isomorphism)\b/i;
  const mathSymbols = /[∫∑∏√∞≈≠≤≥±×÷∂∇∆∈∉⊂⊃∪∩∀∃→←↔⟹⟺]|[a-zA-Z]\^[0-9]|\b[a-z]\([a-z]\)|\bsin\b|\bcos\b|\btan\b|\bln\b|\blog\b|\blim\b|\bmax\b|\bmin\b/;

  return techSubjects.some(s => subject.toLowerCase().includes(s)) ||
    techPatterns.test(body) ||
    mathSymbols.test(body);
}

// ── Build subject-aware system context ───────────────────────
function getSystemContext(subject: string, isTech: boolean): string {
  if (!isTech) return '';
  return `You are an expert educator specializing in ${subject}. 
Your job is to make complex technical and mathematical concepts accessible to students at all levels.
When explaining:
- Break down formulas and equations into plain language first
- Use analogies from everyday life to anchor abstract concepts
- Show the intuition BEFORE the formal definition
- For math: explain what each symbol/variable represents
- For physics/chemistry: connect equations to observable phenomena
- Never skip steps — assume the student is seeing this for the first time`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, formats = ['audio', 'simplified', 'visual'] } = await req.json();
    if (!content?.body) return NextResponse.json({ error: 'content.body required' }, { status: 400 });

    const { title = 'Untitled', body, subject = 'General' } = content;
    const tech = isTechnical(body, subject);
    const systemCtx = getSystemContext(subject, tech);

    function msg(userPrompt: string) {
      return tech
        ? [{ role: 'system' as const, content: systemCtx }, { role: 'user' as const, content: userPrompt }]
        : [{ role: 'user' as const, content: userPrompt }];
    }

    // ── All 4 transformations in parallel ────────────────────
    const [simplifiedRes, storyRes, stepsRes, examplesRes] = await Promise.all([

      // 1. Simplified explanation
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: msg(tech
          ? `Explain "${title}" in ${subject} to a 14-year-old with no prior knowledge.
Use simple everyday language. Avoid jargon. If there are formulas, explain what each part means in plain English.
Return JSON exactly: {"text":"your explanation here","keyPoints":["point 1","point 2","point 3"]}
Content to simplify: ${body}`
          : `Simplify this to a grade-5 reading level. Return JSON: {"text":"...","keyPoints":["...","..."]}. Content: ${body}`
        ),
        max_tokens: 500,
        temperature: 0.3,
      }),

      // 2. Story / analogy format
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: msg(tech
          ? `Create a short story or analogy (under 200 words) that explains "${title}" in ${subject} using everyday objects or situations.
The story should make the core concept click intuitively — no formulas, just the idea.
Start with "Imagine..." or "Think of it like..."
Content: ${body}`
          : `Rewrite this as an engaging story for a learner. Under 150 words. Topic: "${title}" in ${subject}. Content: ${body}`
        ),
        max_tokens: 350,
        temperature: 0.8,
      }),

      // 3. Step-by-step breakdown
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: msg(tech
          ? `Break down "${title}" in ${subject} into 5-7 clear steps that build on each other.
Each step should be one idea. For math/physics: show the reasoning, not just the formula.
Return a JSON array: ["Step 1: ...", "Step 2: ...", ...]
Content: ${body}`
          : `Convert this into 4-6 clear numbered steps. Return JSON array: ["Step 1: ...","Step 2: ..."]. Content: ${body}`
        ),
        max_tokens: 400,
        temperature: 0.3,
      }),

      // 4. Real-world examples
      groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: msg(tech
          ? `Give 4 concrete real-world examples or applications of "${title}" in ${subject}.
For each example: explain WHERE this concept appears in real life and WHY it matters.
Make them specific and interesting — not generic.
Return a JSON array: ["Example 1: ...", "Example 2: ...", "Example 3: ...", "Example 4: ..."]
Content: ${body}`
          : `Give 3 real-world examples of this concept. Return JSON array: ["Example 1: ...","Example 2: ...","Example 3: ..."]. Concept: ${title}. Content: ${body}`
        ),
        max_tokens: 400,
        temperature: 0.5,
      }),
    ]);

    // ── Parse responses safely ────────────────────────────────
    function safeJson(text: string, fallback: any) {
      try {
        const match = text.match(/\[[\s\S]*?\]|\{[\s\S]*?\}/);
        return match ? JSON.parse(match[0]) : fallback;
      } catch { return fallback; }
    }

    const simplifiedText = simplifiedRes.choices[0]?.message?.content || '';
    const simplified = safeJson(simplifiedText, {
      text: body.slice(0, 300),
      keyPoints: body.split('.').filter(Boolean).slice(0, 3).map((s: string) => s.trim()),
    });

    const stepsText = stepsRes.choices[0]?.message?.content || '';
    const stepByStep = safeJson(stepsText,
      body.split('.').filter(Boolean).slice(0, 5).map((s: string, i: number) => `Step ${i + 1}: ${s.trim()}.`)
    );

    const examplesText = examplesRes.choices[0]?.message?.content || '';
    const examples = safeJson(examplesText, [
      `Example 1: Think about ${title} in everyday life.`,
      `Example 2: In ${subject}, ${title} appears when...`,
    ]);

    // ── Audio SSML ────────────────────────────────────────────
    // For technical content, use the simplified text for audio (not raw body)
    const audioText = tech
      ? (typeof simplified === 'object' ? simplified.text : simplified) || body
      : body;
    const cleanAudio = audioText.replace(/\n+/g, ' ').slice(0, 600);
    const audio = {
      text: `<speak><prosody rate="slow" pitch="medium"><p>${title}.</p><break time="600ms"/><p>${cleanAudio}</p></prosody></speak>`,
      durationEstimate: Math.ceil(cleanAudio.split(' ').length / 110 * 60), // slower for technical
      voiceStyle: 'calm',
    };

    // ── Visual diagram ────────────────────────────────────────
    // For technical content, build a concept map from key points
    const keyPoints: string[] = tech && typeof simplified === 'object' && simplified.keyPoints
      ? simplified.keyPoints
      : body.split(/[.!?]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 10).slice(0, 6);

    const visual = {
      diagramType: tech ? 'mindmap' : 'flowchart',
      nodes: [
        { id: 'root', label: title, type: 'concept' },
        ...keyPoints.map((kp: string, i: number) => ({
          id: `n${i}`,
          label: kp.split(' ').slice(0, 6).join(' ') + (kp.split(' ').length > 6 ? '...' : ''),
          type: i === keyPoints.length - 1 ? 'result' : i % 3 === 2 ? 'example' : 'step',
        })),
      ],
      edges: keyPoints.map((_: string, i: number) => ({
        from: i === 0 ? 'root' : `n${i - 1}`,
        to: `n${i}`,
        label: tech ? (i === 0 ? 'means' : 'leads to') : (i === 0 ? 'explains' : 'then'),
      })),
    };

    return NextResponse.json({
      original: content,
      isTechnical: tech,
      audio,
      simplified: typeof simplified === 'object' && !Array.isArray(simplified)
        ? { ...simplified, readingLevel: tech ? 'grade-8' : 'grade-5' }
        : { text: String(simplified), keyPoints: [], readingLevel: 'grade-5' },
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

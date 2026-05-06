import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAdminClient } from '@/lib/supabase';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// GET /api/companion?userId=x&sessionKey=y — fetch history
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetId = req.nextUrl.searchParams.get('userId') || userId;
    const sessionKey = req.nextUrl.searchParams.get('sessionKey') || 'default';
    const db = getAdminClient();

    const { data } = await db
      .from('companion_messages')
      .select('*')
      .eq('user_id', targetId)
      .eq('session_key', sessionKey)
      .order('created_at', { ascending: true })
      .limit(50);

    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/companion — send message, get Groq response
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      userId: targetId = userId,
      message,
      sessionKey = 'default',
      communicationStyle = 'intermediate',
      topic = '',
      twinState = null,
    } = body;

    if (!message?.trim()) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    const db = getAdminClient();

    // Fetch recent history for context
    const { data: history } = await db
      .from('companion_messages')
      .select('role, content')
      .eq('user_id', targetId)
      .eq('session_key', sessionKey)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build system prompt based on communication style
    const styleInstructions: Record<string, string> = {
      beginner: 'Use very simple words. Short sentences. One idea at a time. Be warm and encouraging. Use emojis occasionally. Avoid jargon.',
      intermediate: 'Use clear, friendly language. Explain concepts with relatable examples. Be supportive and engaging.',
      advanced: 'Use precise technical language. Be concise and thorough. Assume solid prior knowledge.',
    };

    const weakAreas = twinState?.predictedWeakAreas?.length > 0
      ? `The learner has shown difficulty with: ${twinState.predictedWeakAreas.join(', ')}.`
      : '';

    const systemPrompt = `You are SARVYA, an inclusive AI learning companion. You adapt to every learner's needs.

Communication style: ${styleInstructions[communicationStyle] || styleInstructions.intermediate}
${topic ? `Current topic: ${topic}` : ''}
${weakAreas}
Understanding score: ${twinState?.understandingScore ?? 50}/100
Cognitive load: ${twinState?.cognitiveLoadScore ?? 30}/100 (lower is better)

Rules:
- Always be encouraging and patient
- If the learner is struggling, offer multiple explanation formats (story, steps, example)
- Keep responses concise but complete
- If cognitive load is high (>70), keep responses shorter and simpler
- Never make the learner feel bad for not understanding`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    // Call Groq
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || 'I had trouble generating a response. Please try again.';

    // Save both messages to Supabase
    await db.from('companion_messages').insert([
      { user_id: targetId, session_key: sessionKey, role: 'user',      content: message,       style: communicationStyle },
      { user_id: targetId, session_key: sessionKey, role: 'assistant', content: responseText,  style: communicationStyle },
    ]);

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
      },
      voiceText: responseText.replace(/[*_`#]/g, '').replace(/\n+/g, ' '),
    });
  } catch (e: any) {
    console.error('[Companion API]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

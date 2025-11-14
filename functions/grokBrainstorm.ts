import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            topic,
            contentType,
            level,
            currentAngles,
            includeRealTimeData = true
        } = await req.json();

        if (!topic) {
            return Response.json({ error: 'Topic is required' }, { status: 400 });
        }

        const grokApiKey = Deno.env.get("GROK_API_KEY");
        if (!grokApiKey) {
            return Response.json({ error: 'GROK_API_KEY not configured' }, { status: 500 });
        }

        // Construct the prompt for Grok
        const systemPrompt = `You are CreativeSpark, a witty AI brainstorming assistant. You specialize in generating unique, engaging angles for educational content. Be creative, bold, and inject personality while maintaining educational value.`;

        const userPrompt = `Brainstorm creative angles for a ${contentType} on "${topic}" at ${level} level.

${currentAngles ? `Current ideas to build upon: ${currentAngles}` : ''}

Generate:
1. **5 Unique Angles**: Unconventional approaches, creative metaphors, or unexpected connections
2. **Witty Hooks**: Attention-grabbing opening lines or taglines
3. **Creative Formats**: Innovative ways to present the content (storytelling, gamification, etc.)
4. **Engagement Ideas**: Interactive elements, challenges, or viral-worthy concepts
${includeRealTimeData ? '5. **Real-Time Context**: Current trends, news, or cultural references related to this topic' : ''}

Be specific, actionable, and inject personality. Make learning unforgettable!

Return as JSON:
{
    "unique_angles": [{"angle": "description", "why_it_works": "reason"}],
    "witty_hooks": ["hook1", "hook2", "hook3"],
    "creative_formats": [{"format": "name", "description": "how it works"}],
    "engagement_ideas": [{"idea": "concept", "implementation": "how to do it"}],
    "real_time_context": {"trends": ["trend1", "trend2"], "cultural_references": ["ref1", "ref2"], "current_discussions": "summary"}
}`;

        // Call Grok API
        const grokResponse = await fetch(GROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${grokApiKey}`
            },
            body: JSON.stringify({
                model: "grok-beta",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ],
                temperature: 0.9,
                max_tokens: 4000
            })
        });

        if (!grokResponse.ok) {
            const errorText = await grokResponse.text();
            throw new Error(`Grok API error: ${grokResponse.status} - ${errorText}`);
        }

        const grokData = await grokResponse.json();
        const grokText = grokData.choices[0].message.content;

        // Parse JSON from Grok's response
        let brainstormResults;
        try {
            const jsonMatch = grokText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                brainstormResults = JSON.parse(jsonMatch[0]);
            } else {
                // If JSON parsing fails, return raw text
                brainstormResults = {
                    raw_response: grokText,
                    unique_angles: [],
                    witty_hooks: [],
                    creative_formats: [],
                    engagement_ideas: []
                };
            }
        } catch (parseError) {
            brainstormResults = {
                raw_response: grokText,
                unique_angles: [],
                witty_hooks: [],
                creative_formats: [],
                engagement_ideas: []
            };
        }

        return Response.json({
            success: true,
            brainstorm: brainstormResults,
            usage: {
                model: "grok-beta",
                tokens: grokData.usage?.total_tokens || 0
            }
        });

    } catch (error) {
        console.error('Grok brainstorm error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});
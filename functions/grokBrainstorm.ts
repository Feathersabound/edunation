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
        const systemPrompt = `You are a witty AI brainstorming assistant. Generate creative angles for educational content. Return ONLY valid JSON, no other text or markdown.`;

        const userPrompt = `Brainstorm creative angles for a ${contentType} on "${topic}" at ${level} level.

Generate 5 unique angles with brief descriptions.

Return ONLY this JSON structure:
{
    "unique_angles": [
        {"angle": "description here", "why_it_works": "brief reason"},
        {"angle": "description here", "why_it_works": "brief reason"},
        {"angle": "description here", "why_it_works": "brief reason"},
        {"angle": "description here", "why_it_works": "brief reason"},
        {"angle": "description here", "why_it_works": "brief reason"}
    ],
    "witty_hooks": ["hook1", "hook2", "hook3"],
    "creative_formats": [{"format": "format name", "description": "brief description"}],
    "real_time_context": {"trends": ["trend1", "trend2"], "cultural_references": ["ref1"], "current_discussions": "summary"}
}`;

        console.log("Calling Grok API...");

        // Call Grok API with updated model
        const grokResponse = await fetch(GROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${grokApiKey}`
            },
            body: JSON.stringify({
                model: "grok-3",
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
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!grokResponse.ok) {
            const errorText = await grokResponse.text();
            console.error("Grok API error:", errorText);
            throw new Error(`Grok API error: ${grokResponse.status} - ${errorText}`);
        }

        const grokData = await grokResponse.json();
        console.log("Grok response received");
        
        const grokText = grokData.choices[0].message.content;
        console.log("Grok response text:", grokText.substring(0, 200));

        // Parse JSON from Grok's response
        let brainstormResults;
        try {
            // Remove markdown code blocks if present
            let cleanedText = grokText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            // Try to find JSON in the response
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                brainstormResults = JSON.parse(jsonMatch[0]);
                console.log("Successfully parsed JSON from Grok");
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Failed text:", grokText);
            
            // Fallback: return raw text
            brainstormResults = {
                raw_response: grokText,
                unique_angles: [
                    {
                        angle: "Creative angle extraction failed - using fallback",
                        why_it_works: "Grok returned invalid JSON format"
                    }
                ],
                witty_hooks: [grokText.substring(0, 100)],
                creative_formats: [],
                real_time_context: {}
            };
        }

        return Response.json({
            success: true,
            brainstorm: brainstormResults,
            usage: {
                model: "grok-3",
                tokens: grokData.usage?.total_tokens || 0
            }
        });

    } catch (error) {
        console.error('Grok brainstorm error:', error);
        return Response.json({ 
            success: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});
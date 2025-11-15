import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, researchDepth = "standard", includeCitations = true } = await req.json();

        if (!query) {
            return Response.json({ error: 'Query is required' }, { status: 400 });
        }

        const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
        if (!perplexityApiKey) {
            return Response.json({ error: 'PERPLEXITY_API_KEY not configured' }, { status: 500 });
        }

        // Use current Perplexity models as of 2024
        const model = researchDepth === "deep" 
            ? "llama-3.1-sonar-large-128k-online" 
            : "llama-3.1-sonar-small-128k-online";

        const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${perplexityApiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: "You are a research assistant providing accurate, well-cited information. Always include sources and verify facts."
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                temperature: 0.2,
                top_p: 0.9,
                return_citations: includeCitations,
                return_images: false,
                search_recency_filter: "month"
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        return Response.json({
            success: true,
            content: data.choices[0].message.content,
            citations: data.citations || [],
            model: model,
            usage: data.usage
        });

    } catch (error) {
        console.error('Perplexity research error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});
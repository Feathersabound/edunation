import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        console.log("Starting system audit...");
        const auditResults = {
            timestamp: new Date().toISOString(),
            aiServices: {},
            database: {},
            issues: [],
            recommendations: []
        };

        // 1. Check AI API Keys
        const requiredKeys = ['CLAUDE_API_KEY', 'GROK_API_KEY', 'PERPLEXITY_API_KEY'];
        requiredKeys.forEach(key => {
            const exists = !!Deno.env.get(key);
            auditResults.aiServices[key] = {
                configured: exists,
                status: exists ? 'OK' : 'MISSING'
            };
            if (!exists) {
                auditResults.issues.push(`Missing API key: ${key}`);
            }
        });

        // 2. Test Claude API
        try {
            const claudeTest = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': Deno.env.get('CLAUDE_API_KEY'),
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'test' }]
                })
            });
            auditResults.aiServices.CLAUDE_API_KEY.apiStatus = claudeTest.ok ? 'WORKING' : 'FAILED';
            if (!claudeTest.ok) {
                const error = await claudeTest.text();
                auditResults.issues.push(`Claude API test failed: ${error}`);
            }
        } catch (error) {
            auditResults.aiServices.CLAUDE_API_KEY.apiStatus = 'ERROR';
            auditResults.issues.push(`Claude API error: ${error.message}`);
        }

        // 3. Test Grok API
        try {
            const grokTest = await fetch('https://api.x.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('GROK_API_KEY')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'grok-beta',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10
                })
            });
            auditResults.aiServices.GROK_API_KEY.apiStatus = grokTest.ok ? 'WORKING' : 'FAILED';
            if (!grokTest.ok) {
                const error = await grokTest.text();
                auditResults.issues.push(`Grok API test failed: ${error}`);
            }
        } catch (error) {
            auditResults.aiServices.GROK_API_KEY.apiStatus = 'ERROR';
            auditResults.issues.push(`Grok API error: ${error.message}`);
        }

        // 4. Test Perplexity API
        try {
            const perplexityTest = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10
                })
            });
            auditResults.aiServices.PERPLEXITY_API_KEY.apiStatus = perplexityTest.ok ? 'WORKING' : 'FAILED';
            if (!perplexityTest.ok) {
                const error = await perplexityTest.text();
                auditResults.issues.push(`Perplexity API test failed: ${error}`);
            }
        } catch (error) {
            auditResults.aiServices.PERPLEXITY_API_KEY.apiStatus = 'ERROR';
            auditResults.issues.push(`Perplexity API error: ${error.message}`);
        }

        // 5. Check Database - Books
        const books = await base44.asServiceRole.entities.Book.list();
        const invalidBooks = books.filter(book => 
            !book.title || 
            !book.chapters || 
            book.chapters.length === 0 ||
            !book.topic
        );
        
        auditResults.database.books = {
            total: books.length,
            invalid: invalidBooks.length,
            invalidIds: invalidBooks.map(b => b.id)
        };

        if (invalidBooks.length > 0) {
            auditResults.issues.push(`Found ${invalidBooks.length} invalid book(s) with missing or empty data`);
            auditResults.recommendations.push(`Delete invalid books: ${invalidBooks.map(b => b.id).join(', ')}`);
        }

        // 6. Check Database - Courses
        const courses = await base44.asServiceRole.entities.Course.list();
        const invalidCourses = courses.filter(course => 
            !course.title || 
            !course.content_structure || 
            course.content_structure.length === 0 ||
            !course.topic
        );
        
        auditResults.database.courses = {
            total: courses.length,
            invalid: invalidCourses.length,
            invalidIds: invalidCourses.map(c => c.id)
        };

        if (invalidCourses.length > 0) {
            auditResults.issues.push(`Found ${invalidCourses.length} invalid course(s) with missing or empty data`);
            auditResults.recommendations.push(`Delete invalid courses: ${invalidCourses.map(c => c.id).join(', ')}`);
        }

        // 7. AI Orchestration Check
        auditResults.aiOrchestration = {
            strategy: "Sequential with fallback",
            order: ["Perplexity (Research)", "Grok (Trends)", "Claude/Core (Generation)"],
            conflicts: "None - Each AI serves distinct purpose",
            override: "Claude has final authority on content structure and quality"
        };

        // 8. Generate recommendations
        if (auditResults.issues.length === 0) {
            auditResults.recommendations.push("System is healthy - all services operational");
        } else {
            auditResults.recommendations.push("Fix API key issues first");
            auditResults.recommendations.push("Clean up invalid database entries");
        }

        return Response.json({
            success: true,
            audit: auditResults
        });

    } catch (error) {
        console.error('Audit error:', error);
        return Response.json({ 
            error: error.message || 'Audit failed',
            details: error.toString()
        }, { status: 500 });
    }
});
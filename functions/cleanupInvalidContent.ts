import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        const { contentType = 'all', dryRun = true } = await req.json().catch(() => ({}));
        
        console.log(`Starting cleanup - Type: ${contentType}, Dry run: ${dryRun}`);
        
        const results = {
            books: { found: 0, deleted: 0, ids: [] },
            courses: { found: 0, deleted: 0, ids: [] }
        };

        // Clean up invalid books
        if (contentType === 'all' || contentType === 'books') {
            const books = await base44.asServiceRole.entities.Book.list();
            const invalidBooks = books.filter(book => 
                !book.title || 
                !book.chapters || 
                book.chapters.length === 0 ||
                !book.topic
            );

            results.books.found = invalidBooks.length;
            results.books.ids = invalidBooks.map(b => ({ id: b.id, title: b.title || 'No title' }));

            if (!dryRun) {
                for (const book of invalidBooks) {
                    try {
                        await base44.asServiceRole.entities.Book.delete(book.id);
                        results.books.deleted++;
                        console.log(`Deleted invalid book: ${book.id}`);
                    } catch (error) {
                        console.error(`Failed to delete book ${book.id}:`, error);
                    }
                }
            }
        }

        // Clean up invalid courses
        if (contentType === 'all' || contentType === 'courses') {
            const courses = await base44.asServiceRole.entities.Course.list();
            const invalidCourses = courses.filter(course => 
                !course.title || 
                !course.content_structure || 
                course.content_structure.length === 0 ||
                !course.topic
            );

            results.courses.found = invalidCourses.length;
            results.courses.ids = invalidCourses.map(c => ({ id: c.id, title: c.title || 'No title' }));

            if (!dryRun) {
                for (const course of invalidCourses) {
                    try {
                        await base44.asServiceRole.entities.Course.delete(course.id);
                        results.courses.deleted++;
                        console.log(`Deleted invalid course: ${course.id}`);
                    } catch (error) {
                        console.error(`Failed to delete course ${course.id}:`, error);
                    }
                }
            }
        }

        return Response.json({
            success: true,
            dryRun,
            results,
            message: dryRun 
                ? 'Dry run complete - no data deleted. Set dryRun=false to delete.'
                : `Cleanup complete - deleted ${results.books.deleted} books and ${results.courses.deleted} courses`
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return Response.json({ 
            error: error.message || 'Cleanup failed',
            details: error.toString()
        }, { status: 500 });
    }
});
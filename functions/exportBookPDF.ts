import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bookId, format = "standard" } = await req.json();

        if (!bookId) {
            return Response.json({ error: 'Book ID required' }, { status: 400 });
        }

        const books = await base44.entities.Book.filter({ id: bookId });
        const book = books[0];

        if (!book) {
            return Response.json({ error: 'Book not found' }, { status: 404 });
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: format === 'kdp' ? [152.4, 228.6] : 'a4' // KDP 6x9 inches or A4
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = format === 'kdp' ? 19 : 20; // KDP requires minimum 0.75" margins
        const maxWidth = pageWidth - (margin * 2);
        let y = margin;

        // Add metadata
        doc.setProperties({
            title: book.title,
            author: book.author_name || 'Unknown',
            subject: book.topic,
            keywords: book.topic
        });

        // Title Page
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        const titleLines = doc.splitTextToSize(book.title, maxWidth);
        y = pageHeight / 2 - 40;
        titleLines.forEach(line => {
            doc.text(line, pageWidth / 2, y, { align: 'center' });
            y += 12;
        });

        // Subtitle
        if (book.subtitle) {
            doc.setFontSize(16);
            doc.setFont(undefined, 'normal');
            const subtitleLines = doc.splitTextToSize(book.subtitle, maxWidth);
            y += 10;
            subtitleLines.forEach(line => {
                doc.text(line, pageWidth / 2, y, { align: 'center' });
                y += 8;
            });
        }

        // Author
        doc.setFontSize(14);
        y = pageHeight - 60;
        doc.text(book.author_name || 'Anonymous', pageWidth / 2, y, { align: 'center' });

        // Add page numbers function
        const addPageNumber = (pageNum) => {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(
                String(pageNum),
                pageWidth / 2,
                pageHeight - 15,
                { align: 'center' }
            );
        };

        let pageNumber = 1;

        // Copyright page
        doc.addPage();
        pageNumber++;
        y = margin;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const copyrightText = [
            `Copyright © ${new Date().getFullYear()} ${book.author_name || 'Author'}`,
            '',
            'All rights reserved. No part of this book may be reproduced or transmitted',
            'in any form or by any means without written permission from the author.',
            '',
            `Published: ${new Date().toLocaleDateString()}`,
            book.adult_content ? '\nAdult Content Warning: This book is intended for readers 18+' : ''
        ];
        copyrightText.forEach(line => {
            if (line) {
                doc.text(line, margin, y);
                y += 6;
            } else {
                y += 3;
            }
        });
        addPageNumber(pageNumber);

        // Table of Contents
        doc.addPage();
        pageNumber++;
        y = margin;
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Table of Contents', margin, y);
        y += 15;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        book.chapters?.forEach((chapter, idx) => {
            doc.text(`${chapter.chapter_number}. ${chapter.title}`, margin, y);
            y += 8;
            if (y > pageHeight - margin - 20) {
                doc.addPage();
                pageNumber++;
                y = margin;
                addPageNumber(pageNumber);
            }
        });
        addPageNumber(pageNumber);

        // Chapters
        book.chapters?.forEach((chapter, chapterIdx) => {
            doc.addPage();
            pageNumber++;
            y = margin;

            // Chapter number and title
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Chapter ${chapter.chapter_number}`, margin, y);
            y += 12;

            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            const chapterTitleLines = doc.splitTextToSize(chapter.title, maxWidth);
            chapterTitleLines.forEach(line => {
                doc.text(line, margin, y);
                y += 10;
            });
            y += 10;

            // Chapter content
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.setLineHeightFactor(1.6); // Better readability
            
            const contentLines = doc.splitTextToSize(chapter.content || '', maxWidth);
            contentLines.forEach(line => {
                if (y > pageHeight - margin - 20) {
                    addPageNumber(pageNumber);
                    doc.addPage();
                    pageNumber++;
                    y = margin;
                }
                doc.text(line, margin, y);
                y += 6;
            });

            // Key takeaways
            if (chapter.key_takeaways && chapter.key_takeaways.length > 0) {
                y += 10;
                if (y > pageHeight - margin - 40) {
                    addPageNumber(pageNumber);
                    doc.addPage();
                    pageNumber++;
                    y = margin;
                }
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Key Takeaways:', margin, y);
                y += 8;
                
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                chapter.key_takeaways.forEach(takeaway => {
                    const takeawayLines = doc.splitTextToSize(`• ${takeaway}`, maxWidth - 5);
                    takeawayLines.forEach(line => {
                        if (y > pageHeight - margin - 20) {
                            addPageNumber(pageNumber);
                            doc.addPage();
                            pageNumber++;
                            y = margin;
                        }
                        doc.text(line, margin + 5, y);
                        y += 6;
                    });
                });
            }

            addPageNumber(pageNumber);
        });

        // Generate PDF
        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`
            }
        });

    } catch (error) {
        console.error('PDF Export Error:', error);
        return Response.json({
            error: error.message || 'PDF export failed'
        }, { status: 500 });
    }
});
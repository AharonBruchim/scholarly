import { describe, expect, it } from 'vitest';
import { buildMime } from './gmail';

describe('Gmail MIME message', () => {
    it('includes a payment-request PDF as a named attachment', () => {
        const pdf = Buffer.from('%PDF-1.7 test document');
        const message = buildMime({
            to: 'student@example.com',
            subject: 'דרישת תשלום',
            html: '<div dir="rtl">שלום</div>',
            pdf,
            pdfFilename: 'דרישת-תשלום-123.pdf',
        });

        expect(message).toContain('Content-Type: multipart/mixed');
        expect(message).toContain('Content-Type: application/pdf;');
        expect(message).toContain('Content-Disposition: attachment;');
        expect(message).toContain("filename*=UTF-8''%D7%93%D7%A8%D7%99%D7%A9%D7%AA-%D7%AA%D7%A9%D7%9C%D7%95%D7%9D-123.pdf");
        expect(message).toContain(pdf.toString('base64'));
    });
});

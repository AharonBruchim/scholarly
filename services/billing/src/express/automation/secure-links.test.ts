import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    createLessonMessageDocumentToken,
    createManualDeliveryToken,
    createPaymentDocumentToken,
    smsUrl,
    verifyLessonMessageDocumentToken,
    verifyManualDeliveryToken,
    verifyPaymentDocumentToken,
    whatsappUrl,
} from './secure-links';

describe('secure payment links', () => {
    const originalSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    it('accepts a valid signed token for the matching payment request', () => {
        const token = createPaymentDocumentToken('payment-id', new Date(Date.now() + 60_000));
        expect(() => verifyPaymentDocumentToken('payment-id', token)).not.toThrow();
    });

    it('rejects expired and mismatched document tokens', () => {
        const expired = createPaymentDocumentToken('payment-id', new Date(Date.now() - 1_000));
        const valid = createPaymentDocumentToken('payment-id', new Date(Date.now() + 60_000));
        expect(() => verifyPaymentDocumentToken('payment-id', expired)).toThrow();
        expect(() => verifyPaymentDocumentToken('different-id', valid)).toThrow();
    });
});

describe('secure lesson-message links', () => {
    const originalSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    it('accepts only a valid token for the matching lesson message', () => {
        const valid = createLessonMessageDocumentToken('message-id', new Date(Date.now() + 60_000));
        expect(() => verifyLessonMessageDocumentToken('message-id', valid)).not.toThrow();
        expect(() => verifyLessonMessageDocumentToken('different-id', valid)).toThrow();
    });
});

describe('secure manual-delivery links', () => {
    const originalSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
    });

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    it('accepts only a valid token for the matching delivery', () => {
        const valid = createManualDeliveryToken('delivery-id', new Date(Date.now() + 60_000));
        expect(() => verifyManualDeliveryToken('delivery-id', valid)).not.toThrow();
        expect(() => verifyManualDeliveryToken('different-id', valid)).toThrow();
    });
});

describe('WhatsApp links', () => {
    it('normalizes an Israeli local mobile number', () => {
        expect(whatsappUrl('050-123-4567', 'שלום')).toBe('https://web.whatsapp.com/send?phone=972501234567&text=%D7%A9%D7%9C%D7%95%D7%9D');
    });
});

describe('SMS links', () => {
    it('opens a prepared SMS from an Israeli local mobile number', () => {
        expect(smsUrl('050-123-4567', 'PDF: https://example.com/document')).toBe(
            'sms:+972501234567?body=PDF%3A%20https%3A%2F%2Fexample.com%2Fdocument',
        );
    });
});

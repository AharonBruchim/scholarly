import { createHmac, timingSafeEqual } from 'node:crypto';
import { ServiceError } from '@scholarly/utils';

function signingSecret(): string {
    const secret = process.env.DOCUMENT_LINK_SECRET ?? process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new ServiceError('Document link signing is not configured', 503, 'DOCUMENT_LINKS_NOT_CONFIGURED');
    }
    return secret;
}

function signature(value: string): string {
    return createHmac('sha256', signingSecret()).update(value).digest('base64url');
}

export function createPaymentDocumentToken(paymentRequestId: string, expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)): string {
    const payload = `${paymentRequestId}.${Math.floor(expiresAt.getTime() / 1000)}`;
    return `${payload}.${signature(payload)}`;
}

export function verifyPaymentDocumentToken(paymentRequestId: string, token: string): void {
    const [tokenId, expiresText, providedSignature] = token.split('.');
    const expires = Number(expiresText);
    if (tokenId !== paymentRequestId || !Number.isInteger(expires) || expires * 1000 <= Date.now() || !providedSignature) {
        throw new ServiceError('Document link is invalid or expired', 401, 'INVALID_DOCUMENT_LINK');
    }
    const payload = `${tokenId}.${expires}`;
    const expected = Buffer.from(signature(payload));
    const provided = Buffer.from(providedSignature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
        throw new ServiceError('Document link is invalid or expired', 401, 'INVALID_DOCUMENT_LINK');
    }
}

export function paymentDocumentUrl(paymentRequestId: string): string {
    const publicApiUrl = (process.env.PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const token = createPaymentDocumentToken(paymentRequestId);
    return `${publicApiUrl}/api/billing/public/${paymentRequestId}/pdf?token=${encodeURIComponent(token)}`;
}

export function createLessonMessageDocumentToken(lessonMessageId: string, expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)): string {
    const payload = `lesson-message.${lessonMessageId}.${Math.floor(expiresAt.getTime() / 1000)}`;
    return `${payload}.${signature(payload)}`;
}

export function verifyLessonMessageDocumentToken(lessonMessageId: string, token: string): void {
    const [kind, tokenId, expiresText, providedSignature] = token.split('.');
    const expires = Number(expiresText);
    if (
        kind !== 'lesson-message' ||
        tokenId !== lessonMessageId ||
        !Number.isInteger(expires) ||
        expires * 1000 <= Date.now() ||
        !providedSignature
    ) {
        throw new ServiceError('Document link is invalid or expired', 401, 'INVALID_DOCUMENT_LINK');
    }
    const payload = `${kind}.${tokenId}.${expires}`;
    const expected = Buffer.from(signature(payload));
    const provided = Buffer.from(providedSignature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
        throw new ServiceError('Document link is invalid or expired', 401, 'INVALID_DOCUMENT_LINK');
    }
}

export function lessonMessageDocumentUrl(lessonMessageId: string): string {
    const publicApiUrl = (process.env.PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const token = createLessonMessageDocumentToken(lessonMessageId);
    return `${publicApiUrl}/api/billing/public/lesson-messages/${lessonMessageId}/pdf?token=${encodeURIComponent(token)}`;
}

export function createManualDeliveryToken(deliveryId: string, expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)): string {
    const payload = `manual-delivery.${deliveryId}.${Math.floor(expiresAt.getTime() / 1000)}`;
    return `${payload}.${signature(payload)}`;
}

export function verifyManualDeliveryToken(deliveryId: string, token: string): void {
    const [kind, tokenId, expiresText, providedSignature] = token.split('.');
    const expires = Number(expiresText);
    if (kind !== 'manual-delivery' || tokenId !== deliveryId || !Number.isInteger(expires) || expires * 1000 <= Date.now() || !providedSignature) {
        throw new ServiceError('Delivery link is invalid or expired', 401, 'INVALID_DELIVERY_LINK');
    }
    const payload = `${kind}.${tokenId}.${expires}`;
    const expected = Buffer.from(signature(payload));
    const provided = Buffer.from(providedSignature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
        throw new ServiceError('Delivery link is invalid or expired', 401, 'INVALID_DELIVERY_LINK');
    }
}

export function manualDeliveryOpenUrl(deliveryId: string): string {
    const publicApiUrl = (process.env.PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const token = createManualDeliveryToken(deliveryId);
    return `${publicApiUrl}/api/billing/public/manual-deliveries/${deliveryId}/open?token=${encodeURIComponent(token)}`;
}

function internationalPhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/\D/g, '');
    const international = digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
    if (international.length < 8 || international.length > 15) {
        throw new ServiceError('Student phone number is invalid', 409, 'INVALID_STUDENT_PHONE');
    }
    return international;
}

export function whatsappUrl(phoneNumber: string, message: string): string {
    const international = internationalPhoneNumber(phoneNumber);
    return `https://web.whatsapp.com/send?phone=${international}&text=${encodeURIComponent(message)}`;
}

export function smsUrl(phoneNumber: string, message: string): string {
    const international = internationalPhoneNumber(phoneNumber);
    return `sms:+${international}?body=${encodeURIComponent(message)}`;
}

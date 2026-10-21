import { UsersRoles } from '@scholarly/shared';
import type { AuthenticatedUser } from '@scholarly/utils';
import { ForbiddenError, NotFoundError, ServiceError } from '@scholarly/utils';
import { PAYMENT_PROOF_MAX_BYTES, type PaymentProofContentType, PaymentProofModel, PaymentRequestModel } from './model';

const MAX_FILENAME_LENGTH = 200;

function startsWithBytes(data: Buffer, bytes: number[], offset = 0): boolean {
    return bytes.every((byte, index) => data[offset + index] === byte);
}

function detectProofContentType(data: Buffer): PaymentProofContentType | null {
    if (startsWithBytes(data, [0x89, 0x50, 0x4e, 0x47])) return 'image/png';
    if (startsWithBytes(data, [0xff, 0xd8, 0xff])) return 'image/jpeg';
    if (startsWithBytes(data, [0x52, 0x49, 0x46, 0x46]) && startsWithBytes(data, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
    if (startsWithBytes(data, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf';
    return null;
}

function safeFilename(filename: string | undefined): string {
    const cleaned = (filename ?? '').replace(/[\\/\r\n\t"]/g, '_').trim();
    return (cleaned || 'payment-proof').slice(0, MAX_FILENAME_LENGTH);
}

async function findRequestForActor(paymentRequestId: string, actor: AuthenticatedUser) {
    const request = await PaymentRequestModel.findById(paymentRequestId).select('teacherId studentId status');
    if (!request || request.status === 'cancelled') throw new NotFoundError('Payment request not found');
    const allowed =
        actor.role === UsersRoles.TEACHER ? request.teacherId === actor.sub : actor.role === UsersRoles.STUDENT && request.studentId === actor.sub;
    if (!allowed) throw new ForbiddenError();
    return request;
}

export const PaymentProofManager = {
    upload: async (paymentRequestId: string, data: Buffer, filename: string | undefined, actor: AuthenticatedUser) => {
        if (actor.role !== UsersRoles.STUDENT) throw new ForbiddenError();
        const request = await findRequestForActor(paymentRequestId, actor);
        if (data.length === 0 || data.length > PAYMENT_PROOF_MAX_BYTES) {
            throw new ServiceError('Payment proof must be between 1 byte and 5MB', 413, 'PAYMENT_PROOF_TOO_LARGE');
        }
        const contentType = detectProofContentType(data);
        if (!contentType) throw new ServiceError('Payment proof must be a PNG, JPEG, WEBP or PDF file', 415, 'PAYMENT_PROOF_UNSUPPORTED_TYPE');
        const proof = await PaymentProofModel.create({
            paymentRequestId,
            teacherId: request.teacherId,
            studentId: request.studentId,
            uploadedBy: actor.sub,
            filename: safeFilename(filename),
            contentType,
            size: data.length,
            data,
        });
        return { proofId: proof._id.toString(), filename: proof.filename };
    },

    get: async (paymentRequestId: string, proofId: string, actor: AuthenticatedUser) => {
        await findRequestForActor(paymentRequestId, actor);
        const proof = await PaymentProofModel.findOne({ _id: proofId, paymentRequestId }).select('+data');
        if (!proof) throw new NotFoundError('Payment proof not found');
        return { data: proof.data, contentType: proof.contentType, filename: proof.filename };
    },

    findOwnedProof: async (paymentRequestId: string, proofId: string, actor: AuthenticatedUser) => {
        const proof = await PaymentProofModel.findOne({ _id: proofId, paymentRequestId, uploadedBy: actor.sub });
        if (!proof) throw new NotFoundError('Payment proof not found');
        return proof;
    },
};

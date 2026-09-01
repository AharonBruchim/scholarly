// Error handling

// Authentication
export {
    type AuthenticatedRequest,
    type AuthenticatedUser,
    authenticateJWT,
} from './auth';
// Database utilities
export { transaction } from './db/mongoose';
export {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ServiceError,
    UnauthorizedError,
    UserNotFoundError,
    ValidationError,
} from './errors';
// Express utilities
export { errorMiddleware } from './express/error';
export { validateRequest, wrapController, wrapMiddleware } from './express/wrappers';
// Logger utilities
export { logger } from './logger/index';
export { loggerMiddleware } from './logger/middleware';
// Type utilities
export type { Prettify } from './types';
// Zod utilities
export {
    parseZod,
    safeParseZod,
    type TypedRequest,
    zodMongoObjectId,
} from './zod';

// Common helpers
export const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unexpected error';
};

export const formatCurrency = (amount: number, currency = 'ILS') =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);

export const isTruthy = (value: unknown): boolean => Boolean(value);

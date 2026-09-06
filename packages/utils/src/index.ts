// Error handling

// Authentication
export {
    type AuthenticatedRequest,
    type AuthenticatedUser,
    authenticateJWT,
} from './auth';
export {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ServiceError,
    UnauthorizedError,
    UserNotFoundError,
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
    type TypedRequest,
    zodMongoObjectId,
} from './zod';

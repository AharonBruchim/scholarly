// Error handling
export {
  ServiceError,
  UserNotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "./errors.js";

// Authentication
export { authenticateJWT, type AuthenticatedRequest } from "./auth.js";

// Type utilities
export type { Prettify } from "./types.js";

// Zod utilities
export {
  zodMongoObjectId,
  type TypedRequest,
  parseZod,
  safeParseZod,
} from "./zod.js";

// Express utilities
export { errorMiddleware } from "./express/error.js";
export { wrapMiddleware, wrapController, validateRequest } from "./express/wrappers.js";

// Logger utilities
export { logger } from "./logger/index.js";
export { loggerMiddleware } from "./logger/middleware.js";

// Database utilities
export { transaction } from "./db/mongoose.js";

// Common helpers
export const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
};

export const formatCurrency = (amount: number, currency = "ILS") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);

export const isTruthy = (value: unknown): boolean => Boolean(value);

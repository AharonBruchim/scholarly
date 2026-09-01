// Error handling
export {
  ServiceError,
  UserNotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "./errors";

// Authentication
export {
  authenticateJWT,
  type AuthenticatedRequest,
  type AuthenticatedUser,
} from "./auth";

// Type utilities
export type { Prettify } from "./types";

// Zod utilities
export {
  zodMongoObjectId,
  type TypedRequest,
  parseZod,
  safeParseZod,
} from "./zod";

// Express utilities
export { errorMiddleware } from "./express/error";
export { wrapMiddleware, wrapController, validateRequest } from "./express/wrappers";

// Logger utilities
export { logger } from "./logger/index";
export { loggerMiddleware } from "./logger/middleware";

// Database utilities
export { transaction } from "./db/mongoose";

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

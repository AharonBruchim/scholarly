export class ServiceError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code = "SERVICE_ERROR") {
        super(message);
        this.name = "ServiceError";
        this.statusCode = statusCode;
        this.code = code;
    }
}
export class UserNotFoundError extends ServiceError {
    constructor(id) {
        super(`No user found with id ${id}`, 404, "USER_NOT_FOUND");
    }
}
export class ValidationError extends ServiceError {
    constructor(message) {
        super(message, 400, "VALIDATION_ERROR");
    }
}
export class UnauthorizedError extends ServiceError {
    constructor(message = "Unauthorized") {
        super(message, 401, "UNAUTHORIZED");
    }
}
export class ForbiddenError extends ServiceError {
    constructor(message = "Forbidden") {
        super(message, 403, "FORBIDDEN");
    }
}
export class NotFoundError extends ServiceError {
    constructor(message = "Not Found") {
        super(message, 404, "NOT_FOUND");
    }
}
export class ConflictError extends ServiceError {
    constructor(message) {
        super(message, 409, "CONFLICT");
    }
}
//# sourceMappingURL=errors.js.map
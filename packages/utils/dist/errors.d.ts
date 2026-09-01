export declare class ServiceError extends Error {
    readonly statusCode: number;
    readonly code: string;
    constructor(message: string, statusCode?: number, code?: string);
}
export declare class UserNotFoundError extends ServiceError {
    constructor(id: string);
}
export declare class ValidationError extends ServiceError {
    constructor(message: string);
}
export declare class UnauthorizedError extends ServiceError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ServiceError {
    constructor(message?: string);
}
export declare class NotFoundError extends ServiceError {
    constructor(message?: string);
}
export declare class ConflictError extends ServiceError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map
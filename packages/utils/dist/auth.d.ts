import { Request, Response, NextFunction } from "express";
export interface AuthenticatedRequest extends Request {
    user?: any;
}
export declare const authenticateJWT: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map
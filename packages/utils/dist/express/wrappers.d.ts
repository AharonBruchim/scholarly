import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import { TypedRequest } from "../zod.js";
export declare const wrapMiddleware: (func: (req: Request, res?: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const wrapController: (func: (req: TypedRequest<AnyZodObject>, res: Response, next?: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=wrappers.d.ts.map
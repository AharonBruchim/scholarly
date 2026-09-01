import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import { TypedRequest } from "../zod.js";

export const wrapMiddleware = (
  func: (req: Request, res?: Response) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    func(req, res).then(() => next()).catch(next);
  };
};

export const wrapController = (
  func: (req: TypedRequest<AnyZodObject>, res: Response, next?: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    func(req as TypedRequest<AnyZodObject>, res, next).catch(next);
  };
};

export const validateRequest = (schema: AnyZodObject) => {
  return wrapMiddleware(async (req: Request) => {
    const { body, query, params } = req;
    const validated = await schema.parseAsync({ body, query, params });

    req.body = validated.body;
    req.query = validated.query;
    req.params = validated.params;
  });
};

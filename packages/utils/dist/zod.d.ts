import { Request } from "express";
import { AnyZodObject, z } from "zod";
import { Prettify } from "./types.js";
export declare const zodMongoObjectId: z.ZodString;
export type TypedRequest<T extends AnyZodObject> = Prettify<Request<z.infer<T>["params"], unknown, z.infer<T>["body"], z.infer<T>["query"]>>;
export declare const parseZod: <T>(schema: z.ZodType<T>, input: unknown) => T;
export declare const safeParseZod: <T>(schema: z.ZodType<T>, input: unknown) => z.SafeParseReturnType<T, T>;
//# sourceMappingURL=zod.d.ts.map
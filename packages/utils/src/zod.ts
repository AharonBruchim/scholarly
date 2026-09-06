import type { Request } from 'express';
import { type AnyZodObject, z } from 'zod';
import type { Prettify } from './types';

export const zodMongoObjectId = z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid ObjectId' });

export type TypedRequest<T extends AnyZodObject> = Prettify<Request<z.infer<T>['params'], unknown, z.infer<T>['body'], z.infer<T>['query']>>;

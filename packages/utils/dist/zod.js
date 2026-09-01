import { z } from "zod";
export const zodMongoObjectId = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid ObjectId" });
export const parseZod = (schema, input) => schema.parse(input);
export const safeParseZod = (schema, input) => schema.safeParse(input);
//# sourceMappingURL=zod.js.map
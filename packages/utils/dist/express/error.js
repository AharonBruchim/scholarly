import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { ServiceError } from "../errors.js";
export const errorMiddleware = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
        res.status(400).send({
            type: error.name,
            message: fromZodError(error).message,
        });
    }
    else if (error instanceof ServiceError) {
        res.status(error.statusCode).send({
            type: error.name,
            message: error.message,
            code: error.code,
        });
    }
    else {
        res.status(500).send({
            type: error.name,
            message: error.message,
        });
    }
};
//# sourceMappingURL=error.js.map
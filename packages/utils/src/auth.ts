import jwt, { VerifyErrors } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  jwt.verify(token, SECRET_KEY, (err: VerifyErrors | null, user: any) => {
    if (err) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    req.user = user;
    next();
  });
};

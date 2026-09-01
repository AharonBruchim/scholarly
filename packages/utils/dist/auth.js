import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";
export const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        req.user = user;
        next();
    });
};
//# sourceMappingURL=auth.js.map
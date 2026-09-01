import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const authRouter = Router();

const userRoleSchema = z.enum(['teacher', 'student']);

const registerSchema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: userRoleSchema,
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
});

type UserRecord = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'teacher' | 'student';
};

const users = new Map<string, UserRecord>();
const JWT_SECRET = process.env.JWT_SECRET ?? 'scholarly-dev-secret';

const signToken = (user: Pick<UserRecord, 'id' | 'role' | 'email'>) =>
    jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '7d' },
    );

const sanitizeUser = (user: UserRecord) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
});

authRouter.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ message: 'Invalid registration payload.' });
        return;
    }

    const { name, email, password, role } = parsed.data;
    const existingUser = [...users.values()].find((user) => user.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
        res.status(409).json({ message: 'User already exists.' });
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const userRecord: UserRecord = {
        id,
        name,
        email,
        passwordHash,
        role,
    };

    users.set(id, userRecord);

    const user = sanitizeUser(userRecord);
    const accessToken = signToken(user);

    res.status(201).json({
        user,
        tokens: {
            accessToken,
            refreshToken: signToken({ ...user, id: user.id }),
        },
    });
});

authRouter.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ message: 'Invalid login payload.' });
        return;
    }

    const { email, password } = parsed.data;
    const userRecord = [...users.values()].find((user) => user.email.toLowerCase() === email.toLowerCase());

    if (!userRecord) {
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
    }

    const isValidPassword = await bcrypt.compare(password, userRecord.passwordHash);

    if (!isValidPassword) {
        res.status(401).json({ message: 'Invalid email or password.' });
        return;
    }

    const user = sanitizeUser(userRecord);
    const accessToken = signToken(user);

    res.json({
        user,
        tokens: {
            accessToken,
            refreshToken: signToken({ ...user, id: user.id }),
        },
    });
});

authRouter.get('/me', (req, res) => {
    const authorization = req.headers.authorization ?? '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: 'teacher' | 'student' };
        const userRecord = users.get(payload.sub);

        if (!userRecord) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        res.json({ user: sanitizeUser(userRecord) });
    } catch {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

export { authRouter };

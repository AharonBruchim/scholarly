import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

const sharedKeys = ['JWT_SECRET', 'MONGO_URI'];
const usersEnvPath = resolve(process.cwd(), '../users/.env');

try {
    const localEnvironment = parse(readFileSync(usersEnvPath));

    for (const key of sharedKeys) {
        if (!process.env[key] && localEnvironment[key]) process.env[key] = localEnvironment[key];
    }
} catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}

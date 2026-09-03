import { ServiceError } from '@scholarly/utils';
import bcrypt from 'bcrypt';

const MIN_BCRYPT_ROUNDS = 10;
const MAX_BCRYPT_ROUNDS = 15;

const envValue = process.env.BCRYPT_ROUNDS;

if (!envValue) {
    throw new ServiceError('FATAL: BCRYPT_ROUNDS environment variable is missing.');
}

const BCRYPT_ROUNDS = Number.parseInt(envValue, 10);

if (!Number.isInteger(BCRYPT_ROUNDS) || BCRYPT_ROUNDS < MIN_BCRYPT_ROUNDS || BCRYPT_ROUNDS > MAX_BCRYPT_ROUNDS) {
    throw new ServiceError(`FATAL: BCRYPT_ROUNDS must be an integer between ${MIN_BCRYPT_ROUNDS} and ${MAX_BCRYPT_ROUNDS}`);
}

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = (password: string, passwordHash: string): Promise<boolean> => bcrypt.compare(password, passwordHash);

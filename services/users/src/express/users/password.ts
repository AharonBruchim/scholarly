import bcrypt from 'bcrypt';

const DEFAULT_BCRYPT_ROUNDS = 12;
const MIN_BCRYPT_ROUNDS = 10;
const MAX_BCRYPT_ROUNDS = 15;

function getBcryptRounds(): number {
    const configuredRounds = Number.parseInt(
        process.env.BCRYPT_ROUNDS ?? String(DEFAULT_BCRYPT_ROUNDS),
        10,
    );

    if (
        !Number.isInteger(configuredRounds)
        || configuredRounds < MIN_BCRYPT_ROUNDS
        || configuredRounds > MAX_BCRYPT_ROUNDS
    ) {
        throw new Error(
            `BCRYPT_ROUNDS must be an integer between ${MIN_BCRYPT_ROUNDS} and ${MAX_BCRYPT_ROUNDS}`,
        );
    }

    return configuredRounds;
}

export const hashPassword = (password: string): Promise<string> => (
    bcrypt.hash(password, getBcryptRounds())
);

export const verifyPassword = (password: string, passwordHash: string): Promise<boolean> => (
    bcrypt.compare(password, passwordHash)
);

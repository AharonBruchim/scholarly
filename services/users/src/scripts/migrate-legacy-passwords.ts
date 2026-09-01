import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { config } from '../config';
import { hashPassword } from '../express/users/password';

const CONFIRM_FLAG = '--confirm';

async function migrateLegacyPasswords() {
    await mongoose.connect(config.mongo.uri);

    const collection = mongoose.connection.collection(config.mongo.usersCollectionName);
    const legacyFilter = {
        password: { $type: 'string' as const },
        passwordHash: { $exists: false },
    };
    const legacyCount = await collection.countDocuments(legacyFilter);

    if (!process.argv.includes(CONFIRM_FLAG)) {
        console.info(`Found ${legacyCount} legacy password record(s).`);
        console.info(`Run again with ${CONFIRM_FLAG} to hash them and remove the plaintext field.`);
        return;
    }

    let migratedCount = 0;
    let resetRequiredCount = 0;
    const cursor = collection.find(legacyFilter, { projection: { _id: 1, password: 1 } });

    for await (const document of cursor) {
        if (typeof document.password !== 'string') {
            continue;
        }

        const passwordIsTooLong = new TextEncoder().encode(document.password).byteLength > 72;
        const passwordToHash = passwordIsTooLong
            ? randomBytes(32).toString('hex')
            : document.password;
        const passwordHash = await hashPassword(passwordToHash);
        const result = await collection.updateOne(
            {
                _id: document._id,
                password: document.password,
                passwordHash: { $exists: false },
            },
            {
                $set: {
                    passwordHash,
                    ...(passwordIsTooLong ? { passwordResetRequired: true } : {}),
                },
                $unset: { password: '' },
            },
        );

        migratedCount += result.modifiedCount;
        resetRequiredCount += passwordIsTooLong ? result.modifiedCount : 0;
    }

    console.info(`Migrated ${migratedCount} of ${legacyCount} legacy password record(s).`);
    if (resetRequiredCount > 0) {
        console.info(`${resetRequiredCount} account(s) require a password reset because their legacy password exceeded bcrypt's byte limit.`);
    }
}

migrateLegacyPasswords()
    .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : 'Password migration failed');
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });

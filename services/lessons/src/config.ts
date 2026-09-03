import 'dotenv/config';
import env from 'env-var';

export const config = {
    service: {
        port: env.get('PORT').default(6000).asPortNumber(),
    },
    cors: {
        origins: env.get('CORS_ORIGIN').required().asArray(),
    },
    mongo: {
        uri: env.get('MONGO_URI').default('mongodb://localhost/amanPolls').asString(),
        usersCollectionName: 'users',
    },
};

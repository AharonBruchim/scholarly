import 'dotenv/config';
import env from 'env-var';

export const config = {
    service: {
        port: env.get('PORT').default(8000).asPortNumber(),
    },
    cors: {
        origins: env.get('CORS_ORIGIN').required().asArray(),
    },
    web: {
        appUrl: env.get('WEB_APP_URL').required().asUrlString().replace(/\/+$/, ''),
    },
    mongo: {
        uri: env.get('MONGO_URI').default('mongodb://localhost/amanPolls').asString(),
        usersCollectionName: 'users',
    },
};

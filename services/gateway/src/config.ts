import 'dotenv/config';
import env from 'env-var';

export const config = {
    service: {
        port: env.get('PORT').default(3000).asPortNumber(),
        requestTimeout: env.get('REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    users: {
        uri: env.get('USERS_SERVICE_URI').default('http://users:5000').asString(),
        baseRoute: env.get('USERS_BASE_ROUTE').default('/api/users').asString(),
        authBaseRoute: env.get('AUTH_BASE_ROUTE').default('/api/auth').asString(),
    },
    billing: {
        uri: env.get('BILLING_SERVICE_URI').default('http://billing:8000').asString(),
        baseRoute: env.get('BILLING_BASE_ROUTE').default('/api/billing').asString(),
    },
    lessons: {
        uri: env.get('LESSONS_SERVICE_URI').default('http://lessons:6000').asString(),
        baseRoute: env.get('LESSONS_BASE_ROUTE').default('/api/lessons').asString(),
    },
};

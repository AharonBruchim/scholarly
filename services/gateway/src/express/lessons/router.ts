import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config';

export const lessonsRouter = Router();

const {
    lessons: { uri, baseRoute },
    service,
} = config;
const target = `${uri.replace(/\/$/, '')}${baseRoute}`;

lessonsRouter.use(
    '/',
    createProxyMiddleware({
        target,
        on: {
            proxyReq: fixRequestBody,
        },
        proxyTimeout: service.requestTimeout,
    }),
);

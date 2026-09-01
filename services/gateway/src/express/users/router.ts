import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config';

export const usersRouter = Router();

const {
    users: { uri, baseRoute },
    service,
} = config;
const target = `${uri.replace(/\/$/, '')}${baseRoute}`;

usersRouter.use(
    '/',
    createProxyMiddleware({
        target,
        on: {
            proxyReq: fixRequestBody,
        },
        proxyTimeout: service.requestTimeout,
    }),
);

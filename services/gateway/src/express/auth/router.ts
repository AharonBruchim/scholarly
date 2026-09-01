import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config';

export const authRouter = Router();

const { users: { uri, authBaseRoute }, service } = config;
const target = `${uri.replace(/\/$/, '')}${authBaseRoute}`;

authRouter.use(
    '/',
    createProxyMiddleware({
        target,
        on: {
            proxyReq: fixRequestBody,
        },
        proxyTimeout: service.requestTimeout,
    }),
);

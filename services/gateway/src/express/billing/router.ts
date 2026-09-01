import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config';

export const billingRouter = Router();

const {
    billing: { uri, baseRoute },
    service,
} = config;
const target = `${uri.replace(/\/$/, '')}${baseRoute}`;

billingRouter.use(
    '/',
    createProxyMiddleware({
        target,
        on: {
            proxyReq: fixRequestBody,
        },
        proxyTimeout: service.requestTimeout,
    }),
);

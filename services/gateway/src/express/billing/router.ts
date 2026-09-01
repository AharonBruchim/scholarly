import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config';

export const billingRouter = Router();

const { billing: { uri }, service } = config;

billingRouter.use(
    '/',
    createProxyMiddleware({
        target: uri,
        on: {
            proxyReq: fixRequestBody, 
        },
        proxyTimeout: service.requestTimeout,
    })
);

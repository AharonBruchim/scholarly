import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config.js';

export const lessonsRouter = Router();

const { lessons: { uri }, service } = config;

lessonsRouter.use(
    '/',
    createProxyMiddleware({
        target: uri,
        on: {
            proxyReq: fixRequestBody, 
        },
        proxyTimeout: service.requestTimeout,
    })
);
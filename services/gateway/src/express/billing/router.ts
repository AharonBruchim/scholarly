import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config.js';

export const usersRouter = Router();

const { billing: { uri }, service } = config;

usersRouter.use(
    '/',
    createProxyMiddleware({
        target: uri,
        on: {
            proxyReq: fixRequestBody, 
        },
        proxyTimeout: service.requestTimeout,
    })
);
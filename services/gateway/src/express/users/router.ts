import { Router } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { config } from '../../config';

export const usersRouter = Router();

const { users: { uri }, service } = config;

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
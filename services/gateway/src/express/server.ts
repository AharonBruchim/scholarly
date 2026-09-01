import { once } from 'events';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import cors from 'cors';
import { loggerMiddleware, errorMiddleware } from '@scholarly/utils';
import { appRouter } from './router.js';

export class Server {
    private app: express.Application;

    private http?: http.Server;

    constructor(private port: number) {
        this.app = Server.createExpressApp();
    }

    static createExpressApp() {
        const app = express();
        
        const allowedOrigins = process.env['CORS_ORIGIN']
            ? process.env['CORS_ORIGIN'].split(',').map((origin) => origin.trim())
            : ['http://localhost:5000', 'http://localhost:5173'];

        const corsOptions: cors.CorsOptions = {
            origin: allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        };

        app.use(cors(corsOptions));
        app.options('*', cors(corsOptions));

        app.use(
            helmet({
                crossOriginResourcePolicy: { policy: 'cross-origin' },
            })
        );

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.use(loggerMiddleware);
        app.use(appRouter);
        app.use(errorMiddleware);

        return app;
    }

    async start() {
        this.http = this.app.listen(this.port);
        await once(this.http, 'listening');
    }
}
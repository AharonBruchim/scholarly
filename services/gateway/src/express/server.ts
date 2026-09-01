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
        app.use(
            cors({
                origin: process.env['CORS_ORIGIN'] ? process.env['CORS_ORIGIN'] : ['http://localhost:5000','http://localhost:5173' ]
            }),
        );

        app.use(helmet());
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

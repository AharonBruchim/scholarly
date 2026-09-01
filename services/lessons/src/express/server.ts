import { once } from 'node:events';
import type http from 'node:http';
import { errorMiddleware, loggerMiddleware } from '@scholarly/utils';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { appRouter } from './router';

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
                origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : ['http://localhost:5000'],
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

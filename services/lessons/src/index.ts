import { logger } from '@scholarly/utils';
import mongoose from 'mongoose';
import { config } from './config';
import { Server } from './express/server';

const { mongo, service } = config;

const assertRuntimeConfig = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 characters before the lessons service can start');
    }
};

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.uri);

    logger.info('Mongo connection established');
};

const main = async () => {
    assertRuntimeConfig();
    await initializeMongo();

    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch(logger.error);

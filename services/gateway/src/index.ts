import { logger } from '@scholarly/utils';
import { config } from './config';
import { Server } from './express/server';

const { service } = config;

const main = async () => {
    const server = new Server(service.port);

    await server.start();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch(logger.error);

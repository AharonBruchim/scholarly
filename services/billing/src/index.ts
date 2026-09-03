import { logger } from '@scholarly/utils';
import mongoose from 'mongoose';
import { config } from './config';
import { AutomationManager } from './express/automation/manager';
import { PaymentRequestModel } from './express/automation/model';
import { Server } from './express/server';

const { mongo, service } = config;

const assertRuntimeConfig = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 characters before the billing service can start');
    }
};

const startAutomationScheduler = () => {
    if (process.env.AUTOMATION_SCHEDULER_ENABLED === 'false') return;
    const runReminders = () => AutomationManager.queueDueReminders().catch((error) => logger.error('Reminder automation failed', error));
    const runDeliveries = () => AutomationManager.processDueDeliveries().catch((error) => logger.error('Delivery automation failed', error));
    const runMonthly = () =>
        AutomationManager.generateMonthlyPaymentRequests().catch((error) => logger.error('Monthly payment request automation failed', error));
    void runReminders();
    void runDeliveries();
    void runMonthly();
    setInterval(runReminders, 60_000).unref();
    setInterval(runDeliveries, 15_000).unref();
    setInterval(runMonthly, 6 * 60 * 60 * 1000).unref();
};

const initializeMongo = async () => {
    logger.info('Connecting to Mongo...');

    await mongoose.connect(mongo.uri);

    await PaymentRequestModel.updateMany({}, [
        {
            $set: {
                source: { $ifNull: ['$source', 'automatic'] },
                scheduledAt: { $ifNull: ['$scheduledAt', { $ifNull: ['$generatedAt', '$createdAt'] }] },
                requestNumber: {
                    $ifNull: ['$requestNumber', { $concat: ['DR-LEGACY-', { $toUpper: { $substrBytes: [{ $toString: '$_id' }, 0, 8] } }] }],
                },
            },
        },
    ]);

    logger.info('Mongo connection established');
};

const main = async () => {
    assertRuntimeConfig();
    await initializeMongo();

    const server = new Server(service.port);

    await server.start();

    startAutomationScheduler();

    logger.info(`Server started on port: ${service.port}`);
};

main().catch(logger.error);

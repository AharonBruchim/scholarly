export const MongoCollections = {
    USERS: 'users',
    USER_REFRESH_SESSIONS: 'users_refresh_sessions',
    LESSONS: 'lessons',
    LESSON_REMINDER_JOBS: 'lessons_reminder_jobs',
    BILLING: 'billing',
    BILLING_DELIVERY_OUTBOX: 'billing_delivery_outbox',
    BILLING_SENDER_CONNECTIONS: 'billing_sender_connections',
    BILLING_OAUTH_STATES: 'billing_oauth_states',
    BILLING_LESSON_MESSAGES: 'billing_lesson_messages',
} as const;

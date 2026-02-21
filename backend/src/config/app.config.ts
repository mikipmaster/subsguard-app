export const config = {
    port: Number.parseInt(process.env.PORT ?? '', 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:19006'],
  };
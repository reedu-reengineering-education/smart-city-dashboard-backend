import asyncRedis from 'async-redis';

// checks if we are running in production mode
const isProduction =
  process.env.NODE_ENV !== undefined && process.env.NODE_ENV === 'production';

const client = asyncRedis.createClient({
  host: isProduction ? 'redis' : '127.0.0.1',
});

client.on('error', (error) => {
  console.error(error);
});

export { client };

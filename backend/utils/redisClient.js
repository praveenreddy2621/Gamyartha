const redis = require('redis');

let client;
let isRedisAvailable = false;

const initRedis = async () => {
    if (client) return client;

    // Default to localhost:6379 if REDIS_URL not set
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    client = redis.createClient({
        url: url,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 3) {
                    console.warn('❌ Redis connection failed after 3 retries. Caching disabled.');
                    return new Error('Redis connection failed');
                }
                return Math.min(retries * 100, 3000);
            }
        }
    });

    client.on('error', (err) => {
        // Suppress errors if we already know it's down, or just log simplified message
        if (isRedisAvailable) {
            console.error('Redis Client Error', err.message);
        }
        isRedisAvailable = false;
    });

    client.on('connect', () => {
        console.log('✅ Connected to Redis');
        isRedisAvailable = true;
    });

    try {
        await client.connect();
    } catch (e) {
        console.warn('⚠️ Could not connect to Redis. Application will run without caching.');
        isRedisAvailable = false;
    }

    return client;
};

const getClient = () => client;

// Helper to cache DB results
// key: cache string key
// ttlSeconds: time to live
// fetcher: async function to get data if cache miss
const getOrSet = async (key, ttlSeconds, fetcher) => {
    if (!client || !isRedisAvailable || !client.isOpen) {
        // Fallback if redis not connected
        return await fetcher();
    }

    try {
        const cached = await client.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        const data = await fetcher();
        if (data) {
            await client.setEx(key, ttlSeconds, JSON.stringify(data));
        }
        return data;
    } catch (error) {
        // console.error(`Redis getOrSet error for key ${key}:`, error); // Optional logging
        return await fetcher(); // Fallback
    }
};

// Helper to invalidate cache
const invalidate = async (keyPattern) => {
    if (!client || !isRedisAvailable || !client.isOpen) return;

    try {
        // For simplicity in this project:
        await client.del(keyPattern);
    } catch (error) {
        // console.error(`Redis deletion error for ${keyPattern}:`, error);
    }
};

module.exports = { initRedis, getClient, getOrSet, invalidate };

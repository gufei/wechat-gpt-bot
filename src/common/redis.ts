import {createClient} from 'redis';

const RedisClient = createClient();

RedisClient.on('error', err => console.log('Redis Client Error', err));

RedisClient.connect().then(() => console.log('Redis Client Connected'));

export default RedisClient;

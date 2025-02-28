import Redis from 'ioredis';

const valkey = new Redis(process.env.VALKEY_URL!);

valkey.on('connect', () => console.log('Connected to Valkey (Redis) for MFA'));
valkey.on('error', (err) => console.error('Valkey error:', err));

export default valkey;

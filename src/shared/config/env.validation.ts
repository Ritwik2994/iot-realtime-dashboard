import { z } from 'zod';

import { NodeEnv } from '../enum/common.enum';

export const envSchema = z.object({
  NODE_ENV: z.nativeEnum(NodeEnv),
  PORT: z.string().transform(Number),
  DB_MONGO_URI: z.string().url(),
  ALLOWED_DOMAINS: z.string().url(),
  THROTTLE_TTL: z.string().transform(Number),
  THROTTLE_LIMIT: z.string().transform(Number),
  SERVER_SECRET: z.string().min(1),
  ACCESS_TOKEN_EXPIRATION_TIME: z.string().transform(Number),
  ENCRYPTION_KEY_32_BYTE: z.string().length(32),
  IV_KEY: z.string(),
});

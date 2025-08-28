import 'dotenv/config';
import { envSchema } from './env.validation';

const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
};

export const config = validateEnv();

export function getEnvVariable(name: string, defaultValue?: string | undefined): string | any {
  return process.env[name] || defaultValue;
}

const DEFAULTS = {
  NODE_ENV: 'development',
  PORT: 3000,
  API_PREFIX: 'api/v1',
  FRONTEND_URL: 'http://localhost:5173',
  LOG_LEVEL: 'info',
  DB_CONNECT_RETRIES: 3,
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  AZURE_AI_PROJECT_ENDPOINT: '',
  AZURE_AI_AGENT_NAME: '',
  AZURE_AI_DOCTOR_AGENT_NAME: '',
  AZURE_AI_USER_AGENT_NAME: '',
  FOUNDRY_PROJECT_ENDPOINT: '',
  UTAMEDIC_USER_AGENT_ID: '',
  UTAMEDIC_DOCTOR_AGENT_ID: '',
  AI_PROVIDER: 'mock',
  AI_AUTH_MODE: 'default-azure-credential',
  AI_REQUEST_TIMEOUT_MS: 30000,
  AI_MAX_RETRIES: 1,
} as const;

type Environment = Record<string, string | undefined>;

function parseInteger(
  value: string | undefined,
  fallback: number,
  name: string,
  minimum: number,
): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(
      `${name} must be an integer greater than or equal to ${minimum}`,
    );
  }
  return parsed;
}

function validateFrontendUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('FRONTEND_URL must be a valid URL');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== value) {
    throw new Error('FRONTEND_URL must be an HTTP(S) origin without a path');
  }
  return value;
}

function parseBoolean(
  value: string | undefined,
  fallback: boolean,
  name: string,
): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be true or false`);
}

export function validateEnvironment(environment: Environment) {
  const nodeEnv = environment.NODE_ENV ?? DEFAULTS.NODE_ENV;
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test or production');
  }

  const apiPrefix = environment.API_PREFIX ?? DEFAULTS.API_PREFIX;
  if (!/^[a-z0-9][a-z0-9/-]*$/i.test(apiPrefix) || apiPrefix.includes('//')) {
    throw new Error('API_PREFIX must be a path without a leading slash');
  }

  return {
    ...environment,
    NODE_ENV: nodeEnv,
    PORT: parseInteger(environment.PORT, DEFAULTS.PORT, 'PORT', 1),
    API_PREFIX: apiPrefix,
    FRONTEND_URL: validateFrontendUrl(
      environment.FRONTEND_URL ?? DEFAULTS.FRONTEND_URL,
    ),
    LOG_LEVEL: environment.LOG_LEVEL ?? DEFAULTS.LOG_LEVEL,
    DB_REQUIRED: parseBoolean(
      environment.DB_REQUIRED,
      nodeEnv === 'production',
      'DB_REQUIRED',
    ),
    DB_CONNECT_RETRIES: parseInteger(
      environment.DB_CONNECT_RETRIES,
      DEFAULTS.DB_CONNECT_RETRIES,
      'DB_CONNECT_RETRIES',
      1,
    ),
    SUPABASE_URL: environment.SUPABASE_URL ?? DEFAULTS.SUPABASE_URL,
    SUPABASE_ANON_KEY:
      environment.SUPABASE_ANON_KEY ?? DEFAULTS.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY:
      environment.SUPABASE_SERVICE_ROLE_KEY ??
      DEFAULTS.SUPABASE_SERVICE_ROLE_KEY,
    AZURE_AI_PROJECT_ENDPOINT:
      environment.AZURE_AI_PROJECT_ENDPOINT ??
      DEFAULTS.AZURE_AI_PROJECT_ENDPOINT,
    AZURE_AI_AGENT_NAME:
      environment.AZURE_AI_AGENT_NAME ?? DEFAULTS.AZURE_AI_AGENT_NAME,
    AZURE_AI_DOCTOR_AGENT_NAME:
      environment.AZURE_AI_DOCTOR_AGENT_NAME ??
      DEFAULTS.AZURE_AI_DOCTOR_AGENT_NAME,
    AZURE_AI_USER_AGENT_NAME:
      environment.AZURE_AI_USER_AGENT_NAME ?? DEFAULTS.AZURE_AI_USER_AGENT_NAME,
    FOUNDRY_PROJECT_ENDPOINT:
      environment.FOUNDRY_PROJECT_ENDPOINT ?? DEFAULTS.FOUNDRY_PROJECT_ENDPOINT,
    UTAMEDIC_USER_AGENT_ID:
      environment.UTAMEDIC_USER_AGENT_ID ?? DEFAULTS.UTAMEDIC_USER_AGENT_ID,
    UTAMEDIC_DOCTOR_AGENT_ID:
      environment.UTAMEDIC_DOCTOR_AGENT_ID ?? DEFAULTS.UTAMEDIC_DOCTOR_AGENT_ID,
    AI_PROVIDER: environment.AI_PROVIDER ?? DEFAULTS.AI_PROVIDER,
    AI_AUTH_MODE: environment.AI_AUTH_MODE ?? DEFAULTS.AI_AUTH_MODE,
    AI_REQUEST_TIMEOUT_MS: parseInteger(
      environment.AI_REQUEST_TIMEOUT_MS,
      DEFAULTS.AI_REQUEST_TIMEOUT_MS,
      'AI_REQUEST_TIMEOUT_MS',
      1,
    ),
    AI_MAX_RETRIES: parseInteger(
      environment.AI_MAX_RETRIES,
      DEFAULTS.AI_MAX_RETRIES,
      'AI_MAX_RETRIES',
      0,
    ),
  };
}

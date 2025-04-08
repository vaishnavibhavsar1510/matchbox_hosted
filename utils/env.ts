export const getEnvVar = (key: string): string => {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  
  return value;
};

export const env = {
  openaiApiKey: getEnvVar('OPENAI_API_KEY'),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const; 
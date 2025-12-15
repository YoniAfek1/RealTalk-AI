import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Simple health endpoint to report which required secrets are present.
 * Does NOT return the secret values.
 */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const checks = {
    NEXT_PUBLIC_GEMINI_API_KEY: Boolean(process.env.NEXT_PUBLIC_GEMINI_API_KEY),
    GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
  };

  const missing = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([key]) => key);

  res.status(missing.length ? 500 : 200).json({
    status: missing.length ? 'missing' : 'ok',
    missing,
  });
}


/**
 * Logout API Route - Clears authentication cookies
 */

import { NextApiRequest, NextApiResponse } from 'next';

interface LogoutResponse {
  success: boolean;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogoutResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // Clear authentication cookies
  res.setHeader('Set-Cookie', [
    'session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/',
    'user-id=; Max-Age=0; Secure; SameSite=Lax; Path=/'
  ]);

  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}
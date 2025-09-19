/**
 * Login API Route - Handles Firebase Auth token verification
 * Sets secure HTTP-only cookies for SSR authentication
 */

import { adminAuth } from '@/lib/firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Get the ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the ID token with Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Create a session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set secure HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `session=${sessionCookie}; Max-Age=${expiresIn / 1000}; HttpOnly; Secure; SameSite=Lax; Path=/`,
      `user-id=${decodedToken.uid}; Max-Age=${expiresIn / 1000}; Secure; SameSite=Lax; Path=/`
    ]);

    return res.status(200).json({
      success: true,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}
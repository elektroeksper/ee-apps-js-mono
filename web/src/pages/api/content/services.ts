/**
 * Services API Route - Server-side services operations
 * Handles services CRUD operations using Firebase Admin SDK
 */

import { adminDb } from '@/lib/firebase-admin'
import { IServiceItem } from '@/shared-generated'
import { NextApiRequest, NextApiResponse } from 'next'

interface ServicesResponse {
  success: boolean
  data?: IServiceItem[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServicesResponse>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getServices(req, res)
      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`,
        })
    }
  } catch (error) {
    console.error('Services API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

async function getServices(
  req: NextApiRequest,
  res: NextApiResponse<ServicesResponse>
) {
  try {
    const servicesCollection = adminDb
      .collection('content')
      .doc('services')
      .collection('items')
    const snapshot = await servicesCollection.orderBy('order', 'asc').get()

    const services: IServiceItem[] = []
    snapshot.forEach(doc => {
      const data = doc.data() as IServiceItem
      if (data.isActive) {
        // Only return active services for public API
        services.push({ id: doc.id, ...data })
      }
    })

    return res.status(200).json({
      success: true,
      data: services,
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch services',
    })
  }
}

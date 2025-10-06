/**
 * Sliders API Route - Server-side slider operations
 * Handles slider CRUD operations using Firebase Admin SDK
 */

import { adminDb } from '@/lib/firebase-admin'
import { ISliderItem } from '@/shared'
import { NextApiRequest, NextApiResponse } from 'next'

interface SlidersResponse {
  success: boolean
  data?: ISliderItem[]
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SlidersResponse>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getSliders(req, res)
      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`,
        })
    }
  } catch (error) {
    console.error('Sliders API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

async function getSliders(
  req: NextApiRequest,
  res: NextApiResponse<SlidersResponse>
) {
  try {
    const slidersCollection = adminDb
      .collection('content')
      .doc('sliders')
      .collection('items')
    const snapshot = await slidersCollection.orderBy('order', 'asc').get()

    const sliders: ISliderItem[] = []
    snapshot.forEach(doc => {
      const data = doc.data() as ISliderItem
      if (data.isActive) {
        // Only return active sliders for public API
        sliders.push({ id: doc.id, ...data })
      }
    })

    return res.status(200).json({
      success: true,
      data: sliders,
    })
  } catch (error) {
    console.error('Error fetching sliders:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sliders',
    })
  }
}

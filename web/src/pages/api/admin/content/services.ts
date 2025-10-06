/**
 * Admin Services API route
 * Handles CRUD operations for service content using Firebase Admin SDK
 */

import { adminDb, verifyIdToken } from '@/lib/firebase-admin'
import { IServiceItem } from '@/shared'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetServices(req, res)
      case 'POST':
        return await handleCreateService(req, res)
      case 'PUT':
        return await handleUpdateService(req, res)
      case 'DELETE':
        return await handleDeleteService(req, res)
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Admin Services API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function verifyAdminAuth(req: NextApiRequest) {
  // Try to get token from session cookie first, then from Authorization header
  let token = req.cookies.session

  if (!token) {
    // Fallback to Authorization header (for ID tokens)
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    throw new Error('No authentication token found')
  }

  const decodedResult = await verifyIdToken(token)

  if (!decodedResult.success || !decodedResult.user) {
    throw new Error('Invalid token')
  }

  // Check if user has admin privileges
  const isAdmin = decodedResult.user.admin === true

  if (!isAdmin) {
    throw new Error('Insufficient permissions')
  }

  return decodedResult.user
}

async function handleGetServices(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminAuth(req)

    const collection = adminDb
      .collection('content')
      .doc('services')
      .collection('items')
    const snapshot = await collection.orderBy('order', 'asc').get()

    const services: IServiceItem[] = snapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as IServiceItem
    )

    return res.status(200).json({
      success: true,
      data: services,
    })
  } catch (error: any) {
    console.error('Error fetching services:', error)
    if (
      error.message.includes('token') ||
      error.message.includes('permissions')
    ) {
      return res.status(401).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to fetch services' })
  }
}

async function handleCreateService(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await verifyAdminAuth(req)
    const serviceData = req.body

    if (!serviceData || !serviceData.title || !serviceData.description) {
      return res
        .status(400)
        .json({ error: 'Title and description are required' })
    }

    const newService = {
      ...serviceData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.uid,
    }

    const collection = adminDb
      .collection('content')
      .doc('services')
      .collection('items')
    const docRef = await collection.add(newService)

    const createdService = { id: docRef.id, ...newService } as IServiceItem

    return res.status(201).json({
      success: true,
      data: createdService,
    })
  } catch (error: any) {
    console.error('Error creating service:', error)
    if (
      error.message.includes('token') ||
      error.message.includes('permissions')
    ) {
      return res.status(401).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to create service' })
  }
}

async function handleUpdateService(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await verifyAdminAuth(req)
    const { id } = req.query
    const updateData = req.body

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Service ID is required' })
    }

    const updatedData = {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    }

    const docRef = adminDb
      .collection('content')
      .doc('services')
      .collection('items')
      .doc(id)
    await docRef.update(updatedData)

    return res.status(200).json({
      success: true,
      data: { id, ...updatedData },
    })
  } catch (error: any) {
    console.error('Error updating service:', error)
    if (
      error.message.includes('token') ||
      error.message.includes('permissions')
    ) {
      return res.status(401).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to update service' })
  }
}

async function handleDeleteService(req: NextApiRequest, res: NextApiResponse) {
  try {
    await verifyAdminAuth(req)
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Service ID is required' })
    }

    const docRef = adminDb
      .collection('content')
      .doc('services')
      .collection('items')
      .doc(id)
    await docRef.delete()

    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting service:', error)
    if (
      error.message.includes('token') ||
      error.message.includes('permissions')
    ) {
      return res.status(401).json({ error: error.message })
    }
    return res.status(500).json({ error: 'Failed to delete service' })
  }
}

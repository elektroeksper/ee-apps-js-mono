import { adminAuth } from '@/lib/firebase-admin'
import {
  IApiResponse,
  ISettingItem,
  SystemSettingsKey,
} from '@/shared/types/common-types'
import { getFirestore } from 'firebase-admin/firestore'
import { NextApiRequest, NextApiResponse } from 'next'

const db = getFirestore()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<ISettingItem[] | void>>
) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
      })
    }

    const idToken = authHeader.split('Bearer ')[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)

    // Check if user is admin
    if (!decodedToken.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      })
    }

    switch (req.method) {
      case 'GET':
        return await getSettings(req, res)
      case 'PUT':
        return await updateSetting(req, res, decodedToken.uid)
      case 'DELETE':
        return await deleteSetting(req, res)
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`,
        })
    }
  } catch (error) {
    console.error('Settings API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

async function getSettings(
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<ISettingItem[]>>
) {
  try {
    const settingsSnapshot = await db
      .collection('systemSettings')
      .where('isDeleted', '!=', true)
      .get()

    const settings: ISettingItem[] = settingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ISettingItem[]

    return res.status(200).json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    })
  }
}

async function updateSetting(
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<void>>,
  userId: string
) {
  try {
    const { key, value } = req.body

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Key and value are required',
      })
    }

    // Validate the key is a valid SystemSettingsKey
    const validKeys: SystemSettingsKey[] = [
      'emailNotifications',
      'maintenanceMode',
      'userRegistration',
      'emailVerificationRequired',
      'businessAccountApproval',
      'autoBackup',
      'analyticsEnabled',
      'sessionTimeout',
      'maxFileSize',
      'allowedFileTypes',
    ]

    if (!validKeys.includes(key as SystemSettingsKey)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid setting key',
      })
    }

    // Check if setting already exists
    const existingSettingQuery = await db
      .collection('systemSettings')
      .where('key', '==', key)
      .where('isDeleted', '!=', true)
      .limit(1)
      .get()

    const now = new Date()

    if (!existingSettingQuery.empty) {
      // Update existing setting
      const settingDoc = existingSettingQuery.docs[0]
      await settingDoc.ref.update({
        value,
        updatedAt: now,
        updatedBy: userId,
        isActive: true,
      })
    } else {
      // Create new setting
      await db.collection('systemSettings').add({
        key: key as SystemSettingsKey,
        value,
        isActive: true,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
    })
  } catch (error) {
    console.error('Error updating setting:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to update setting',
    })
  }
}

async function deleteSetting(
  req: NextApiRequest,
  res: NextApiResponse<IApiResponse<void>>
) {
  try {
    const { key } = req.query

    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Setting key is required',
      })
    }

    const settingQuery = await db
      .collection('systemSettings')
      .where('key', '==', key)
      .where('isDeleted', '!=', true)
      .limit(1)
      .get()

    if (settingQuery.empty) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found',
      })
    }

    const settingDoc = settingQuery.docs[0]
    await settingDoc.ref.update({
      isDeleted: true,
      updatedAt: new Date(),
    })

    return res.status(200).json({
      success: true,
      message: 'Setting deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting setting:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to delete setting',
    })
  }
}

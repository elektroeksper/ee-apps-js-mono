// Common shared types for the Electro Expert application
import { Timestamp } from 'firebase/firestore'

type SystemSettingsKey =
  | 'emailNotifications'
  | 'maintenanceMode'
  | 'userRegistration'
  | 'emailVerificationRequired'
  | 'businessAccountApproval'
  | 'autoBackup'
  | 'analyticsEnabled'
  | 'sessionTimeout'
  | 'maxFileSize'
  | 'allowedFileTypes'

interface ISettingItem extends IEntity {
  key: SystemSettingsKey
  value: any
  isActive: boolean
}

interface IListItem<T> {
  key: string
  value: T
}

interface IOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
  code?: number
}

interface IEntity {
  id?: string
  isDeleted?: boolean
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
  updatedBy?: string
}

interface IApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface ISystemSettingsService {
  getAll(): Promise<IOperationResult<ISettingItem[]>>
  update(key: SystemSettingsKey, value: any): Promise<IOperationResult<void>>
  remove(key: SystemSettingsKey): Promise<IOperationResult<void>>
}

export type {
  IApiResponse,
  IEntity,
  IListItem,
  IOperationResult,
  ISettingItem,
  ISystemSettingsService,
  SystemSettingsKey,
}

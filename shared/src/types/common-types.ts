// Common shared types for the Electro Expert application

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
  | 'allowedFileTypes';

interface ISettingItem extends IEntity {
  key: SystemSettingsKey;
  value: any;
  isActive: boolean;
}

interface IListItem<T> {
  key: string;
  value: T;
}

interface IOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  code?: number;
}

interface IEntity {
  id?: string;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  apartment?: string;
  district?: string;
  neighborhood?: string;
  postalCode?: string;
  formattedAddress?: string;
  [key: string]: string | undefined;
}

interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface IAddressInfo {
  country?: string;
  city?: string;
  district?: string;
  street?: string;
  formattedAddress?: string;
  [key: string]: string | undefined;
}
interface ISystemSettingsService {
  getAll(): Promise<IOperationResult<ISettingItem[]>>;
  update(key: SystemSettingsKey, value: any): Promise<IOperationResult<void>>;
  remove(key: SystemSettingsKey): Promise<IOperationResult<void>>;
}

export type {
  IAddress, IAddressInfo, IApiResponse, IEntity, IListItem, IOperationResult, ISettingItem, ISystemSettingsService, SystemSettingsKey as SettingsKey, SystemSettingsKey
};


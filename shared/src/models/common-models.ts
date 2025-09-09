import { ISettingItem, SystemSettingsKey } from "../types";

export class SettingItem implements ISettingItem {
  key: SystemSettingsKey;
  value: any;
  isActive: boolean = true;
  id?: string | undefined;
  isDeleted?: boolean | undefined;
  createdAt: Date | undefined;
  updatedAt?: Date | undefined;
  updatedBy?: string | undefined;

  constructor(id?: string, data?: ISettingItem) {
    this.key = data?.key || 'userRegistration'; // default value
    this.value = data?.value;

    if (id) {
      this.id = id;
    }
    if (data) {
      Object.assign(this, { ...data });
    }
  }
}
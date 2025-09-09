import { IAddress } from './common-types';

// Repair Request Status Enum
export enum RepairRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_PARTS = 'waiting_for_parts',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

// Device Category Enum
export enum DeviceCategory {
  TELEVISION = 'television',
  REFRIGERATOR = 'refrigerator',
  WASHING_MACHINE = 'washing_machine',
  DISHWASHER = 'dishwasher',
  AIR_CONDITIONER = 'air_conditioner',
  OVEN = 'oven',
  MICROWAVE = 'microwave',
  VACUUM_CLEANER = 'vacuum_cleaner',
  SMALL_APPLIANCE = 'small_appliance',
  MOBILE_PHONE = 'mobile_phone',
  TABLET = 'tablet',
  LAPTOP = 'laptop',
  DESKTOP = 'desktop',
  OTHER = 'other'
}

// Urgency Level
export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Service Type
export enum ServiceType {
  REPAIR = 'repair',
  MAINTENANCE = 'maintenance',
  INSTALLATION = 'installation',
  DIAGNOSIS = 'diagnosis'
}

// Repair Request Interface
export interface IRepairRequest {
  id: string;
  
  // Customer Information
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: IAddress;
  
  // Device Information
  deviceCategory: DeviceCategory;
  deviceBrand: string;
  deviceModel: string;
  deviceSerialNumber?: string;
  purchaseDate?: Date;
  warrantyStatus?: 'under_warranty' | 'expired' | 'unknown';
  
  // Problem Description
  problemDescription: string;
  problemImages?: string[];
  urgencyLevel: UrgencyLevel;
  
  // Service Details
  serviceType: ServiceType;
  preferredServiceDate?: Date;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
  
  // Assignment and Status
  status: RepairRequestStatus;
  assignedDealerId?: string;
  assignedTechnicianId?: string;
  assignedDealerName?: string;
  assignedTechnicianName?: string;
  
  // Cost and Payment
  estimatedCost?: number;
  finalCost?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer';
  
  // Service History
  statusHistory: IStatusHistoryItem[];
  notes?: IRepairNote[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

// Status History Item
export interface IStatusHistoryItem {
  status: RepairRequestStatus;
  changedAt: Date;
  changedBy: string;
  changedByRole: 'customer' | 'dealer' | 'technician' | 'admin';
  comment?: string;
}

// Repair Note
export interface IRepairNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'customer' | 'dealer' | 'technician' | 'admin';
  content: string;
  isInternal: boolean; // Internal notes not visible to customers
  attachments?: string[];
  createdAt: Date;
}

// Create Repair Request DTO
export interface ICreateRepairRequestDTO {
  // Customer Information
  customerAddress: IAddress;
  
  // Device Information
  deviceCategory: DeviceCategory;
  deviceBrand: string;
  deviceModel: string;
  deviceSerialNumber?: string;
  purchaseDate?: Date;
  warrantyStatus?: 'under_warranty' | 'expired' | 'unknown';
  
  // Problem Description
  problemDescription: string;
  problemImages?: string[];
  urgencyLevel: UrgencyLevel;
  
  // Service Details
  serviceType: ServiceType;
  preferredServiceDate?: Date;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
}

// Update Repair Request DTO
export interface IUpdateRepairRequestDTO {
  status?: RepairRequestStatus;
  assignedDealerId?: string;
  assignedTechnicianId?: string;
  estimatedCost?: number;
  finalCost?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer';
  notes?: string;
}

// Repair Request Filter
export interface IRepairRequestFilter {
  status?: RepairRequestStatus | RepairRequestStatus[];
  customerId?: string;
  assignedDealerId?: string;
  assignedTechnicianId?: string;
  deviceCategory?: DeviceCategory;
  urgencyLevel?: UrgencyLevel;
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
}

// Service Operation Result
export interface IRepairOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Repair Request Service Interface
export interface IRepairRequestService {
  // Customer Operations
  createRepairRequest(request: ICreateRepairRequestDTO): Promise<IRepairOperationResult<IRepairRequest>>;
  getMyRepairRequests(customerId: string): Promise<IRepairOperationResult<IRepairRequest[]>>;
  getRepairRequestById(id: string): Promise<IRepairOperationResult<IRepairRequest>>;
  cancelRepairRequest(id: string, reason: string): Promise<IRepairOperationResult<void>>;
  
  // Dealer/Technician Operations
  getAssignedRepairRequests(filter?: IRepairRequestFilter): Promise<IRepairOperationResult<IRepairRequest[]>>;
  acceptRepairRequest(id: string, estimatedCost?: number): Promise<IRepairOperationResult<void>>;
  rejectRepairRequest(id: string, reason: string): Promise<IRepairOperationResult<void>>;
  updateRepairRequestStatus(id: string, status: RepairRequestStatus, comment?: string): Promise<IRepairOperationResult<void>>;
  assignTechnician(requestId: string, technicianId: string): Promise<IRepairOperationResult<void>>;
  updateRepairRequest(id: string, data: IUpdateRepairRequestDTO): Promise<IRepairOperationResult<void>>;
  
  // Notes Operations
  addNote(requestId: string, note: string, isInternal: boolean, attachments?: string[]): Promise<IRepairOperationResult<void>>;
  getNotes(requestId: string): Promise<IRepairOperationResult<IRepairNote[]>>;
  
  // Admin Operations
  getAllRepairRequests(filter?: IRepairRequestFilter): Promise<IRepairOperationResult<IRepairRequest[]>>;
  assignDealer(requestId: string, dealerId: string): Promise<IRepairOperationResult<void>>;
  
  // Statistics
  getRepairRequestStats(): Promise<IRepairOperationResult<IRepairRequestStats>>;
}

// Statistics Interface
export interface IRepairRequestStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  avgCompletionTime: number; // in hours
  avgCost: number;
  byCategory: Record<DeviceCategory, number>;
  byUrgency: Record<UrgencyLevel, number>;
}

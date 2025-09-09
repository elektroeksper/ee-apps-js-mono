import { auth, db } from '@/config/firebase';
import {
  IRepairRequest,
  IRepairRequestService,
  ICreateRepairRequestDTO,
  IUpdateRepairRequestDTO,
  IRepairRequestFilter,
  IRepairOperationResult,
  IRepairNote,
  IRepairRequestStats,
  RepairRequestStatus,
  IStatusHistoryItem,
  DeviceCategory,
  UrgencyLevel
} from '@/shared-generated';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  addDoc
} from 'firebase/firestore';

class RepairRequestService implements IRepairRequestService {
  private readonly collectionName = 'repairRequests';
  private readonly notesCollectionName = 'repairRequestNotes';

  // Helper method to get current user
  private getCurrentUser() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  // Helper method to create status history item
  private createStatusHistoryItem(
    status: RepairRequestStatus,
    changedBy: string,
    changedByRole: 'customer' | 'dealer' | 'technician' | 'admin',
    comment?: string
  ): IStatusHistoryItem {
    return {
      status,
      changedAt: new Date(),
      changedBy,
      changedByRole,
      comment
    };
  }

  // Customer Operations
  async createRepairRequest(request: ICreateRepairRequestDTO): Promise<IRepairOperationResult<IRepairRequest>> {
    try {
      const user = this.getCurrentUser();
      
      const newRequest: Omit<IRepairRequest, 'id'> = {
        // Customer Information
        customerId: user.uid,
        customerName: user.displayName || 'Unknown',
        customerPhone: user.phoneNumber || '',
        customerEmail: user.email || undefined,
        customerAddress: request.customerAddress,
        
        // Device Information
        deviceCategory: request.deviceCategory,
        deviceBrand: request.deviceBrand,
        deviceModel: request.deviceModel,
        deviceSerialNumber: request.deviceSerialNumber,
        purchaseDate: request.purchaseDate,
        warrantyStatus: request.warrantyStatus,
        
        // Problem Description
        problemDescription: request.problemDescription,
        problemImages: request.problemImages,
        urgencyLevel: request.urgencyLevel,
        
        // Service Details
        serviceType: request.serviceType,
        preferredServiceDate: request.preferredServiceDate,
        preferredTimeSlot: request.preferredTimeSlot,
        
        // Initial Status
        status: RepairRequestStatus.PENDING,
        statusHistory: [
          this.createStatusHistoryItem(
            RepairRequestStatus.PENDING,
            user.uid,
            'customer',
            'Repair request created'
          )
        ],
        notes: [],
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...newRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        data: {
          id: docRef.id,
          ...newRequest
        },
        message: 'Repair request created successfully'
      };
    } catch (error) {
      console.error('Error creating repair request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create repair request'
      };
    }
  }

  async getMyRepairRequests(customerId?: string): Promise<IRepairOperationResult<IRepairRequest[]>> {
    try {
      const user = this.getCurrentUser();
      const userId = customerId || user.uid;
      
      const q = query(
        collection(db, this.collectionName),
        where('customerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const requests: IRepairRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...this.convertFirestoreData(data)
        } as IRepairRequest);
      });

      return {
        success: true,
        data: requests
      };
    } catch (error) {
      console.error('Error fetching repair requests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repair requests'
      };
    }
  }

  async getRepairRequestById(id: string): Promise<IRepairOperationResult<IRepairRequest>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Repair request not found'
        };
      }

      const data = docSnap.data();
      return {
        success: true,
        data: {
          id: docSnap.id,
          ...this.convertFirestoreData(data)
        } as IRepairRequest
      };
    } catch (error) {
      console.error('Error fetching repair request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repair request'
      };
    }
  }

  async cancelRepairRequest(id: string, reason: string): Promise<IRepairOperationResult<void>> {
    try {
      const user = this.getCurrentUser();
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Repair request not found'
        };
      }

      const currentData = docSnap.data();
      
      // Verify ownership
      if (currentData.customerId !== user.uid) {
        return {
          success: false,
          error: 'Unauthorized to cancel this request'
        };
      }

      // Check if can be cancelled
      if (currentData.status === RepairRequestStatus.COMPLETED || 
          currentData.status === RepairRequestStatus.CANCELLED) {
        return {
          success: false,
          error: 'Request cannot be cancelled in its current status'
        };
      }

      const statusHistoryItem = this.createStatusHistoryItem(
        RepairRequestStatus.CANCELLED,
        user.uid,
        'customer',
        reason
      );

      await updateDoc(docRef, {
        status: RepairRequestStatus.CANCELLED,
        statusHistory: arrayUnion(statusHistoryItem),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Repair request cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling repair request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel repair request'
      };
    }
  }

  // Dealer/Technician Operations
  async getAssignedRepairRequests(filter?: IRepairRequestFilter): Promise<IRepairOperationResult<IRepairRequest[]>> {
    try {
      const user = this.getCurrentUser();
      const constraints: QueryConstraint[] = [];

      // Build query based on filter
      if (filter?.status) {
        if (Array.isArray(filter.status)) {
          constraints.push(where('status', 'in', filter.status));
        } else {
          constraints.push(where('status', '==', filter.status));
        }
      }

      if (filter?.assignedDealerId) {
        constraints.push(where('assignedDealerId', '==', filter.assignedDealerId));
      } else {
        // Default to current user's assigned requests
        constraints.push(where('assignedDealerId', '==', user.uid));
      }

      if (filter?.assignedTechnicianId) {
        constraints.push(where('assignedTechnicianId', '==', filter.assignedTechnicianId));
      }

      if (filter?.deviceCategory) {
        constraints.push(where('deviceCategory', '==', filter.deviceCategory));
      }

      if (filter?.urgencyLevel) {
        constraints.push(where('urgencyLevel', '==', filter.urgencyLevel));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const requests: IRepairRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...this.convertFirestoreData(data)
        } as IRepairRequest);
      });

      // Apply additional filters that can't be done in Firestore query
      let filteredRequests = requests;
      
      if (filter?.dateFrom) {
        filteredRequests = filteredRequests.filter(r => 
          new Date(r.createdAt) >= new Date(filter.dateFrom!)
        );
      }
      
      if (filter?.dateTo) {
        filteredRequests = filteredRequests.filter(r => 
          new Date(r.createdAt) <= new Date(filter.dateTo!)
        );
      }
      
      if (filter?.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        filteredRequests = filteredRequests.filter(r => 
          r.customerName.toLowerCase().includes(searchLower) ||
          r.deviceBrand.toLowerCase().includes(searchLower) ||
          r.deviceModel.toLowerCase().includes(searchLower) ||
          r.problemDescription.toLowerCase().includes(searchLower)
        );
      }

      return {
        success: true,
        data: filteredRequests
      };
    } catch (error) {
      console.error('Error fetching assigned repair requests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch assigned repair requests'
      };
    }
  }

  async acceptRepairRequest(id: string, estimatedCost?: number): Promise<IRepairOperationResult<void>> {
    try {
      const user = this.getCurrentUser();
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Repair request not found'
        };
      }

      const currentData = docSnap.data();
      
      if (currentData.status !== RepairRequestStatus.PENDING) {
        return {
          success: false,
          error: 'Request can only be accepted when in pending status'
        };
      }

      const statusHistoryItem = this.createStatusHistoryItem(
        RepairRequestStatus.ACCEPTED,
        user.uid,
        'dealer', // TODO: Get actual role from user profile
        estimatedCost ? `Accepted with estimated cost: ${estimatedCost}` : 'Request accepted'
      );

      const updateData: any = {
        status: RepairRequestStatus.ACCEPTED,
        assignedDealerId: user.uid,
        assignedDealerName: user.displayName || 'Unknown',
        statusHistory: arrayUnion(statusHistoryItem),
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (estimatedCost !== undefined) {
        updateData.estimatedCost = estimatedCost;
      }

      await updateDoc(docRef, updateData);

      return {
        success: true,
        message: 'Repair request accepted successfully'
      };
    } catch (error) {
      console.error('Error accepting repair request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to accept repair request'
      };
    }
  }

  async rejectRepairRequest(id: string, reason: string): Promise<IRepairOperationResult<void>> {
    try {
      const user = this.getCurrentUser();
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Repair request not found'
        };
      }

      const currentData = docSnap.data();
      
      if (currentData.status !== RepairRequestStatus.PENDING) {
        return {
          success: false,
          error: 'Request can only be rejected when in pending status'
        };
      }

      const statusHistoryItem = this.createStatusHistoryItem(
        RepairRequestStatus.REJECTED,
        user.uid,
        'dealer', // TODO: Get actual role from user profile
        reason
      );

      await updateDoc(docRef, {
        status: RepairRequestStatus.REJECTED,
        statusHistory: arrayUnion(statusHistoryItem),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Repair request rejected'
      };
    } catch (error) {
      console.error('Error rejecting repair request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject repair request'
      };
    }
  }

  async updateRepairRequestStatus(
    id: string, 
    status: RepairRequestStatus, 
    comment?: string
  ): Promise<IRepairOperationResult<void>> {
    try {
      const user = this.getCurrentUser();
      
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Repair request not found'
        };
      }

      const statusHistoryItem = this.createStatusHistoryItem(
        status,
        user.uid,
        'technician', // TODO: Get actual role from user profile
        comment
      );

      const updateData: any = {
        status,
        statusHistory: arrayUnion(statusHistoryItem),
        updatedAt: serverTimestamp()
      };

      // Add completion timestamp if status is completed
      if (status === RepairRequestStatus.COMPLETED) {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(docRef, updateData);

      return {
        success: true,
        message: 'Status updated successfully'
      };
    } catch (error) {
      console.error('Error updating repair request status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update status'
      };
    }
  }

  async assignTechnician(requestId: string, technicianId: string): Promise<IRepairOperationResult<void>> {
    try {
      const docRef = doc(db, this.collectionName, requestId);
      
      // TODO: Get technician name from user profile
      await updateDoc(docRef, {
        assignedTechnicianId: technicianId,
        assignedTechnicianName: 'Technician Name', // TODO: Fetch actual name
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Technician assigned successfully'
      };
    } catch (error) {
      console.error('Error assigning technician:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign technician'
      };
    }
  }

  async updateRepairRequest(id: string, data: IUpdateRepairRequestDTO): Promise<IRepairOperationResult<void>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Repair request updated successfully'
      };
    } catch (error) {
      console.error('Error updating repair request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update repair request'
      };
    }
  }

  // Notes Operations
  async addNote(
    requestId: string, 
    note: string, 
    isInternal: boolean, 
    attachments?: string[]
  ): Promise<IRepairOperationResult<void>> {
    try {
      const user = this.getCurrentUser();
      
      const newNote: Omit<IRepairNote, 'id'> = {
        authorId: user.uid,
        authorName: user.displayName || 'Unknown',
        authorRole: 'customer', // TODO: Get actual role from user profile
        content: note,
        isInternal,
        attachments,
        createdAt: new Date()
      };

      await addDoc(collection(db, this.notesCollectionName), {
        ...newNote,
        requestId,
        createdAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Note added successfully'
      };
    } catch (error) {
      console.error('Error adding note:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add note'
      };
    }
  }

  async getNotes(requestId: string): Promise<IRepairOperationResult<IRepairNote[]>> {
    try {
      const q = query(
        collection(db, this.notesCollectionName),
        where('requestId', '==', requestId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notes: IRepairNote[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          ...this.convertFirestoreData(data)
        } as IRepairNote);
      });

      return {
        success: true,
        data: notes
      };
    } catch (error) {
      console.error('Error fetching notes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes'
      };
    }
  }

  // Admin Operations
  async getAllRepairRequests(filter?: IRepairRequestFilter): Promise<IRepairOperationResult<IRepairRequest[]>> {
    try {
      const constraints: QueryConstraint[] = [];

      // Build query based on filter
      if (filter?.status) {
        if (Array.isArray(filter.status)) {
          constraints.push(where('status', 'in', filter.status));
        } else {
          constraints.push(where('status', '==', filter.status));
        }
      }

      if (filter?.customerId) {
        constraints.push(where('customerId', '==', filter.customerId));
      }

      if (filter?.assignedDealerId) {
        constraints.push(where('assignedDealerId', '==', filter.assignedDealerId));
      }

      if (filter?.assignedTechnicianId) {
        constraints.push(where('assignedTechnicianId', '==', filter.assignedTechnicianId));
      }

      if (filter?.deviceCategory) {
        constraints.push(where('deviceCategory', '==', filter.deviceCategory));
      }

      if (filter?.urgencyLevel) {
        constraints.push(where('urgencyLevel', '==', filter.urgencyLevel));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const requests: IRepairRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...this.convertFirestoreData(data)
        } as IRepairRequest);
      });

      // Apply additional filters
      let filteredRequests = requests;
      
      if (filter?.dateFrom) {
        filteredRequests = filteredRequests.filter(r => 
          new Date(r.createdAt) >= new Date(filter.dateFrom!)
        );
      }
      
      if (filter?.dateTo) {
        filteredRequests = filteredRequests.filter(r => 
          new Date(r.createdAt) <= new Date(filter.dateTo!)
        );
      }
      
      if (filter?.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        filteredRequests = filteredRequests.filter(r => 
          r.customerName.toLowerCase().includes(searchLower) ||
          r.deviceBrand.toLowerCase().includes(searchLower) ||
          r.deviceModel.toLowerCase().includes(searchLower) ||
          r.problemDescription.toLowerCase().includes(searchLower)
        );
      }

      return {
        success: true,
        data: filteredRequests
      };
    } catch (error) {
      console.error('Error fetching all repair requests:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch repair requests'
      };
    }
  }

  async assignDealer(requestId: string, dealerId: string): Promise<IRepairOperationResult<void>> {
    try {
      const docRef = doc(db, this.collectionName, requestId);
      
      // TODO: Get dealer name from user profile
      await updateDoc(docRef, {
        assignedDealerId: dealerId,
        assignedDealerName: 'Dealer Name', // TODO: Fetch actual name
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Dealer assigned successfully'
      };
    } catch (error) {
      console.error('Error assigning dealer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign dealer'
      };
    }
  }

  // Statistics
  async getRepairRequestStats(): Promise<IRepairOperationResult<IRepairRequestStats>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      
      const stats: IRepairRequestStats = {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        avgCompletionTime: 0,
        avgCost: 0,
        byCategory: {} as Record<DeviceCategory, number>,
        byUrgency: {} as Record<UrgencyLevel, number>
      };

      let totalCompletionTime = 0;
      let completedCount = 0;
      let totalCost = 0;
      let costCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.total++;

        // Count by status
        switch (data.status) {
          case RepairRequestStatus.PENDING:
            stats.pending++;
            break;
          case RepairRequestStatus.IN_PROGRESS:
          case RepairRequestStatus.ACCEPTED:
          case RepairRequestStatus.WAITING_FOR_PARTS:
            stats.inProgress++;
            break;
          case RepairRequestStatus.COMPLETED:
            stats.completed++;
            
            // Calculate completion time
            if (data.createdAt && data.completedAt) {
              const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
              const completed = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
              const timeDiff = completed.getTime() - created.getTime();
              totalCompletionTime += timeDiff / (1000 * 60 * 60); // Convert to hours
              completedCount++;
            }
            break;
          case RepairRequestStatus.CANCELLED:
            stats.cancelled++;
            break;
        }

        // Count by category
        if (data.deviceCategory) {
          stats.byCategory[data.deviceCategory as DeviceCategory] = 
            (stats.byCategory[data.deviceCategory as DeviceCategory] || 0) + 1;
        }

        // Count by urgency
        if (data.urgencyLevel) {
          stats.byUrgency[data.urgencyLevel as UrgencyLevel] = 
            (stats.byUrgency[data.urgencyLevel as UrgencyLevel] || 0) + 1;
        }

        // Calculate average cost
        if (data.finalCost) {
          totalCost += data.finalCost;
          costCount++;
        }
      });

      // Calculate averages
      stats.avgCompletionTime = completedCount > 0 ? totalCompletionTime / completedCount : 0;
      stats.avgCost = costCount > 0 ? totalCost / costCount : 0;

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching repair request stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      };
    }
  }

  // Helper method to convert Firestore data to proper types
  private convertFirestoreData(data: any): any {
    const converted = { ...data };
    
    // Convert Timestamp to Date
    Object.keys(converted).forEach(key => {
      if (converted[key] && converted[key].toDate) {
        converted[key] = converted[key].toDate();
      }
    });

    return converted;
  }
}

export const repairRequestService = new RepairRequestService();

import axios from 'axios';

export interface CustomerEnquiryPayload {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  requestedCapacityKw: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  subsidyRequired?: boolean;
  monthlyElectricityBill?: number;
  notes?: string;
}

export interface EnquirySubmissionResult {
  success: boolean;
  message: string;
  enquiryNumber?: string;
  enquiryId?: number;
}

export const submitEnquiry = async (payload: CustomerEnquiryPayload): Promise<EnquirySubmissionResult> => {
  try {
    const res = await axios.post('/api/public/v1/enquiries', {
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email || null,
      address: payload.address,
      city: payload.city || 'Chennai',
      state: payload.state || 'Tamil Nadu',
      pincode: payload.pincode || '600001',
      requestedCapacityKw: payload.requestedCapacityKw,
      systemType: payload.systemType,
      subsidyRequired: payload.subsidyRequired !== undefined ? payload.subsidyRequired : true,
      monthlyElectricityBill: payload.monthlyElectricityBill || 0,
      notes: payload.notes || 'Submitted via Vue Customer Portal',
      source: 'CUSTOMER_PORTAL',
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || 'Enquiry registered successfully!',
      enquiryNumber: res.data.enquiryNumber,
      enquiryId: res.data.enquiryId,
    };
  } catch (err: any) {
    console.error('Failed to submit enquiry', err);
    const msg = err.response?.data?.message || err.response?.data?.validationErrors
      ? JSON.stringify(err.response?.data?.validationErrors)
      : err.message || 'Failed to submit enquiry';
    throw new Error(msg);
  }
};

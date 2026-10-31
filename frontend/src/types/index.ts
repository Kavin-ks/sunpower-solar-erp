export type CustomerType = 'RESIDENTIAL' | 'SMALL_FACTORY';
export type SystemType = 'ON_GRID' | 'OFF_GRID';
export type EnquirySource = 'WEBSITE' | 'WHATSAPP' | 'PHONE' | 'MANUAL';
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SURVEY_SCHEDULED' | 'SURVEY_APPROVED' | 'QUOTED' | 'CONVERTED' | 'REJECTED';
export type SurveyStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type OrderStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'DISPATCHED' | 'IN_INSTALLATION' | 'INSTALLED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CASH' | 'CARD';
export type PaymentType = 'ADVANCE' | 'PROGRESS' | 'FULL';
export type SerialNumberStatus = 'IN_STOCK' | 'ALLOCATED' | 'DISPATCHED' | 'INSTALLED' | 'DEFECTIVE' | 'REPLACED';
export type DispatchStatus = 'PENDING' | 'PICKING' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED';
export type InstallationStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type WarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'VOIDED';
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_PARTS' | 'RESOLVED' | 'CUSTOMER_CONFIRMED' | 'CLOSED';
export type SubsidyStatus = 'NOT_STARTED' | 'DOCUMENTS_PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ExpenseCategory = 'PRODUCT_PURCHASE' | 'INSTALLATION' | 'TECHNICIAN_PAYOUT' | 'SERVICE_REPAIR' | 'TRANSPORT' | 'OTHER';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  customerType: CustomerType;
  createdAt: string;
}

export interface EnquiryActivity {
  id: number;
  action: string;
  notes: string;
  performedBy: string;
  createdAt: string;
}

export interface Enquiry {
  id: number;
  enquiryNumber: string;
  customer: Customer;
  requestedCapacityKw: number;
  systemType: SystemType;
  subsidyRequired: boolean;
  monthlyElectricityBill: number;
  source: EnquirySource;
  status: EnquiryStatus;
  assignedTo?: User;
  notes?: string;
  activities?: EnquiryActivity[];
  createdAt: string;
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  email: string;
  skills: string;
  available: boolean;
  active: boolean;
}

export interface SurveyPhoto {
  id: number;
  photoUrl: string;
  caption: string;
  uploadedAt: string;
}

export interface SiteSurvey {
  id: number;
  surveyNumber: string;
  customer: Customer;
  enquiry?: Enquiry;
  technician: Technician;
  scheduledDate: string;
  roofDirection: string;
  roofTilt: string;
  availableRoofAreaSqFt: number;
  cableDistanceMeters: number;
  shadingAssessment: string;
  gridSuitability: string;
  surveyNotes: string;
  status: SurveyStatus;
  approvedBy?: string;
  approvalDate?: string;
  approvalNotes?: string;
  photos: SurveyPhoto[];
  createdAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  productCode: string;
  name: string;
  category: ProductCategory;
  description: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStockLevel: number;
  serialized: boolean;
  defaultWarrantyMonths: number;
  active: boolean;
}

export interface PackageBOMItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  roleInPackage: string;
}

export interface SolarPackage {
  id: number;
  name: string;
  systemType: SystemType;
  capacityKw: number;
  description: string;
  basePrice: number;
  active: boolean;
  bomItems?: PackageBOMItem[];
}

export interface QuotationItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  customer: Customer;
  siteSurvey: SiteSurvey;
  solarPackage?: SolarPackage;
  systemType: SystemType;
  capacityKw: number;
  subtotal: number;
  taxAmount: number;
  installationFee: number;
  totalAmount: number;
  quotationDate: string;
  validityDate: string;
  status: QuotationStatus;
  notes?: string;
  items: QuotationItem[];
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  type: PaymentType;
  status: string;
  referenceNumber: string;
  notes?: string;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customer: Customer;
  quotation: Quotation;
  solarPackage?: SolarPackage;
  systemType: SystemType;
  capacityKw: number;
  totalAmount: number;
  advanceRequired: number;
  totalPaid: number;
  remainingBalance: number;
  orderDate: string;
  status: OrderStatus;
  items: OrderItem[];
  payments: Payment[];
}

export interface InventoryStock {
  id: number;
  product: Product;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  warehouseLocation: string;
}

export interface StockMovement {
  id: number;
  product: Product;
  movementType: string;
  quantity: number;
  referenceNumber: string;
  notes: string;
  performedBy: string;
  createdAt: string;
}

export interface SerialNumberHistory {
  id: number;
  status: SerialNumberStatus;
  eventDescription: string;
  locationOrRecipient: string;
  recordedBy: string;
  createdAt: string;
}

export interface SerialNumber {
  id: number;
  serialCode: string;
  product: Product;
  status: SerialNumberStatus;
  warehouseLocation: string;
  salesOrder?: SalesOrder;
  customer?: Customer;
  purchaseReference?: string;
  dispatchDate?: string;
  deliveryDate?: string;
  history?: SerialNumberHistory[];
}

export interface DispatchItem {
  id: number;
  product: Product;
  quantity: number;
  serialNumber?: SerialNumber;
}

export interface Dispatch {
  id: number;
  dispatchNumber: string;
  salesOrder: SalesOrder;
  customer: Customer;
  status: DispatchStatus;
  dispatchDate?: string;
  deliveryDate?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  dispatchNotes?: string;
  items: DispatchItem[];
}

export interface Warranty {
  id: number;
  warrantyNumber: string;
  serialNumber?: SerialNumber;
  customer: Customer;
  salesOrder: SalesOrder;
  product: Product;
  deliveryDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  durationMonths: number;
  status: WarrantyStatus;
  termsAndConditions: string;
}

export interface InstallationTechnician {
  id: number;
  technician: Technician;
  roleInCrew: string;
  hoursWorked: number;
  payoutAmount: number;
}

export interface InstallationPhoto {
  id: number;
  photoUrl: string;
  stage: string;
  caption: string;
  uploadedAt: string;
}

export interface Installation {
  id: number;
  installationNumber: string;
  salesOrder: SalesOrder;
  customer: Customer;
  scheduledDate: string;
  actualStartTime?: string;
  actualFinishTime?: string;
  installedCapacityKw: number;
  panelMountingConfirmed: boolean;
  wiringConfirmed: boolean;
  earthingConfirmed: boolean;
  testingPassed: boolean;
  testingNotes?: string;
  customerSigneeName?: string;
  customerAcceptanceNote?: string;
  customerSignedAt?: string;
  status: InstallationStatus;
  workNotes?: string;
  assignedTechnicians: InstallationTechnician[];
  photos: InstallationPhoto[];
}

export interface ServicePart {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  coveredByWarranty: boolean;
  finalCharge: number;
}

export interface ServiceActivity {
  id: number;
  action: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface ServiceTicket {
  id: number;
  ticketNumber: string;
  customer: Customer;
  serialNumber?: SerialNumber;
  warranty?: Warranty;
  complaintDescription: string;
  faultCode?: string;
  reportedDate: string;
  assignedTechnician?: Technician;
  status: TicketStatus;
  underWarranty: boolean;
  laborCharges: number;
  partsCharges: number;
  totalCustomerCharges: number;
  diagnosisNotes?: string;
  resolutionNotes?: string;
  customerConfirmed: boolean;
  customerConfirmedAt?: string;
  customerConfirmationNotes?: string;
  activities?: ServiceActivity[];
  parts?: ServicePart[];
}

export interface Expense {
  id: number;
  expenseNumber: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  title: string;
  description: string;
  paidTo: string;
  paymentMethod: string;
  salesOrder?: SalesOrder;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  salesOrder: SalesOrder;
  customer: Customer;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  gstin: string;
  notes?: string;
}

export interface SubsidyApplication {
  id: number;
  applicationNumber: string;
  customer: Customer;
  salesOrder: SalesOrder;
  nationalPortalRegNumber?: string;
  subsidyAmountClaimed: number;
  subsidyAmountApproved: number;
  status: SubsidyStatus;
  submissionDate?: string;
  approvalDate?: string;
  notes?: string;
}

export interface JobProfitability {
  orderId: number;
  orderNumber: string;
  customerName: string;
  systemType: string;
  capacityKw: number;
  orderAmount: number;
  revenueReceived: number;
  hardwareCost: number;
  technicianCost: number;
  recordedExpenses: number;
  totalCost: number;
  netProfit: number;
  profitMarginPercentage: number;
  outstandingBalance: number;
}

export interface DashboardMetrics {
  totalEnquiries: number;
  newEnquiries: number;
  pendingSurveys: number;
  approvedSurveys: number;
  pendingQuotations: number;
  acceptedQuotations: number;
  confirmedOrders: number;
  activeInstallations: number;
  completedInstallations: number;
  pendingInstallations: number;
  totalInvoiced: number;
  totalPaymentsReceived: number;
  totalOutstanding: number;
  totalStockValue: number;
  totalExpenses: number;
  netProfit: number;
  lowStockCount: number;
  openServiceTickets: number;
  revenueTrends: { month: string; revenue: number; cost: number; profit: number }[];
  capacityDistribution: { capacity: string; count: number }[];
  recentJobProfitability: JobProfitability[];
}

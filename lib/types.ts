export type Role = "ADMIN" | "EMPLOYEE" | "PATIENT";

export interface ModulePermission {
  view: boolean;
  edit: boolean;
}

export interface Permissions {
  patients?: ModulePermission;
  agenda?: ModulePermission;
  exams?: ModulePermission;
  financial?: ModulePermission;
  inventory?: ModulePermission;
  employees?: ModulePermission;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string | null;
  staffId?: string | null;
  patientId?: string | null;
  permissions?: Permissions | null;
}

export interface Patient {
  id: string;
  name: string;
  email: string | null;
  cpf: string | null;
  phone: string;
  birthDate: string | null;
  address: string | null;
  notes: string | null;
  portalActive: boolean;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  permissions: Permissions;
  active: boolean;
  createdAt: string;
}

export type AppointmentStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export interface Appointment {
  id: string;
  patientId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  patient: { id: string; name: string; phone: string };
  staff: { id: string; name: string };
}

export type AppointmentRequestStatus = "PENDING" | "CONTACTED" | "DONE";

export interface AppointmentRequest {
  id: string;
  patientId: string;
  status: AppointmentRequestStatus;
  createdAt: string;
  patient: { id: string; name: string; phone: string };
}

export interface Exam {
  id: string;
  patientId: string;
  staffId: string;
  type: string;
  date: string;
  status: string;
  value: number | null;
  notes: string | null;
  attachmentUrl: string | null;
  patient?: { id: string; name: string };
  staff?: { id: string; name: string };
}

export type FinancialType = "PAYABLE" | "RECEIVABLE";
export type FinancialStatus = "PENDING" | "PAID" | "OVERDUE";

export interface FinancialEntry {
  id: string;
  type: FinancialType;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: FinancialStatus;
  attachmentUrl: string | null;
  createdBy: { name: string };
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: number | null;
  supplier: string | null;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string | null;
  createdAt: string;
  staff?: { name: string };
}

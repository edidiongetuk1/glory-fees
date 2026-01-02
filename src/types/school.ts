export type UserRole = 'super_admin' | 'bursar' | 'staff';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export type Section = 'primary' | 'secondary';

export type PrimaryClass = 
  | 'creche' 
  | 'tender_love_1' 
  | 'tender_love_2' 
  | 'nursery_1' 
  | 'nursery_2' 
  | 'primary_1' 
  | 'primary_2' 
  | 'primary_3' 
  | 'primary_4' 
  | 'primary_5';

export type SecondaryClass = 
  | 'jss_1' 
  | 'jss_2' 
  | 'jss_3' 
  | 'sss_1' 
  | 'sss_2' 
  | 'sss_3';

export type SchoolClass = PrimaryClass | SecondaryClass;

export interface Student {
  id: string;
  regNumber: string;
  firstName: string;
  middleName?: string;
  surname: string;
  section: Section;
  class: SchoolClass;
  parentPhone: string;
  yearOfEntry: string;
  isNewIntake: boolean;
  createdAt: Date;
}

export interface AcademicSession {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
}

export type Term = '1st' | '2nd' | '3rd';

export interface TermConfig {
  id: string;
  sessionId: string;
  term: Term;
  isActive: boolean;
  fees: FeeStructure[];
}

export interface FeeStructure {
  class: SchoolClass;
  newIntakeFee: number;
  returningFee: number;
}

export type PaymentMethod = 'cash' | 'pos' | 'transfer';

export interface Payment {
  id: string;
  transactionId: string;
  studentId: string;
  student?: Student;
  sessionId: string;
  termId: string;
  amountPaid: number;
  feePayable: number;
  outstandingBalance: number;
  paymentMethod: PaymentMethod;
  receivedBy: string;
  createdAt: Date;
}

export const PRIMARY_CLASSES: { value: PrimaryClass; label: string }[] = [
  { value: 'creche', label: 'Creche' },
  { value: 'tender_love_1', label: 'Tender Love 1' },
  { value: 'tender_love_2', label: 'Tender Love 2' },
  { value: 'nursery_1', label: 'Nursery 1' },
  { value: 'nursery_2', label: 'Nursery 2' },
  { value: 'primary_1', label: 'Primary 1' },
  { value: 'primary_2', label: 'Primary 2' },
  { value: 'primary_3', label: 'Primary 3' },
  { value: 'primary_4', label: 'Primary 4' },
  { value: 'primary_5', label: 'Primary 5' },
];

export const SECONDARY_CLASSES: { value: SecondaryClass; label: string }[] = [
  { value: 'jss_1', label: 'JSS 1' },
  { value: 'jss_2', label: 'JSS 2' },
  { value: 'jss_3', label: 'JSS 3' },
  { value: 'sss_1', label: 'SSS 1' },
  { value: 'sss_2', label: 'SSS 2' },
  { value: 'sss_3', label: 'SSS 3' },
];

export const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];

export function getClassLabel(classValue: SchoolClass): string {
  const found = ALL_CLASSES.find(c => c.value === classValue);
  return found?.label || classValue;
}

export function getSectionFromClass(classValue: SchoolClass): Section {
  return PRIMARY_CLASSES.some(c => c.value === classValue) ? 'primary' : 'secondary';
}

export function generateRegNumber(
  section: Section,
  yearOfEntry: string,
  serial: number
): string {
  const prefix = section === 'primary' ? 'SG' : 'SGS';
  const serialStr = serial.toString().padStart(3, '0');
  return `${prefix}/${yearOfEntry}/${serialStr}`;
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

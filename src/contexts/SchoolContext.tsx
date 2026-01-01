import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Student,
  AcademicSession,
  TermConfig,
  Payment,
  SchoolClass,
  Section,
  Term,
  FeeStructure,
  generateRegNumber,
  generateTransactionId,
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
} from '@/types/school';

interface SchoolContextType {
  // Sessions
  sessions: AcademicSession[];
  activeSession: AcademicSession | null;
  createSession: (name: string, startYear: number, endYear: number) => void;
  setActiveSession: (sessionId: string) => void;

  // Terms
  terms: TermConfig[];
  activeTerm: TermConfig | null;
  createTerm: (sessionId: string, term: Term) => void;
  setActiveTerm: (termId: string) => void;
  updateTermFees: (termId: string, fees: FeeStructure[]) => void;

  // Students
  students: Student[];
  recentStudents: Student[];
  addStudent: (student: Omit<Student, 'id' | 'regNumber' | 'createdAt'>) => Student;
  getStudentsByClass: (classValue: SchoolClass) => Student[];
  searchStudents: (query: string) => Student[];
  getStudentFee: (student: Student) => number;

  // Payments
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'transactionId' | 'createdAt'>) => Payment;
  getStudentPayments: (studentId: string) => Payment[];
  getStudentBalance: (studentId: string) => number;

  // Analytics
  getTotalExpectedRevenue: () => number;
  getTotalCollected: () => number;
  getDebtorsByClass: () => Record<SchoolClass, Student[]>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Generate initial mock data
function generateMockStudents(): Student[] {
  const students: Student[] = [];
  const names = [
    { first: 'Chidi', middle: 'Emmanuel', surname: 'Okafor' },
    { first: 'Amara', middle: 'Grace', surname: 'Eze' },
    { first: 'Oluwaseun', middle: 'David', surname: 'Adeyemi' },
    { first: 'Fatima', middle: 'Aisha', surname: 'Mohammed' },
    { first: 'Tunde', middle: 'Kayode', surname: 'Bakare' },
    { first: 'Ngozi', middle: 'Blessing', surname: 'Nwosu' },
    { first: 'Emeka', middle: 'Victor', surname: 'Okwu' },
    { first: 'Zainab', middle: 'Halima', surname: 'Yusuf' },
    { first: 'Adaeze', middle: 'Chioma', surname: 'Igwe' },
    { first: 'Babatunde', middle: 'Olumide', surname: 'Ogundimu' },
  ];

  const allClasses = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];
  let primarySerial = 1;
  let secondarySerial = 1;

  allClasses.forEach((classItem, classIndex) => {
    const numStudents = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numStudents; i++) {
      const nameIndex = (classIndex * 3 + i) % names.length;
      const section: Section = PRIMARY_CLASSES.some(c => c.value === classItem.value) ? 'primary' : 'secondary';
      const isNew = Math.random() > 0.6;
      const yearOfEntry = isNew ? '25' : '24';
      const serial = section === 'primary' ? primarySerial++ : secondarySerial++;

      students.push({
        id: `student-${classIndex}-${i}`,
        regNumber: generateRegNumber(section, yearOfEntry, serial),
        firstName: names[nameIndex].first,
        middleName: names[nameIndex].middle,
        surname: names[nameIndex].surname,
        section,
        class: classItem.value,
        parentPhone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        yearOfEntry,
        isNewIntake: isNew,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
    }
  });

  return students;
}

function generateDefaultFees(): FeeStructure[] {
  const fees: FeeStructure[] = [];
  
  PRIMARY_CLASSES.forEach(c => {
    const baseFee = c.value.includes('creche') ? 85000 :
                    c.value.includes('tender') ? 90000 :
                    c.value.includes('nursery') ? 95000 : 100000;
    fees.push({
      class: c.value,
      newIntakeFee: baseFee + 15000,
      returningFee: baseFee,
    });
  });

  SECONDARY_CLASSES.forEach(c => {
    const baseFee = c.value.includes('jss') ? 120000 : 150000;
    fees.push({
      class: c.value,
      newIntakeFee: baseFee + 20000,
      returningFee: baseFee,
    });
  });

  return fees;
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<AcademicSession[]>([
    { id: 'session-2024-2025', name: '2024/2025 Session', startYear: 2024, endYear: 2025, isActive: true },
  ]);

  const [terms, setTerms] = useState<TermConfig[]>([
    {
      id: 'term-2024-2025-1',
      sessionId: 'session-2024-2025',
      term: '1st',
      isActive: true,
      fees: generateDefaultFees(),
    },
  ]);

  const [students, setStudents] = useState<Student[]>(generateMockStudents());
  const [payments, setPayments] = useState<Payment[]>([]);

  const activeSession = sessions.find(s => s.isActive) || null;
  const activeTerm = terms.find(t => t.isActive) || null;
  const recentStudents = [...students]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const createSession = useCallback((name: string, startYear: number, endYear: number) => {
    const newSession: AcademicSession = {
      id: `session-${startYear}-${endYear}`,
      name,
      startYear,
      endYear,
      isActive: false,
    };
    setSessions(prev => [...prev, newSession]);
  }, []);

  const setActiveSession = useCallback((sessionId: string) => {
    setSessions(prev =>
      prev.map(s => ({ ...s, isActive: s.id === sessionId }))
    );
  }, []);

  const createTerm = useCallback((sessionId: string, term: Term) => {
    const newTerm: TermConfig = {
      id: `term-${sessionId}-${term}`,
      sessionId,
      term,
      isActive: false,
      fees: generateDefaultFees(),
    };
    setTerms(prev => [...prev, newTerm]);
  }, []);

  const setActiveTerm = useCallback((termId: string) => {
    setTerms(prev =>
      prev.map(t => ({ ...t, isActive: t.id === termId }))
    );
  }, []);

  const updateTermFees = useCallback((termId: string, fees: FeeStructure[]) => {
    setTerms(prev =>
      prev.map(t => (t.id === termId ? { ...t, fees } : t))
    );
  }, []);

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'regNumber' | 'createdAt'>): Student => {
    const existingStudents = students.filter(
      s => s.section === studentData.section && s.yearOfEntry === studentData.yearOfEntry
    );
    const serial = existingStudents.length + 1;
    const regNumber = generateRegNumber(studentData.section, studentData.yearOfEntry, serial);

    const newStudent: Student = {
      ...studentData,
      id: `student-${Date.now()}`,
      regNumber,
      createdAt: new Date(),
    };

    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  }, [students]);

  const getStudentsByClass = useCallback((classValue: SchoolClass): Student[] => {
    return students.filter(s => s.class === classValue);
  }, [students]);

  const searchStudents = useCallback((query: string): Student[] => {
    const lowerQuery = query.toLowerCase();
    return students.filter(
      s =>
        s.firstName.toLowerCase().includes(lowerQuery) ||
        s.surname.toLowerCase().includes(lowerQuery) ||
        s.regNumber.toLowerCase().includes(lowerQuery)
    );
  }, [students]);

  const getStudentFee = useCallback((student: Student): number => {
    if (!activeTerm) return 0;
    const feeConfig = activeTerm.fees.find(f => f.class === student.class);
    if (!feeConfig) return 0;
    return student.isNewIntake ? feeConfig.newIntakeFee : feeConfig.returningFee;
  }, [activeTerm]);

  const addPayment = useCallback((paymentData: Omit<Payment, 'id' | 'transactionId' | 'createdAt'>): Payment => {
    const newPayment: Payment = {
      ...paymentData,
      id: `payment-${Date.now()}`,
      transactionId: generateTransactionId(),
      createdAt: new Date(),
    };

    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  }, []);

  const getStudentPayments = useCallback((studentId: string): Payment[] => {
    return payments.filter(p => p.studentId === studentId);
  }, [payments]);

  const getStudentBalance = useCallback((studentId: string): number => {
    const student = students.find(s => s.id === studentId);
    if (!student || !activeTerm) return 0;

    const fee = getStudentFee(student);
    const totalPaid = payments
      .filter(p => p.studentId === studentId && p.termId === activeTerm.id)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    return fee - totalPaid;
  }, [students, activeTerm, payments, getStudentFee]);

  const getTotalExpectedRevenue = useCallback((): number => {
    return students.reduce((sum, student) => sum + getStudentFee(student), 0);
  }, [students, getStudentFee]);

  const getTotalCollected = useCallback((): number => {
    if (!activeTerm) return 0;
    return payments
      .filter(p => p.termId === activeTerm.id)
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [payments, activeTerm]);

  const getDebtorsByClass = useCallback((): Record<SchoolClass, Student[]> => {
    const debtors: Record<string, Student[]> = {};

    students.forEach(student => {
      const balance = getStudentBalance(student.id);
      if (balance > 0) {
        if (!debtors[student.class]) {
          debtors[student.class] = [];
        }
        debtors[student.class].push(student);
      }
    });

    return debtors as Record<SchoolClass, Student[]>;
  }, [students, getStudentBalance]);

  return (
    <SchoolContext.Provider
      value={{
        sessions,
        activeSession,
        createSession,
        setActiveSession,
        terms,
        activeTerm,
        createTerm,
        setActiveTerm,
        updateTermFees,
        students,
        recentStudents,
        addStudent,
        getStudentsByClass,
        searchStudents,
        getStudentFee,
        payments,
        addPayment,
        getStudentPayments,
        getStudentBalance,
        getTotalExpectedRevenue,
        getTotalCollected,
        getDebtorsByClass,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
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
  createSession: (name: string, startYear: number, endYear: number) => Promise<void>;
  setActiveSession: (sessionId: string) => Promise<void>;

  // Terms
  terms: TermConfig[];
  activeTerm: TermConfig | null;
  createTerm: (sessionId: string, term: Term) => Promise<void>;
  setActiveTerm: (termId: string) => Promise<void>;
  updateTermFees: (termId: string, fees: FeeStructure[]) => Promise<void>;

  // Students
  students: Student[];
  recentStudents: Student[];
  addStudent: (student: Omit<Student, 'id' | 'regNumber' | 'createdAt'>) => Promise<Student>;
  getStudentsByClass: (classValue: SchoolClass) => Student[];
  searchStudents: (query: string) => Student[];
  getStudentFee: (student: Student) => number;

  // Payments
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'transactionId' | 'createdAt'>) => Promise<Payment>;
  getStudentPayments: (studentId: string) => Payment[];
  getStudentBalance: (studentId: string) => number;

  // Analytics
  getTotalExpectedRevenue: () => number;
  getTotalCollected: () => number;
  getDebtorsByClass: () => Record<SchoolClass, Student[]>;

  // Loading state
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

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
  const { user, session } = useAuth();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<TermConfig[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeSession = sessions.find(s => s.isActive) || null;
  const activeTerm = terms.find(t => t.isActive) || null;
  const recentStudents = [...students]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  // Fetch all data from database
  const refreshData = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('academic_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionsData) {
        setSessions(sessionsData.map(s => ({
          id: s.id,
          name: s.name,
          startYear: s.start_year,
          endYear: s.end_year,
          isActive: s.is_active,
        })));
      }

      // Fetch terms
      const { data: termsData } = await supabase
        .from('terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (termsData) {
        setTerms(termsData.map(t => ({
          id: t.id,
          sessionId: t.session_id,
          term: t.term as Term,
          isActive: t.is_active,
          fees: (t.fees as unknown as FeeStructure[]) || generateDefaultFees(),
        })));
      }

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsData) {
        setStudents(studentsData.map(s => ({
          id: s.id,
          regNumber: s.reg_number,
          firstName: s.first_name,
          middleName: s.middle_name || undefined,
          surname: s.surname,
          section: s.section as Section,
          class: s.class as SchoolClass,
          parentPhone: s.parent_phone,
          yearOfEntry: s.year_of_entry,
          isNewIntake: s.is_new_intake,
          createdAt: new Date(s.created_at),
        })));
      }

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsData) {
        setPayments(paymentsData.map(p => ({
          id: p.id,
          studentId: p.student_id,
          termId: p.term_id,
          transactionId: p.transaction_id,
          amountPaid: Number(p.amount_paid),
          paymentMethod: p.payment_method as 'cash' | 'transfer' | 'pos',
          notes: p.notes || undefined,
          createdAt: new Date(p.created_at),
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const createSession = useCallback(async (name: string, startYear: number, endYear: number) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('academic_sessions')
      .insert({
        user_id: session.user.id,
        name,
        start_year: startYear,
        end_year: endYear,
        is_active: false,
      })
      .select()
      .single();

    if (data && !error) {
      setSessions(prev => [...prev, {
        id: data.id,
        name: data.name,
        startYear: data.start_year,
        endYear: data.end_year,
        isActive: data.is_active,
      }]);
    }
  }, [session?.user]);

  const setActiveSession = useCallback(async (sessionId: string) => {
    if (!session?.user) return;

    // Deactivate all sessions first
    await supabase
      .from('academic_sessions')
      .update({ is_active: false })
      .eq('user_id', session.user.id);

    // Activate the selected session
    await supabase
      .from('academic_sessions')
      .update({ is_active: true })
      .eq('id', sessionId);

    setSessions(prev =>
      prev.map(s => ({ ...s, isActive: s.id === sessionId }))
    );
  }, [session?.user]);

  const createTerm = useCallback(async (sessionId: string, term: Term) => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('terms')
      .insert({
        user_id: session.user.id,
        session_id: sessionId,
        term,
        is_active: false,
        fees: JSON.parse(JSON.stringify(generateDefaultFees())),
      })
      .select()
      .single();

    if (data && !error) {
      setTerms(prev => [...prev, {
        id: data.id,
        sessionId: data.session_id,
        term: data.term as Term,
        isActive: data.is_active,
        fees: (data.fees as unknown as FeeStructure[]) || generateDefaultFees(),
      }]);
    }
  }, [session?.user]);

  const setActiveTerm = useCallback(async (termId: string) => {
    if (!session?.user) return;

    // Deactivate all terms first
    await supabase
      .from('terms')
      .update({ is_active: false })
      .eq('user_id', session.user.id);

    // Activate the selected term
    await supabase
      .from('terms')
      .update({ is_active: true })
      .eq('id', termId);

    setTerms(prev =>
      prev.map(t => ({ ...t, isActive: t.id === termId }))
    );
  }, [session?.user]);

  const updateTermFees = useCallback(async (termId: string, fees: FeeStructure[]) => {
    if (!session?.user) return;

    await supabase
      .from('terms')
      .update({ fees: JSON.parse(JSON.stringify(fees)) })
      .eq('id', termId);

    setTerms(prev =>
      prev.map(t => (t.id === termId ? { ...t, fees } : t))
    );
  }, [session?.user]);

  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'regNumber' | 'createdAt'>): Promise<Student> => {
    if (!session?.user) throw new Error('Not authenticated');

    const existingStudents = students.filter(
      s => s.section === studentData.section && s.yearOfEntry === studentData.yearOfEntry
    );
    const serial = existingStudents.length + 1;
    const regNumber = generateRegNumber(studentData.section, studentData.yearOfEntry, serial);

    const { data, error } = await supabase
      .from('students')
      .insert({
        user_id: session.user.id,
        reg_number: regNumber,
        first_name: studentData.firstName,
        middle_name: studentData.middleName || null,
        surname: studentData.surname,
        section: studentData.section,
        class: studentData.class,
        parent_phone: studentData.parentPhone,
        year_of_entry: studentData.yearOfEntry,
        is_new_intake: studentData.isNewIntake,
      })
      .select()
      .single();

    if (error) throw error;

    const newStudent: Student = {
      id: data.id,
      regNumber: data.reg_number,
      firstName: data.first_name,
      middleName: data.middle_name || undefined,
      surname: data.surname,
      section: data.section as Section,
      class: data.class as SchoolClass,
      parentPhone: data.parent_phone,
      yearOfEntry: data.year_of_entry,
      isNewIntake: data.is_new_intake,
      createdAt: new Date(data.created_at),
    };

    setStudents(prev => [newStudent, ...prev]);
    return newStudent;
  }, [session?.user, students]);

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

  const addPayment = useCallback(async (paymentData: Omit<Payment, 'id' | 'transactionId' | 'createdAt'>): Promise<Payment> => {
    if (!session?.user) throw new Error('Not authenticated');

    const transactionId = generateTransactionId();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: session.user.id,
        student_id: paymentData.studentId,
        term_id: paymentData.termId,
        transaction_id: transactionId,
        amount_paid: paymentData.amountPaid,
        payment_method: paymentData.paymentMethod,
        notes: paymentData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    const newPayment: Payment = {
      id: data.id,
      studentId: data.student_id,
      termId: data.term_id,
      transactionId: data.transaction_id,
      amountPaid: Number(data.amount_paid),
      paymentMethod: data.payment_method as 'cash' | 'transfer' | 'pos',
      notes: data.notes || undefined,
      createdAt: new Date(data.created_at),
    };

    setPayments(prev => [newPayment, ...prev]);
    return newPayment;
  }, [session?.user]);

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
        isLoading,
        refreshData,
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

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

  // Loading state
  isLoading: boolean;
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<TermConfig[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const activeSession = sessions.find(s => s.isActive) || null;
  const activeTerm = terms.find(t => t.isActive) || null;
  const recentStudents = [...students]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load sessions
        const { data: sessionsData } = await supabase
          .from('academic_sessions')
          .select('*')
          .order('start_year', { ascending: false });

        if (sessionsData) {
          setSessions(sessionsData.map(s => ({
            id: s.id,
            name: s.name,
            startYear: s.start_year,
            endYear: s.end_year,
            isActive: s.is_active,
          })));
        }

        // Load terms
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
            fees: (Array.isArray(t.fees) ? t.fees : generateDefaultFees()) as FeeStructure[],
          })));
        }

        // Load students
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

        // Load payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (paymentsData) {
          setPayments(paymentsData.map(p => ({
            id: p.id,
            transactionId: p.transaction_id,
            studentId: p.student_id,
            sessionId: '',
            termId: p.term_id,
            amountPaid: Number(p.amount_paid),
            feePayable: 0,
            outstandingBalance: 0,
            paymentMethod: p.payment_method as any,
            receivedBy: '',
            createdAt: new Date(p.created_at),
          })));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const createSession = useCallback(async (name: string, startYear: number, endYear: number) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('academic_sessions')
      .insert({
        name,
        start_year: startYear,
        end_year: endYear,
        is_active: false,
        user_id: user.id,
      })
      .select()
      .single();

    if (data && !error) {
      const newSession: AcademicSession = {
        id: data.id,
        name: data.name,
        startYear: data.start_year,
        endYear: data.end_year,
        isActive: data.is_active,
      };
      setSessions(prev => [...prev, newSession]);
    }
  }, [user]);

  const setActiveSession = useCallback(async (sessionId: string) => {
    if (!user) return;

    // Deactivate all, then activate selected
    await supabase
      .from('academic_sessions')
      .update({ is_active: false })
      .eq('user_id', user.id);

    await supabase
      .from('academic_sessions')
      .update({ is_active: true })
      .eq('id', sessionId);

    setSessions(prev =>
      prev.map(s => ({ ...s, isActive: s.id === sessionId }))
    );
  }, [user]);

  const createTerm = useCallback(async (sessionId: string, term: Term) => {
    if (!user) return;

    const fees = generateDefaultFees();

    const { data, error } = await supabase
      .from('terms')
      .insert({
        session_id: sessionId,
        term,
        is_active: false,
        fees: fees as any,
        user_id: user.id,
      })
      .select()
      .single();

    if (data && !error) {
      const newTerm: TermConfig = {
        id: data.id,
        sessionId: data.session_id,
        term: data.term as Term,
        isActive: data.is_active,
        fees,
      };
      setTerms(prev => [...prev, newTerm]);
    }
  }, [user]);

  const setActiveTerm = useCallback(async (termId: string) => {
    if (!user) return;

    // Deactivate all, then activate selected
    await supabase
      .from('terms')
      .update({ is_active: false })
      .eq('user_id', user.id);

    await supabase
      .from('terms')
      .update({ is_active: true })
      .eq('id', termId);

    setTerms(prev =>
      prev.map(t => ({ ...t, isActive: t.id === termId }))
    );
  }, [user]);

  const updateTermFees = useCallback(async (termId: string, fees: FeeStructure[]) => {
    await supabase
      .from('terms')
      .update({ fees: fees as any })
      .eq('id', termId);

    setTerms(prev =>
      prev.map(t => (t.id === termId ? { ...t, fees } : t))
    );
  }, []);

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'regNumber' | 'createdAt'>): Student => {
    if (!user) throw new Error('User not authenticated');

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

    // Insert to Supabase (async, non-blocking for immediate UI update)
    supabase
      .from('students')
      .insert({
        id: newStudent.id,
        reg_number: regNumber,
        first_name: studentData.firstName,
        middle_name: studentData.middleName || null,
        surname: studentData.surname,
        section: studentData.section,
        class: studentData.class,
        parent_phone: studentData.parentPhone,
        year_of_entry: studentData.yearOfEntry,
        is_new_intake: studentData.isNewIntake,
        user_id: user.id,
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          // Update with real ID from database
          setStudents(prev => prev.map(s => 
            s.id === newStudent.id ? { ...s, id: data.id } : s
          ));
        }
      });

    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  }, [students, user]);

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
    if (!user) throw new Error('User not authenticated');

    const transactionId = generateTransactionId();
    const newPayment: Payment = {
      ...paymentData,
      id: `payment-${Date.now()}`,
      transactionId,
      createdAt: new Date(),
    };

    // Insert to Supabase (async, non-blocking for immediate UI update)
    supabase
      .from('payments')
      .insert({
        id: newPayment.id,
        student_id: paymentData.studentId,
        term_id: paymentData.termId,
        amount_paid: paymentData.amountPaid,
        payment_method: paymentData.paymentMethod,
        transaction_id: transactionId,
        notes: null,
        user_id: user.id,
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          // Update with real ID from database
          setPayments(prev => prev.map(p => 
            p.id === newPayment.id ? { ...p, id: data.id } : p
          ));
        }
      });

    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  }, [user]);

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

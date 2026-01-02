import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  getNextClass,
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
  addStudent: (student: Omit<Student, 'id' | 'regNumber' | 'createdAt'>) => Promise<Student | null>;
  updateStudent: (studentId: string, data: Partial<Student>) => Promise<boolean>;
  deleteStudent: (studentId: string, reason?: string) => Promise<boolean>;
  getStudentsByClass: (classValue: SchoolClass) => Student[];
  searchStudents: (query: string) => Student[];
  getStudentFee: (student: Student) => number;
  promoteStudentsToNextClass: () => Promise<{ promoted: number; graduated: number; manual: number }>;

  // Payments
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'transactionId' | 'createdAt'>) => Promise<Payment | null>;
  getStudentPayments: (studentId: string) => Payment[];
  getStudentBalance: (studentId: string) => number;

  // Analytics
  getTotalExpectedRevenue: () => number;
  getTotalCollected: () => number;
  getDebtorsByClass: () => Record<SchoolClass, Student[]>;

  // Loading state
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

function generateDefaultFees(): FeeStructure[] {
  const fees: FeeStructure[] = [];

  PRIMARY_CLASSES.forEach((c) => {
    const baseFee =
      c.value.includes('creche')
        ? 85000
        : c.value.includes('tender')
          ? 90000
          : c.value.includes('nursery')
            ? 95000
            : 100000;
    fees.push({
      class: c.value,
      newIntakeFee: baseFee + 15000,
      returningFee: baseFee,
    });
  });

  SECONDARY_CLASSES.forEach((c) => {
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<TermConfig[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const activeSession = sessions.find((s) => s.isActive) || null;
  const activeTerm = terms.find((t) => t.isActive) || null;
  const recentStudents = [...students]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  // Load all data from database
  const loadData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load all data in parallel
      const [sessionsResult, termsResult, studentsResult, paymentsResult] = await Promise.all([
        supabase.from('academic_sessions').select('*').order('start_year', { ascending: false }),
        supabase.from('terms').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
      ]);

      if (sessionsResult.error) throw sessionsResult.error;
      if (termsResult.error) throw termsResult.error;
      if (studentsResult.error) throw studentsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setSessions(
        (sessionsResult.data || []).map((s) => ({
          id: s.id,
          name: s.name,
          startYear: s.start_year,
          endYear: s.end_year,
          isActive: s.is_active,
        }))
      );

      setTerms(
        (termsResult.data || []).map((t) => ({
          id: t.id,
          sessionId: t.session_id,
          term: t.term as Term,
          isActive: t.is_active,
          fees: (Array.isArray(t.fees) ? t.fees : generateDefaultFees()) as FeeStructure[],
        }))
      );

      setStudents(
        (studentsResult.data || []).map((s) => ({
          id: s.id,
          regNumber: s.reg_number,
          firstName: s.first_name,
          middleName: s.middle_name || undefined,
          surname: s.surname,
          section: s.section as Section,
          class: s.class as SchoolClass,
          yearOfEntry: s.year_of_entry,
          isNewIntake: s.is_new_intake,
          createdAt: new Date(s.created_at),
          sessionId: s.session_id || undefined,
          previousClass: s.previous_class || undefined,
        }))
      );

      setPayments(
        (paymentsResult.data || []).map((p) => ({
          id: p.id,
          transactionId: p.transaction_id,
          studentId: p.student_id,
          sessionId: '',
          termId: p.term_id,
          amountPaid: Number(p.amount_paid),
          feePayable: 0,
          outstandingBalance: 0,
          paymentMethod: p.payment_method as Payment['paymentMethod'],
          receivedBy: '',
          createdAt: new Date(p.created_at),
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      toast({
        title: 'Error Loading Data',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  // Load data when session changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  const createSession = useCallback(
    async (name: string, startYear: number, endYear: number) => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        return;
      }

      try {
        const { data, error: insertError } = await supabase
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

        if (insertError) throw insertError;

        if (data) {
          const newSession: AcademicSession = {
            id: data.id,
            name: data.name,
            startYear: data.start_year,
            endYear: data.end_year,
            isActive: data.is_active,
          };
          setSessions((prev) => [newSession, ...prev]);
          toast({ title: 'Success', description: 'Academic session created' });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create session';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    },
    [user, toast]
  );

  const setActiveSession = useCallback(
    async (sessionId: string) => {
      if (!user) return;

      try {
        // Deactivate all, then activate selected
        await supabase.from('academic_sessions').update({ is_active: false }).eq('user_id', user.id);

        const { error: updateError } = await supabase
          .from('academic_sessions')
          .update({ is_active: true })
          .eq('id', sessionId);

        if (updateError) throw updateError;

        setSessions((prev) => prev.map((s) => ({ ...s, isActive: s.id === sessionId })));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to set active session';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    },
    [user, toast]
  );

  const createTerm = useCallback(
    async (sessionId: string, term: Term) => {
      if (!user) return;

      try {
        const fees = generateDefaultFees();

        const { data, error: insertError } = await supabase
          .from('terms')
          .insert({
            session_id: sessionId,
            term,
            is_active: false,
            fees: JSON.parse(JSON.stringify(fees)),
            user_id: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (data) {
          const newTerm: TermConfig = {
            id: data.id,
            sessionId: data.session_id,
            term: data.term as Term,
            isActive: data.is_active,
            fees,
          };
          setTerms((prev) => [newTerm, ...prev]);
          toast({ title: 'Success', description: 'Term created' });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create term';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    },
    [user, toast]
  );

  const setActiveTerm = useCallback(
    async (termId: string) => {
      if (!user) return;

      try {
        await supabase.from('terms').update({ is_active: false }).eq('user_id', user.id);

        const { error: updateError } = await supabase
          .from('terms')
          .update({ is_active: true })
          .eq('id', termId);

        if (updateError) throw updateError;

        setTerms((prev) => prev.map((t) => ({ ...t, isActive: t.id === termId })));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to set active term';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    },
    [user, toast]
  );

  const updateTermFees = useCallback(
    async (termId: string, fees: FeeStructure[]) => {
      try {
        const { error: updateError } = await supabase
          .from('terms')
          .update({ fees: JSON.parse(JSON.stringify(fees)) })
          .eq('id', termId);

        if (updateError) throw updateError;

        setTerms((prev) => prev.map((t) => (t.id === termId ? { ...t, fees } : t)));
        toast({ title: 'Success', description: 'Fees updated' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update fees';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      }
    },
    [toast]
  );

  const addStudent = useCallback(
    async (studentData: Omit<Student, 'id' | 'regNumber' | 'createdAt'>): Promise<Student | null> => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        return null;
      }

      try {
        const existingStudents = students.filter(
          (s) => s.section === studentData.section && s.yearOfEntry === studentData.yearOfEntry
        );
        const serial = existingStudents.length + 1;
        const regNumber = generateRegNumber(studentData.section, studentData.yearOfEntry, serial);

        const { data, error: insertError } = await supabase
          .from('students')
          .insert({
            reg_number: regNumber,
            first_name: studentData.firstName,
            middle_name: studentData.middleName || null,
            surname: studentData.surname,
            section: studentData.section,
            class: studentData.class,
            year_of_entry: studentData.yearOfEntry,
            is_new_intake: studentData.isNewIntake,
            user_id: user.id,
            session_id: activeSession?.id || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (data) {
          const newStudent: Student = {
            id: data.id,
            regNumber: data.reg_number,
            firstName: data.first_name,
            middleName: data.middle_name || undefined,
            surname: data.surname,
            section: data.section as Section,
            class: data.class as SchoolClass,
            yearOfEntry: data.year_of_entry,
            isNewIntake: data.is_new_intake,
            createdAt: new Date(data.created_at),
            sessionId: data.session_id || undefined,
          };
          setStudents((prev) => [newStudent, ...prev]);
          toast({ title: 'Success', description: 'Student added successfully' });
          return newStudent;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add student';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      }
    },
    [students, user, toast, activeSession]
  );

  const updateStudent = useCallback(
    async (studentId: string, data: Partial<Student>): Promise<boolean> => {
      try {
        const updateData: Record<string, unknown> = {};
        if (data.firstName !== undefined) updateData.first_name = data.firstName;
        if (data.middleName !== undefined) updateData.middle_name = data.middleName || null;
        if (data.surname !== undefined) updateData.surname = data.surname;
        if (data.class !== undefined) updateData.class = data.class;
        if (data.section !== undefined) updateData.section = data.section;
        if (data.isNewIntake !== undefined) updateData.is_new_intake = data.isNewIntake;

        const { error: updateError } = await supabase
          .from('students')
          .update(updateData)
          .eq('id', studentId);

        if (updateError) throw updateError;

        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, ...data } : s))
        );
        toast({ title: 'Success', description: 'Student updated successfully' });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update student';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return false;
      }
    },
    [toast]
  );

  const deleteStudent = useCallback(
    async (studentId: string, reason?: string): Promise<boolean> => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        return false;
      }

      try {
        const student = students.find((s) => s.id === studentId);
        if (!student) throw new Error('Student not found');

        // Archive the student first
        const { error: archiveError } = await supabase
          .from('student_archives')
          .insert({
            original_id: student.id,
            reg_number: student.regNumber,
            first_name: student.firstName,
            middle_name: student.middleName || null,
            surname: student.surname,
            section: student.section,
            class: student.class,
            year_of_entry: student.yearOfEntry,
            is_new_intake: student.isNewIntake,
            session_id: student.sessionId || null,
            archived_by: user.id,
            archive_reason: reason || 'Deleted by admin',
          });

        if (archiveError) throw archiveError;

        // Now delete the student
        const { error: deleteError } = await supabase
          .from('students')
          .delete()
          .eq('id', studentId);

        if (deleteError) throw deleteError;

        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        toast({ title: 'Success', description: 'Student deleted and archived' });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete student';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return false;
      }
    },
    [students, user, toast]
  );

  const promoteStudentsToNextClass = useCallback(async (): Promise<{ promoted: number; graduated: number; manual: number }> => {
    const results = { promoted: 0, graduated: 0, manual: 0 };

    try {
      for (const student of students) {
        const nextClass = getNextClass(student.class);

        if (nextClass === 'manual') {
          // Creche students need manual promotion
          results.manual++;
          continue;
        }

        if (nextClass === 'graduated') {
          // SSS 3 students graduate - mark as inactive or move to archive
          results.graduated++;
          continue;
        }

        // Promote to next class
        const { error } = await supabase
          .from('students')
          .update({
            previous_class: student.class,
            class: nextClass,
            is_new_intake: false, // After promotion, they're returning students
          })
          .eq('id', student.id);

        if (!error) {
          results.promoted++;
        }
      }

      // Refresh data after promotion
      await loadData();
      
      toast({
        title: 'Promotion Complete',
        description: `${results.promoted} promoted, ${results.graduated} graduated, ${results.manual} require manual action`,
      });

      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to promote students';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return results;
    }
  }, [students, loadData, toast]);

  const getStudentsByClass = useCallback(
    (classValue: SchoolClass): Student[] => {
      return students.filter((s) => s.class === classValue);
    },
    [students]
  );

  const searchStudents = useCallback(
    (query: string): Student[] => {
      const lowerQuery = query.toLowerCase();
      return students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(lowerQuery) ||
          s.surname.toLowerCase().includes(lowerQuery) ||
          s.regNumber.toLowerCase().includes(lowerQuery)
      );
    },
    [students]
  );

  const getStudentFee = useCallback(
    (student: Student): number => {
      if (!activeTerm) return 0;
      const feeConfig = activeTerm.fees.find((f) => f.class === student.class);
      if (!feeConfig) return 0;
      return student.isNewIntake ? feeConfig.newIntakeFee : feeConfig.returningFee;
    },
    [activeTerm]
  );

  const addPayment = useCallback(
    async (paymentData: Omit<Payment, 'id' | 'transactionId' | 'createdAt'>): Promise<Payment | null> => {
      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
        return null;
      }

      try {
        const transactionId = generateTransactionId();

        const { data, error: insertError } = await supabase
          .from('payments')
          .insert({
            student_id: paymentData.studentId,
            term_id: paymentData.termId,
            amount_paid: paymentData.amountPaid,
            payment_method: paymentData.paymentMethod,
            transaction_id: transactionId,
            notes: null,
            user_id: user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (data) {
          const newPayment: Payment = {
            id: data.id,
            transactionId: data.transaction_id,
            studentId: data.student_id,
            sessionId: '',
            termId: data.term_id,
            amountPaid: Number(data.amount_paid),
            feePayable: paymentData.feePayable,
            outstandingBalance: paymentData.outstandingBalance,
            paymentMethod: data.payment_method as Payment['paymentMethod'],
            receivedBy: paymentData.receivedBy,
            createdAt: new Date(data.created_at),
          };
          setPayments((prev) => [newPayment, ...prev]);
          toast({ title: 'Success', description: 'Payment recorded successfully' });
          return newPayment;
        }
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to record payment';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      }
    },
    [user, toast]
  );

  const getStudentPayments = useCallback(
    (studentId: string): Payment[] => {
      return payments.filter((p) => p.studentId === studentId);
    },
    [payments]
  );

  const getStudentBalance = useCallback(
    (studentId: string): number => {
      const student = students.find((s) => s.id === studentId);
      if (!student || !activeTerm) return 0;

      const fee = getStudentFee(student);
      const totalPaid = payments
        .filter((p) => p.studentId === studentId && p.termId === activeTerm.id)
        .reduce((sum, p) => sum + p.amountPaid, 0);

      return fee - totalPaid;
    },
    [students, activeTerm, payments, getStudentFee]
  );

  const getTotalExpectedRevenue = useCallback((): number => {
    return students.reduce((sum, student) => sum + getStudentFee(student), 0);
  }, [students, getStudentFee]);

  const getTotalCollected = useCallback((): number => {
    if (!activeTerm) return 0;
    return payments.filter((p) => p.termId === activeTerm.id).reduce((sum, p) => sum + p.amountPaid, 0);
  }, [payments, activeTerm]);

  const getDebtorsByClass = useCallback((): Record<SchoolClass, Student[]> => {
    const debtors: Record<string, Student[]> = {};

    students.forEach((student) => {
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
        updateStudent,
        deleteStudent,
        getStudentsByClass,
        searchStudents,
        getStudentFee,
        promoteStudentsToNextClass,
        payments,
        addPayment,
        getStudentPayments,
        getStudentBalance,
        getTotalExpectedRevenue,
        getTotalCollected,
        getDebtorsByClass,
        isLoading,
        error,
        refreshData: loadData,
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

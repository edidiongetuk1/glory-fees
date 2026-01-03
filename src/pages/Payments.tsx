import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '@/contexts/SchoolContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PaymentHistory from '@/components/payments/PaymentHistory';
import { usePageMeta } from '@/hooks/use-page-meta';
import {
  Student,
  Payment,
  PaymentMethod,
  AcademicSession,
  TermConfig,
  formatCurrency,
  formatDateTime,
  getClassLabel,
} from '@/types/school';
import {
  Search,
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  User,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';


export default function Payments() {
  const {
    searchStudents,
    getStudentFee,
    getStudentBalance,
    getStudentPayments,
    addPayment,
    activeTerm,
    activeSession,
    refreshData,
  } = useSchool();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  usePageMeta({
    title: 'Payments | Soaring Glory',
    description: 'Record student school fee payments and print receipts.',
    canonicalPath: '/payments',
  });

  const didAutoRefresh = useRef(false);

  useEffect(() => {
    if (!activeTerm && !didAutoRefresh.current) {
      didAutoRefresh.current = true;
      void refreshData();
    }
  }, [activeTerm, refreshData]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchStudents(query);
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setSearchResults([]);
    setAmountPaid('');
    setPaymentSubmitted(false);
  };

  const handlePayment = async () => {
    if (!selectedStudent || !amountPaid || !activeTerm || !activeSession) {
      toast({
        title: 'Error',
        description: 'Please complete all fields',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(amountPaid);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    const feePayable = getStudentFee(selectedStudent);
    const currentBalance = getStudentBalance(selectedStudent.id);
    const newBalance = currentBalance - amount;

    const payment = await addPayment({
      studentId: selectedStudent.id,
      student: selectedStudent,
      sessionId: activeSession.id,
      termId: activeTerm.id,
      amountPaid: amount,
      feePayable,
      outstandingBalance: Math.max(0, newBalance),
      paymentMethod,
      receivedBy: user?.name || 'Unknown',
    });

    if (!payment) return;

    setPaymentSubmitted(true);
    setAmountPaid('');
  };

  const studentFee = selectedStudent ? getStudentFee(selectedStudent) : 0;
  const studentBalance = selectedStudent ? getStudentBalance(selectedStudent.id) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Payment Processing
          </h1>
          <p className="text-muted-foreground mt-1">
            Search for a student and record their fee payment
          </p>
        </div>

        {(!activeSession || !activeTerm) && (
          <Card className="border-warning/30">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium">Configuration needed</p>
                    <p className="text-sm text-muted-foreground">
                      {activeSession
                        ? 'No active term is set, so Fee Payable will show ₦0.'
                        : 'No active session is set.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => refreshData()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="gold" onClick={() => navigate('/fees')}>
                    Open Fees
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Find Student
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    placeholder="Search by name or registration number..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-card rounded-lg shadow-elevated border border-border overflow-hidden">
                      {searchResults.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => selectStudent(student)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {student.firstName.charAt(0)}{student.surname.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {student.firstName} {student.surname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.regNumber} • {getClassLabel(student.class)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected Student */}
            {selectedStudent && (
              <Card className="animate-scale-in border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Student Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center shadow-gold">
                      <span className="text-xl font-bold text-primary">
                        {selectedStudent.firstName.charAt(0)}{selectedStudent.surname.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {selectedStudent.firstName} {selectedStudent.middleName} {selectedStudent.surname}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedStudent.regNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Class</p>
                        <p className="font-medium text-sm sm:text-base">{getClassLabel(selectedStudent.class)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        selectedStudent.isNewIntake 
                          ? 'bg-success/10 text-success' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {selectedStudent.isNewIntake ? 'New Intake' : 'Returning'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Fee Payable</p>
                      <p className="text-base sm:text-lg font-bold text-foreground">
                        {formatCurrency(studentFee)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className={`text-base sm:text-lg font-bold ${studentBalance > 0 ? 'text-warning' : 'text-success'}`}>
                        {formatCurrency(studentBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Entry */}
            {selectedStudent && (
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Enter Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount Paid (₦)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'cash', label: 'Cash', icon: Banknote },
                        { value: 'pos', label: 'POS', icon: CreditCard },
                        { value: 'transfer', label: 'Transfer', icon: Building2 },
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === method.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <method.icon className={`w-5 h-5 ${
                            paymentMethod === method.value ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <span className="text-sm font-medium">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full"
                    onClick={handlePayment}
                    disabled={!amountPaid}
                  >
                    <Receipt className="w-5 h-5 mr-2" />
                    Record Payment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Submitted Confirmation */}
          <div className="space-y-6">
            {paymentSubmitted ? (
              <Card className="animate-scale-in border-2 border-warning/30">
                <CardContent className="py-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-warning" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Payment Submitted</h3>
                    <p className="text-muted-foreground mb-4">
                      Awaiting admin approval. Receipt will be available once approved.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check the Payment History below for status updates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full min-h-[300px] flex items-center justify-center">
                <div className="text-center text-muted-foreground p-8">
                  <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Ready to Process</p>
                  <p className="text-sm mt-1">
                    Search for a student and record their payment
                  </p>
                </div>
              </Card>
            )}

            {/* Payment History for selected student */}
            {selectedStudent && (
              <PaymentHistory
                payments={getStudentPayments(selectedStudent.id)}
                onPaymentUpdated={refreshData}
                student={selectedStudent}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

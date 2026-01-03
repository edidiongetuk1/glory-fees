import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSchool } from '@/contexts/SchoolContext';
import { usePageMeta } from '@/hooks/use-page-meta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, FileText } from 'lucide-react';
import { formatCurrency, getClassLabel, ALL_CLASSES } from '@/types/school';

export default function Records() {
  usePageMeta({ title: 'Records | Soaring Glory', description: 'View student payment records' });
  
  const { students, payments, activeTerm, sessions, terms } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');

  // Get filtered terms based on selected session
  const filteredTerms = useMemo(() => {
    if (selectedSession === 'all') return terms;
    return terms.filter(t => t.sessionId === selectedSession);
  }, [terms, selectedSession]);

  // Calculate student records with payment info
  const studentRecords = useMemo(() => {
    return students.map(student => {
      // Get the fee for this student based on their class and intake status
      let feePayable = 0;
      const termToUse = selectedTerm !== 'all' 
        ? terms.find(t => t.id === selectedTerm)
        : activeTerm;
      
      if (termToUse) {
        const feeStructure = termToUse.fees.find(f => f.class === student.class);
        if (feeStructure) {
          feePayable = student.isNewIntake ? feeStructure.newIntakeFee : feeStructure.returningFee;
        }
      }

      // Calculate total payments for this student in the selected term
      const studentPayments = payments.filter((p) => {
        const matchesStudent = p.studentId === student.id;
        const matchesTerm =
          selectedTerm !== 'all'
            ? p.termId === selectedTerm
            : activeTerm
              ? p.termId === activeTerm.id
              : true;

        return (
          matchesStudent &&
          matchesTerm &&
          p.approvalStatus === 'approved' &&
          !p.isVoided
        );
      });

      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const amountRemaining = Math.max(0, feePayable - totalPaid);

      return {
        ...student,
        feePayable,
        totalPaid,
        amountRemaining,
        paymentStatus: amountRemaining === 0 && feePayable > 0 
          ? 'paid' 
          : totalPaid > 0 
            ? 'partial' 
            : 'unpaid'
      };
    });
  }, [students, payments, terms, activeTerm, selectedTerm]);

  // Apply filters
  const filteredRecords = useMemo(() => {
    return studentRecords.filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.regNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClass = selectedClass === 'all' || record.class === selectedClass;
      
      const matchesSession = selectedSession === 'all' || record.sessionId === selectedSession;

      return matchesSearch && matchesClass && matchesSession;
    });
  }, [studentRecords, searchTerm, selectedClass, selectedSession]);

  // Sort by class then by name
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const classOrder = ALL_CLASSES.findIndex(c => c.value === a.class) - 
                        ALL_CLASSES.findIndex(c => c.value === b.class);
      if (classOrder !== 0) return classOrder;
      return a.surname.localeCompare(b.surname);
    });
  }, [filteredRecords]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Partial</Badge>;
      default:
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Unpaid</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Records</h1>
          <p className="text-muted-foreground">View student payment records and balances</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Filter Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or reg number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {ALL_CLASSES.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSession} onValueChange={(value) => {
                setSelectedSession(value);
                setSelectedTerm('all');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {filteredTerms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.term} Term
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Payment Records ({sortedRecords.length} students)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {sortedRecords.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No records found</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {sortedRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className="p-3 sm:p-4 border rounded-lg bg-card mx-3 sm:mx-0"
                  >
                    {/* Header: Name + Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {record.surname} {record.firstName} {record.middleName || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.regNumber} • {getClassLabel(record.class)}
                        </p>
                      </div>
                      {getStatusBadge(record.paymentStatus)}
                    </div>

                    {/* Payment info */}
                    <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Fee</p>
                        <p className="font-medium">{formatCurrency(record.feePayable)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="font-medium text-success">{formatCurrency(record.totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="font-medium text-destructive">{formatCurrency(record.amountRemaining)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

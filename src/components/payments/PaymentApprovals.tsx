import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Loader2, ClipboardCheck, FileText, User } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/types/school';

interface PaymentApproval {
  id: string;
  payment_id: string;
  student_id: string;
  term_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  requested_by: string;
  requested_by_email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: string | null;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  student_name?: string;
  requester_name?: string;
}

export default function PaymentApprovals() {
  const { user, isSuperAdmin } = useAuth();
  const { refreshData } = useSchool();
  const [approvals, setApprovals] = useState<PaymentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<PaymentApproval | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const isAdmin = isSuperAdmin();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      // Fetch approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('payment_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (approvalsError) throw approvalsError;

      // Fetch students separately
      const studentIds = [...new Set((approvalsData || []).map(a => a.student_id))];
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, surname, reg_number')
        .in('id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000']);

      // Fetch profiles separately
      const requesterIds = [...new Set((approvalsData || []).map(a => a.requested_by))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', requesterIds.length > 0 ? requesterIds : ['00000000-0000-0000-0000-000000000000']);

      const studentsMap = new Map((studentsData || []).map(s => [s.id, s]));
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      const enrichedData = (approvalsData || []).map((item: any) => {
        const student = studentsMap.get(item.student_id);
        const profile = profilesMap.get(item.requested_by);
        return {
          ...item,
          student_name: student 
            ? `${student.first_name} ${student.surname} (${student.reg_number})`
            : 'Unknown Student',
          requester_name: profile?.email || item.requested_by_email || 'Unknown',
        };
      });

      setApprovals(enrichedData);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedApproval || !action || !user) return;

    setProcessing(true);
    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from('payment_approvals')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewer_id: user.id,
          reviewer_notes: notes.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedApproval.id);

      if (approvalError) throw approvalError;

      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          approval_status: action === 'approve' ? 'approved' : 'rejected',
          approved_by: action === 'approve' ? user.id : null,
          approved_at: action === 'approve' ? new Date().toISOString() : null,
        })
        .eq('id', selectedApproval.payment_id);

      if (paymentError) throw paymentError;

      toast.success(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setSelectedApproval(null);
      setAction(null);
      setNotes('');
      fetchApprovals();
      void refreshData();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (approval: PaymentApproval, actionType: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setAction(actionType);
    setNotes('');
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const processedApprovals = approvals.filter(a => a.status !== 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Payment Approvals
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Review and approve payment transactions from staff'
              : 'Track the status of your payment submissions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                History ({processedApprovals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="p-3 sm:p-4 border rounded-lg bg-card">
                      {/* Header: Transaction ID + Status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {approval.transaction_id}
                        </span>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning animate-pulse text-xs flex-shrink-0">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>

                      {/* Student + Amount */}
                      <div className="mb-2">
                        <p className="font-medium text-sm truncate">{approval.student_name}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="font-semibold">{formatCurrency(approval.amount)}</span>
                          <span className="capitalize text-muted-foreground">{approval.payment_method}</span>
                        </div>
                      </div>

                      {/* Submitted by + Date */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {approval.requester_name}
                        </span>
                        <span>{formatDateTime(new Date(approval.created_at))}</span>
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-success hover:bg-success/90 text-success-foreground h-9"
                            onClick={() => openActionDialog(approval, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={() => openActionDialog(approval, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {processedApprovals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No approval history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processedApprovals.map((approval) => (
                    <div key={approval.id} className="p-3 sm:p-4 border rounded-lg bg-card">
                      {/* Header: Transaction ID + Status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {approval.transaction_id}
                        </span>
                        {getStatusBadge(approval.status)}
                      </div>

                      {/* Student + Amount */}
                      <div className="mb-2">
                        <p className="font-medium text-sm truncate">{approval.student_name}</p>
                        <span className="font-semibold text-sm">{formatCurrency(approval.amount)}</span>
                      </div>

                      {/* Meta info */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Submitted by: {approval.requester_name}</p>
                        <p>Reviewed: {approval.reviewed_at ? formatDateTime(new Date(approval.reviewed_at)) : '-'}</p>
                        {approval.reviewer_notes && (
                          <p className="italic">Notes: {approval.reviewer_notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!selectedApproval && !!action} onOpenChange={() => { setSelectedApproval(null); setAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${action === 'approve' ? 'text-success' : 'text-destructive'}`}>
              {action === 'approve' ? (
                <><CheckCircle className="w-5 h-5" /> Approve Payment</>
              ) : (
                <><XCircle className="w-5 h-5" /> Reject Payment</>
              )}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve' 
                ? 'This will confirm the payment as valid and complete.'
                : 'This will reject the payment. The payment record will be marked as rejected.'}
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4 py-4">
              <div className={`p-4 rounded-lg border ${action === 'approve' ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <div className="space-y-1 text-sm">
                  <p><strong>Transaction:</strong> {selectedApproval.transaction_id}</p>
                  <p><strong>Student:</strong> {selectedApproval.student_name}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedApproval.amount)}</p>
                  <p><strong>Submitted by:</strong> {selectedApproval.requester_name}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder={action === 'approve' ? 'Add any approval notes...' : 'Reason for rejection...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedApproval(null); setAction(null); }}>
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
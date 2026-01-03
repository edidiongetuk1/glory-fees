import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { History, Edit, XCircle, Loader2, AlertTriangle, Clock, CheckCircle, Download } from 'lucide-react';
import { Payment, PaymentMethod, formatCurrency, formatDateTime, Student, getClassLabel } from '@/types/school';
import { useSchool } from '@/contexts/SchoolContext';

interface PaymentHistoryProps {
  payments: Payment[];
  onPaymentUpdated: () => void;
  student?: Student;
}

export default function PaymentHistory({ payments, onPaymentUpdated, student }: PaymentHistoryProps) {
  const { user, isSuperAdmin } = useAuth();
  const { activeSession, activeTerm, getStudentFee, getStudentBalance } = useSchool();
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [voidingPayment, setVoidingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('cash');
  const [voidReason, setVoidReason] = useState('');
  const [editReason, setEditReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canEdit = isSuperAdmin();

  const handlePrintReceipt = (payment: Payment) => {
    if (!student || !activeSession || !activeTerm) return;
    
    const feePayable = getStudentFee(student);
    const outstandingBalance = getStudentBalance(student.id);
    
    const printWindow = window.open('', '', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .receipt { max-width: 350px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #1a365d; }
              .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
              .row { display: flex; justify-content: space-between; margin: 8px 0; gap: 12px; }
              .label { color: #666; }
              .value { font-weight: 500; text-align: right; }
              .text-success { color: #16a34a; }
              .text-warning { color: #d97706; }
              .total { font-size: 18px; font-weight: bold; margin-top: 15px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="logo">Soaring Glory</div>
                <p style="font-size: 14px; color: #666;">International Model Schools</p>
                <p style="font-size: 12px; color: #666; margin-top: 8px;">${formatDateTime(payment.createdAt)}</p>
              </div>
              <div class="divider"></div>
              <div class="row">
                <span class="label">Transaction ID</span>
                <span class="value" style="font-family: monospace; font-size: 12px;">${payment.transactionId}</span>
              </div>
              <div class="row">
                <span class="label">Session</span>
                <span class="value">${activeSession.name}</span>
              </div>
              <div class="row">
                <span class="label">Term</span>
                <span class="value">${activeTerm.term} Term</span>
              </div>
              <div class="divider"></div>
              <div class="row">
                <span class="label">Student Name</span>
                <span class="value">${student.firstName} ${student.surname}</span>
              </div>
              <div class="row">
                <span class="label">Reg. Number</span>
                <span class="value" style="font-family: monospace;">${student.regNumber}</span>
              </div>
              <div class="row">
                <span class="label">Class</span>
                <span class="value">${getClassLabel(student.class)}</span>
              </div>
              <div class="divider"></div>
              <div class="row">
                <span class="label">Fee Payable</span>
                <span class="value">${formatCurrency(feePayable)}</span>
              </div>
              <div class="row">
                <span class="label">Payment Method</span>
                <span class="value" style="text-transform: capitalize;">${payment.paymentMethod}</span>
              </div>
              <div class="divider"></div>
              <div class="row total">
                <span>Amount Paid</span>
                <span class="text-success">${formatCurrency(payment.amountPaid)}</span>
              </div>
              <div class="row">
                <span class="label">Outstanding Balance</span>
                <span class="value ${outstandingBalance > 0 ? 'text-warning' : 'text-success'}">${formatCurrency(outstandingBalance)}</span>
              </div>
              <div class="footer">
                <p>Received by: ${payment.receivedBy}</p>
                <p style="margin-top: 8px;">Thank you for your payment!</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEditPayment = async () => {
    if (!editingPayment || !user || !editReason.trim()) {
      toast.error('Please provide a reason for the edit');
      return;
    }

    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Create audit record
      await supabase.from('payment_audit').insert({
        payment_id: editingPayment.id,
        action: 'edited',
        previous_amount: editingPayment.amountPaid,
        new_amount: newAmount,
        previous_method: editingPayment.paymentMethod,
        new_method: editMethod,
        reason: editReason.trim(),
        performed_by: user.id,
      });

      // Update the payment
      const { error } = await supabase
        .from('payments')
        .update({
          amount_paid: newAmount,
          payment_method: editMethod,
        })
        .eq('id', editingPayment.id);

      if (error) throw error;

      toast.success('Payment updated successfully');
      setEditingPayment(null);
      setEditReason('');
      onPaymentUpdated();
    } catch (error: any) {
      console.error('Error editing payment:', error);
      toast.error('Failed to update payment');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidPayment = async () => {
    if (!voidingPayment || !user || !voidReason.trim()) {
      toast.error('Please provide a reason for voiding');
      return;
    }

    setLoading(true);
    try {
      // Create audit record
      await supabase.from('payment_audit').insert({
        payment_id: voidingPayment.id,
        action: 'voided',
        previous_amount: voidingPayment.amountPaid,
        new_amount: 0,
        previous_method: voidingPayment.paymentMethod,
        new_method: null,
        reason: voidReason.trim(),
        performed_by: user.id,
      });

      // Mark payment as voided
      const { error } = await supabase
        .from('payments')
        .update({
          is_voided: true,
          voided_at: new Date().toISOString(),
          voided_by: user.id,
        })
        .eq('id', voidingPayment.id);

      if (error) throw error;

      toast.success('Payment voided successfully');
      setVoidingPayment(null);
      setVoidReason('');
      onPaymentUpdated();
    } catch (error: any) {
      console.error('Error voiding payment:', error);
      toast.error('Failed to void payment');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setEditAmount(payment.amountPaid.toString());
    setEditMethod(payment.paymentMethod);
    setEditReason('');
  };

  if (payments.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Recent payments {canEdit && '• Super admins can edit or void records'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="space-y-3">
            {payments.slice(0, 10).map((payment) => {
              const isVoided = !!payment.isVoided;
              const approvalStatus = payment.approvalStatus ?? 'pending';

              return (
                <div 
                  key={payment.id} 
                  className={`p-3 sm:p-4 border rounded-lg ${isVoided ? 'opacity-50 bg-muted/30' : 'bg-card'}`}
                >
                  {/* Header row: Transaction ID + Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {payment.transactionId}
                    </span>
                    {isVoided ? (
                      <Badge variant="destructive" className="text-xs">Voided</Badge>
                    ) : approvalStatus === 'approved' ? (
                      <Badge className="bg-success/10 text-success border-success text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    ) : approvalStatus === 'rejected' ? (
                      <Badge variant="destructive" className="text-xs">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  {/* Amount + Method + Date */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className={`font-semibold ${isVoided ? 'line-through' : ''}`}>
                      {formatCurrency(payment.amountPaid)}
                    </span>
                    <span className="capitalize text-muted-foreground">{payment.paymentMethod}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(payment.createdAt)}
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t">
                    <div>
                      {!isVoided && approvalStatus === 'approved' && student ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReceipt(payment)}
                          className="h-8 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Receipt
                        </Button>
                      ) : approvalStatus === 'pending' ? (
                        <span className="text-xs text-muted-foreground">Awaiting approval</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    {canEdit && !isVoided && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(payment)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setVoidingPayment(payment)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Transaction: {editingPayment?.transactionId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={editMethod} onValueChange={(v: PaymentMethod) => setEditMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason for Edit *</Label>
              <Textarea
                placeholder="Explain why this payment is being edited..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayment(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditPayment} disabled={loading || !editReason.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Payment Dialog */}
      <Dialog open={!!voidingPayment} onOpenChange={() => setVoidingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Void Payment
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The payment of {formatCurrency(voidingPayment?.amountPaid || 0)} will be marked as voided.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm">
                <strong>Transaction:</strong> {voidingPayment?.transactionId}
              </p>
              <p className="text-sm">
                <strong>Amount:</strong> {formatCurrency(voidingPayment?.amountPaid || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason for Voiding *</Label>
              <Textarea
                placeholder="Explain why this payment is being voided..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidingPayment(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidPayment}
              disabled={loading || !voidReason.trim()}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Void Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
import { History, Edit, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Payment, PaymentMethod, formatCurrency, formatDateTime } from '@/types/school';

interface PaymentHistoryProps {
  payments: Payment[];
  onPaymentUpdated: () => void;
}

export default function PaymentHistory({ payments, onPaymentUpdated }: PaymentHistoryProps) {
  const { user, isSuperAdmin } = useAuth();
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [voidingPayment, setVoidingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('cash');
  const [voidReason, setVoidReason] = useState('');
  const [editReason, setEditReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canEdit = isSuperAdmin();

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

  // Filter out voided payments for display (or show them differently)
  const activePayments = payments.filter(p => !(p as any).isVoided);

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
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, 10).map((payment) => {
                  const isVoided = (payment as any).isVoided;
                  return (
                    <TableRow key={payment.id} className={isVoided ? 'opacity-50' : ''}>
                      <TableCell className="font-mono text-sm">
                        {payment.transactionId}
                      </TableCell>
                      <TableCell className={isVoided ? 'line-through' : ''}>
                        {formatCurrency(payment.amountPaid)}
                      </TableCell>
                      <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        {isVoided ? (
                          <Badge variant="destructive">Voided</Badge>
                        ) : (
                          <Badge variant="outline" className="text-success border-success">Active</Badge>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          {!isVoided && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(payment)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setVoidingPayment(payment)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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

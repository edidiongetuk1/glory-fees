import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  formatCurrency,
  getClassLabel,
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
  SchoolClass,
} from '@/types/school';
import {
  FileEdit,
  Plus,
  Loader2,
  Check,
  X,
  Clock,
} from 'lucide-react';

interface FeeChangeRequest {
  id: string;
  termId: string;
  class: SchoolClass;
  newIntakeFee: number;
  returningFee: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy: string | null;
  createdAt: Date;
}

const ALL_CLASSES = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];

export default function FeeChangeRequests() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const { activeTerm, terms } = useSchool();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<FeeChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Form state
  const [selectedClass, setSelectedClass] = useState<SchoolClass | ''>('');
  const [newIntakeFee, setNewIntakeFee] = useState('');
  const [returningFee, setReturningFee] = useState('');

  const isAdmin = isSuperAdmin();
  const canRequestFeeChange = hasPermission('edit_fees') || isAdmin;

  useEffect(() => {
    fetchRequests();
  }, [activeTerm]);

  const fetchRequests = async () => {
    if (!activeTerm) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fee_changes')
        .select('*')
        .eq('term_id', activeTerm.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data || []).map(r => ({
        id: r.id,
        termId: r.term_id,
        class: r.class as SchoolClass,
        newIntakeFee: Number(r.new_intake_fee),
        returningFee: Number(r.returning_fee),
        status: r.status as 'pending' | 'approved' | 'rejected',
        requestedBy: r.requested_by,
        approvedBy: r.approved_by,
        createdAt: new Date(r.created_at),
      })));
    } catch (error) {
      console.error('Error fetching fee change requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!user || !activeTerm || !selectedClass || !newIntakeFee || !returningFee) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('fee_changes')
        .insert({
          term_id: activeTerm.id,
          class: selectedClass,
          new_intake_fee: parseFloat(newIntakeFee),
          returning_fee: parseFloat(returningFee),
          requested_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setRequests(prev => [{
          id: data.id,
          termId: data.term_id,
          class: data.class as SchoolClass,
          newIntakeFee: Number(data.new_intake_fee),
          returningFee: Number(data.returning_fee),
          status: data.status as 'pending' | 'approved' | 'rejected',
          requestedBy: data.requested_by,
          approvedBy: data.approved_by,
          createdAt: new Date(data.created_at),
        }, ...prev]);

        toast({
          title: 'Request Submitted',
          description: 'Your fee change request has been submitted for approval',
        });

        setIsDialogOpen(false);
        setSelectedClass('');
        setNewIntakeFee('');
        setReturningFee('');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit fee change request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!user) return;

    setProcessingId(requestId);
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request || !activeTerm) return;

      // Update the request status
      const { error: updateError } = await supabase
        .from('fee_changes')
        .update({
          status: 'approved',
          approved_by: user.id,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update the term fees
      const currentFees = activeTerm.fees || [];
      const updatedFees = currentFees.map(f => 
        f.class === request.class 
          ? { ...f, newIntakeFee: request.newIntakeFee, returningFee: request.returningFee }
          : f
      );

      const { error: feesError } = await supabase
        .from('terms')
        .update({ fees: JSON.parse(JSON.stringify(updatedFees)) })
        .eq('id', activeTerm.id);

      if (feesError) throw feesError;

      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'approved', approvedBy: user.id } : r
      ));

      toast({
        title: 'Request Approved',
        description: `Fee change for ${getClassLabel(request.class)} has been approved and applied`,
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user) return;

    setProcessingId(requestId);
    try {
      const { error } = await supabase
        .from('fee_changes')
        .update({
          status: 'rejected',
          approved_by: user.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'rejected', approvedBy: user.id } : r
      ));

      toast({
        title: 'Request Rejected',
        description: 'The fee change request has been rejected',
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  // Get current fee for selected class
  const getCurrentFee = (classValue: SchoolClass) => {
    if (!activeTerm) return null;
    return activeTerm.fees?.find(f => f.class === classValue);
  };

  const currentFee = selectedClass ? getCurrentFee(selectedClass) : null;

  if (!canRequestFeeChange && !isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileEdit className="w-5 h-5" />
            Fee Change Requests
          </CardTitle>
          <CardDescription>Request and manage fee modifications</CardDescription>
        </div>
        {canRequestFeeChange && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Fee Change</DialogTitle>
                <DialogDescription>
                  Submit a request to modify fees for a class. This requires admin approval.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={(v) => setSelectedClass(v as SchoolClass)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CLASSES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentFee && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="text-muted-foreground">Current Fees:</p>
                    <p>New Intake: {formatCurrency(currentFee.newIntakeFee)}</p>
                    <p>Returning: {formatCurrency(currentFee.returningFee)}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>New Intake Fee (₦)</Label>
                  <Input
                    type="number"
                    value={newIntakeFee}
                    onChange={(e) => setNewIntakeFee(e.target.value)}
                    placeholder="Enter new intake fee"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Returning Fee (₦)</Label>
                  <Input
                    type="number"
                    value={returningFee}
                    onChange={(e) => setReturningFee(e.target.value)}
                    placeholder="Enter returning student fee"
                  />
                </div>

                <Button 
                  onClick={handleSubmitRequest} 
                  className="w-full"
                  disabled={isSubmitting || !selectedClass || !newIntakeFee || !returningFee}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No fee change requests for this term
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{getClassLabel(request.class)}</p>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <p>New Intake: {formatCurrency(request.newIntakeFee)}</p>
                      <p>Returning: {formatCurrency(request.returningFee)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requested on {request.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  {isAdmin && request.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingId === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingId === request.id}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
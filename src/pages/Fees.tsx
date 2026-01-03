import { useState, useEffect } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/use-page-meta';
import {
  formatCurrency,
  getClassLabel,
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
  FeeStructure,
} from '@/types/school';
import { DollarSign, Save, Edit, X, AlertCircle, Loader2 } from 'lucide-react';

export default function Fees() {
  const {
    sessions,
    terms,
    updateTermFees,
    setActiveSession,
    setActiveTerm,
  } = useSchool();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  usePageMeta({
    title: 'Fees Management | Soaring Glory',
    description: 'Manage school fees for each session and term.',
    canonicalPath: '/fees',
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [editingFees, setEditingFees] = useState<FeeStructure[] | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const sessionTerms = terms.filter(t => t.sessionId === selectedSessionId);
  const selectedTerm = terms.find(t => t.id === selectedTermId);

  const ensureAllFeeRows = (fees: FeeStructure[]): FeeStructure[] => {
    const classes = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];
    const byClass = new Map(fees.map(f => [f.class, f]));
    return classes.map((c) => (
      byClass.get(c.value) ?? { class: c.value, newIntakeFee: 0, returningFee: 0 }
    ));
  };

  // Reset term selection when session changes
  useEffect(() => {
    setSelectedTermId('');
    setEditingFees(null);
  }, [selectedSessionId]);

  // Reset editing when term changes
  useEffect(() => {
    setEditingFees(null);
  }, [selectedTermId]);

  if (!hasPermission('settings')) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center p-8">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              You don't have permission to manage fees. Please contact your administrator.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveFees = async () => {
    if (!selectedTermId || !editingFees) return;
    await updateTermFees(selectedTermId, editingFees);
    setEditingFees(null);
    toast({
      title: 'Fees Updated',
      description: 'Fee structure has been saved successfully',
    });
  };

  const handleMakeActive = async () => {
    if (!selectedSessionId || !selectedTermId || !selectedTerm) return;
    setIsActivating(true);
    try {
      await setActiveSession(selectedSessionId);
      await setActiveTerm(selectedTermId);
      toast({
        title: 'Term Activated',
        description: `${selectedTerm.term} Term is now active`,
      });
    } finally {
      setIsActivating(false);
    }
  };

  const updateFee = (classValue: string, field: 'newIntakeFee' | 'returningFee', value: number) => {
    if (!editingFees) return;
    setEditingFees(
      editingFees.map(f =>
        f.class === classValue ? { ...f, [field]: value } : f
      )
    );
  };

  const displayFees = editingFees || selectedTerm?.fees || [];
  const allClasses = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-primary" />
            Fee Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure school fees for each term and session
          </p>
        </div>

        {/* Session & Term Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Session & Term</CardTitle>
            <CardDescription>
              Choose a session and term to view or edit fees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Session</Label>
                <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.name} ({session.startYear}/{session.endYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Term</Label>
                <Select 
                  value={selectedTermId} 
                  onValueChange={setSelectedTermId}
                  disabled={!selectedSessionId || sessionTerms.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedSessionId 
                        ? "Select a session first" 
                        : sessionTerms.length === 0 
                          ? "No terms available" 
                          : "Select a term"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTerms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.term} Term
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSessionId && sessionTerms.length === 0 && (
              <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">No terms available</p>
                  <p className="text-sm text-muted-foreground">
                    Please create terms for this session in the Settings page first.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Configuration Table */}
        {selectedTerm && (
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>
                  {selectedTerm.term} Term - {selectedSession?.name}
                </CardDescription>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status:{' '}
                  <span className={selectedTerm.isActive ? 'text-success' : 'text-warning'}>
                    {selectedTerm.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selectedTerm.isActive && (
                  <Button variant="gold" onClick={handleMakeActive} disabled={isActivating}>
                    {isActivating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      'Make Active'
                    )}
                  </Button>
                )}
                {editingFees ? (
                  <>
                    <Button variant="outline" onClick={() => setEditingFees(null)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button variant="gold" onClick={handleSaveFees}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEditingFees(ensureAllFeeRows(selectedTerm.fees))}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Fees
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">New Intake Fee</TableHead>
                      <TableHead className="text-right">Returning Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allClasses.map((classOption) => {
                      const feeData = displayFees.find(f => f.class === classOption.value);
                      return (
                        <TableRow key={classOption.value}>
                          <TableCell className="font-medium">
                            {getClassLabel(classOption.value)}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingFees ? (
                              <Input
                                type="number"
                                value={feeData?.newIntakeFee || 0}
                                onChange={(e) => updateFee(classOption.value, 'newIntakeFee', parseFloat(e.target.value) || 0)}
                                className="w-32 ml-auto text-right"
                              />
                            ) : (
                              formatCurrency(feeData?.newIntakeFee || 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingFees ? (
                              <Input
                                type="number"
                                value={feeData?.returningFee || 0}
                                onChange={(e) => updateFee(classOption.value, 'returningFee', parseFloat(e.target.value) || 0)}
                                className="w-32 ml-auto text-right"
                              />
                            ) : (
                              formatCurrency(feeData?.returningFee || 0)
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedTerm && selectedSessionId && sessionTerms.length > 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-medium mb-2">Select a Term</h3>
              <p className="text-muted-foreground">
                Choose a term from the dropdown above to view or edit its fee structure.
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedSessionId && (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-medium mb-2">Get Started</h3>
              <p className="text-muted-foreground">
                Select an academic session to manage its fee structures.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  formatCurrency,
  getClassLabel,
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
  FeeStructure,
  Term,
} from '@/types/school';
import {
  Settings as SettingsIcon,
  FolderPlus,
  FolderOpen,
  FileText,
  Check,
  Save,
  Calendar,
} from 'lucide-react';

export default function Settings() {
  const {
    sessions,
    activeSession,
    createSession,
    setActiveSession,
    terms,
    activeTerm,
    createTerm,
    setActiveTerm,
    updateTermFees,
  } = useSchool();
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionStartYear, setNewSessionStartYear] = useState(new Date().getFullYear());
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingFees, setEditingFees] = useState<FeeStructure[] | null>(null);

  if (!hasPermission('settings')) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center p-8">
            <SettingsIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              You don't have permission to access settings. Please contact your administrator.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentSessionTerms = terms.filter(t => t.sessionId === activeSession?.id);

  const handleCreateSession = () => {
    if (!newSessionName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a session name',
        variant: 'destructive',
      });
      return;
    }

    createSession(newSessionName, newSessionStartYear, newSessionStartYear + 1);
    toast({
      title: 'Session Created',
      description: `${newSessionName} has been created successfully`,
    });
    setNewSessionName('');
    setIsSessionDialogOpen(false);
  };

  const handleCreateTerm = (term: Term) => {
    if (!activeSession) return;
    createTerm(activeSession.id, term);
    toast({
      title: 'Term Created',
      description: `${term} Term has been created for ${activeSession.name}`,
    });
  };

  const handleActivateTerm = (termId: string) => {
    setActiveTerm(termId);
    toast({
      title: 'Term Activated',
      description: 'The selected term is now active',
    });
  };

  const handleSaveFees = () => {
    if (!activeTerm || !editingFees) return;
    updateTermFees(activeTerm.id, editingFees);
    setEditingFees(null);
    toast({
      title: 'Fees Updated',
      description: 'Fee structure has been saved successfully',
    });
  };

  const updateFee = (classValue: string, field: 'newIntakeFee' | 'returningFee', value: number) => {
    if (!editingFees) return;
    setEditingFees(
      editingFees.map(f =>
        f.class === classValue ? { ...f, [field]: value } : f
      )
    );
  };

  const displayFees = editingFees || activeTerm?.fees || [];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure academic sessions, terms, and fee structures
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Sessions Column */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Sessions
                </CardTitle>
                <CardDescription>Academic year folders</CardDescription>
              </div>
              <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>
                      Add a new academic year session folder
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Session Name</Label>
                      <Input
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        placeholder="e.g., 2025/2026 Session"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Year</Label>
                      <Input
                        type="number"
                        value={newSessionStartYear}
                        onChange={(e) => setNewSessionStartYear(parseInt(e.target.value))}
                      />
                    </div>
                    <Button onClick={handleCreateSession} className="w-full">
                      Create Session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSession(session.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    activeSession?.id === session.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                  }`}
                >
                  <FolderOpen className={`w-6 h-6 ${
                    activeSession?.id === session.id ? 'text-primary' : 'text-secondary'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.startYear} - {session.endYear}
                    </p>
                  </div>
                  {activeSession?.id === session.id && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Terms Column */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Terms
              </CardTitle>
              <CardDescription>
                {activeSession ? `Terms in ${activeSession.name}` : 'Select a session first'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSession ? (
                <>
                  {(['1st', '2nd', '3rd'] as Term[]).map((term) => {
                    const existingTerm = currentSessionTerms.find(t => t.term === term);
                    return (
                      <div
                        key={term}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          existingTerm
                            ? activeTerm?.id === existingTerm.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-muted/50 border-2 border-transparent'
                            : 'bg-muted/30 border-2 border-dashed border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${
                            existingTerm 
                              ? activeTerm?.id === existingTerm.id 
                                ? 'text-primary' 
                                : 'text-muted-foreground'
                              : 'text-muted-foreground/50'
                          }`} />
                          <span className={`font-medium ${!existingTerm && 'text-muted-foreground'}`}>
                            {term} Term
                          </span>
                        </div>
                        {existingTerm ? (
                          <Button
                            variant={activeTerm?.id === existingTerm.id ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleActivateTerm(existingTerm.id)}
                          >
                            {activeTerm?.id === existingTerm.id ? 'Active' : 'Activate'}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateTerm(term)}
                          >
                            Create
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Select a session to view terms</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Term Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Configuration</CardTitle>
              <CardDescription>Currently selected session and term</CardDescription>
            </CardHeader>
            <CardContent>
              {activeTerm && activeSession ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg gradient-navy text-primary-foreground">
                    <p className="text-sm opacity-80">Current Session</p>
                    <p className="text-lg font-bold">{activeSession.name}</p>
                    <p className="text-sm opacity-80 mt-2">Active Term</p>
                    <p className="text-lg font-bold">{activeTerm.term} Term</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All payments and reports are locked to this configuration until changed.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <SettingsIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No active configuration</p>
                  <p className="text-sm mt-1">Select a session and activate a term</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fee Configuration */}
        {activeTerm && (
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fee Configuration</CardTitle>
                <CardDescription>
                  Set fees for {activeTerm.term} Term - {activeSession?.name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {editingFees ? (
                  <>
                    <Button variant="outline" onClick={() => setEditingFees(null)}>
                      Cancel
                    </Button>
                    <Button variant="gold" onClick={handleSaveFees}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setEditingFees([...activeTerm.fees])}>
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
                    {[...PRIMARY_CLASSES, ...SECONDARY_CLASSES].map((c) => {
                      const fee = displayFees.find(f => f.class === c.value);
                      return (
                        <TableRow key={c.value}>
                          <TableCell className="font-medium">{c.label}</TableCell>
                          <TableCell className="text-right">
                            {editingFees ? (
                              <Input
                                type="number"
                                value={fee?.newIntakeFee || 0}
                                onChange={(e) => updateFee(c.value, 'newIntakeFee', parseInt(e.target.value) || 0)}
                                className="w-32 ml-auto text-right"
                              />
                            ) : (
                              formatCurrency(fee?.newIntakeFee || 0)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingFees ? (
                              <Input
                                type="number"
                                value={fee?.returningFee || 0}
                                onChange={(e) => updateFee(c.value, 'returningFee', parseInt(e.target.value) || 0)}
                                className="w-32 ml-auto text-right"
                              />
                            ) : (
                              formatCurrency(fee?.returningFee || 0)
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
      </div>
    </DashboardLayout>
  );
}

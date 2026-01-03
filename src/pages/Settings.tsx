import { useState, useEffect } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import FeeChangeRequests from '@/components/settings/FeeChangeRequests';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  UserRole,
} from '@/types/school';
import {
  Settings as SettingsIcon,
  FolderPlus,
  FolderOpen,
  FileText,
  Check,
  Save,
  Calendar,
  ArrowUpCircle,
  Loader2,
  UserCog,
  Shield,
  Trash2,
  Pencil,
} from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export default function Settings() {
  const {
    sessions,
    activeSession,
    createSession,
    updateSession,
    deleteSession,
    setActiveSession,
    terms,
    activeTerm,
    createTerm,
    setActiveTerm,
    updateTermFees,
    promoteStudentsToNextClass,
    students,
  } = useSchool();
  const { hasPermission, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionStartYear, setNewSessionStartYear] = useState(new Date().getFullYear());
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingFees, setEditingFees] = useState<FeeStructure[] | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  
  // Edit session state
  const [editingSession, setEditingSession] = useState<{ id: string; name: string; startYear: number; endYear: number } | null>(null);
  const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  
  // Role management state
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const isSuperAdminUser = isSuperAdmin();

  // Fetch users for role management
  useEffect(() => {
    if (isSuperAdminUser) {
      fetchUsers();
    }
  }, [isSuperAdminUser]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles for emails
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');

      if (profilesError) throw profilesError;

      // Create a map of user_id to email
      const emailMap = new Map<string, string | null>();
      (profilesData || []).forEach(p => emailMap.set(p.id, p.email));

      setUsers((rolesData || []).map(r => ({
        id: r.user_id,
        email: emailMap.get(r.user_id) || null,
        role: r.role as UserRole,
        created_at: r.created_at,
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({
        title: 'Role Updated',
        description: `User role changed to ${newRole.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const getRoleBadgeVariant = (role: UserRole): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'super_admin': return 'default';
      case 'bursary': return 'secondary';
      default: return 'outline';
    }
  };

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
  const canPromoteStudents = hasPermission('promote_students');

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

  const handleEditSession = (session: { id: string; name: string; startYear: number; endYear: number }) => {
    setEditingSession({ ...session });
    setIsEditSessionDialogOpen(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession || !editingSession.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a session name',
        variant: 'destructive',
      });
      return;
    }

    const success = await updateSession(
      editingSession.id,
      editingSession.name,
      editingSession.startYear,
      editingSession.endYear
    );
    
    if (success) {
      setEditingSession(null);
      setIsEditSessionDialogOpen(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingSessionId(sessionId);
    await deleteSession(sessionId);
    setDeletingSessionId(null);
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

  const handlePromoteStudents = async () => {
    setIsPromoting(true);
    try {
      const results = await promoteStudentsToNextClass();
      toast({
        title: 'Class Promotion Complete',
        description: `${results.promoted} students promoted, ${results.graduated} graduated (SSS 3), ${results.manual} Creche students require manual promotion`,
      });
    } finally {
      setIsPromoting(false);
    }
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
              {/* Session Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Active Session</Label>
                <Select
                  value={activeSession?.id || ''}
                  onValueChange={(value) => setActiveSession(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          <span>{session.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({session.startYear}-{session.endYear})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Session List */}
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    activeSession?.id === session.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                  }`}
                >
                  <button
                    onClick={() => setActiveSession(session.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <FolderOpen className={`w-6 h-6 flex-shrink-0 ${
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
                  
                  {/* Edit & Delete buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSession({
                          id: session.id,
                          name: session.name,
                          startYear: session.startYear,
                          endYear: session.endYear,
                        });
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deletingSessionId === session.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{session.name}" and all associated terms. 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Edit Session Dialog */}
          <Dialog open={isEditSessionDialogOpen} onOpenChange={setIsEditSessionDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Session</DialogTitle>
                <DialogDescription>
                  Update academic year session details
                </DialogDescription>
              </DialogHeader>
              {editingSession && (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Session Name</Label>
                    <Input
                      value={editingSession.name}
                      onChange={(e) => setEditingSession({ ...editingSession, name: e.target.value })}
                      placeholder="e.g., 2025/2026 Session"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Year</Label>
                      <Input
                        type="number"
                        value={editingSession.startYear}
                        onChange={(e) => setEditingSession({ ...editingSession, startYear: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Year</Label>
                      <Input
                        type="number"
                        value={editingSession.endYear}
                        onChange={(e) => setEditingSession({ ...editingSession, endYear: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditSessionDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateSession} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

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

        {/* Class Promotion - Only for Super Admin */}
        {canPromoteStudents && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-primary" />
                Class Promotion
              </CardTitle>
              <CardDescription>
                Promote all students to their next class for the new session. 
                Creche students require manual promotion. SSS 3 students will be marked as graduated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Total Students: {students.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {activeTerm?.term !== '3rd' ? (
                      <span className="text-warning">Promotion is only available at the end of 3rd Term.</span>
                    ) : (
                      'Students will be promoted to the next class and marked as returning students.'
                    )}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="gold" 
                      disabled={isPromoting || students.length === 0 || activeTerm?.term !== '3rd'}
                    >
                      {isPromoting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Promoting...
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="w-4 h-4 mr-2" />
                          Promote All Students
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Class Promotion</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will promote all students to their next class:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Creche students will be skipped (require manual promotion)</li>
                          <li>SSS 3 students will be marked as graduated</li>
                          <li>All other students move to the next class</li>
                          <li>Students will be marked as "returning" instead of "new intake"</li>
                        </ul>
                        <p className="mt-4 font-medium">This action cannot be undone easily!</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePromoteStudents}>
                        Yes, Promote All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Fee Change Requests */}
        {activeTerm && (
          <FeeChangeRequests />
        )}

        {/* Role Management - Super Admin Only */}
        {isSuperAdminUser && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                Role Management
              </CardTitle>
              <CardDescription>
                Assign roles to staff members. Only super admins can manage user roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Role Descriptions */}
              <div className="grid gap-3 md:grid-cols-3 mb-6">
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-primary" />
                    <Badge variant="default">Super Admin</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full access: Edit/delete all records, approve fees, manage roles
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-secondary/20 bg-secondary/5">
                  <Badge variant="secondary" className="mb-1">Bursary</Badge>
                  <p className="text-xs text-muted-foreground">
                    Add students, record payments, request fee changes
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <Badge variant="outline" className="mb-1">Staff</Badge>
                  <p className="text-xs text-muted-foreground">
                    View-only access to students and payments
                  </p>
                </div>
              </div>

              {/* Users Table */}
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Change Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.email || <span className="text-muted-foreground italic">No email</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role === 'super_admin' ? 'Super Admin' : 
                               user.role === 'bursary' ? 'Bursary' : 'Staff'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={user.role}
                              onValueChange={(value: UserRole) => updateUserRole(user.id, value)}
                              disabled={updatingRole === user.id}
                            >
                              <SelectTrigger className="w-[140px] ml-auto">
                                {updatingRole === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="bursary">Bursary</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

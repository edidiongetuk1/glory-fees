import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
  getClassLabel,
  Section,
  SchoolClass,
  Student,
  ALL_CLASSES,
} from '@/types/school';
import {
  Users,
  UserPlus,
  Search,
  FolderOpen,
  GraduationCap,
  Hash,
  Pencil,
  Trash2,
} from 'lucide-react';

export default function Students() {
  const { students, addStudent, updateStudent, deleteStudent, getStudentsByClass } = useSchool();
  const { hasPermission, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Form state
  const [formSection, setFormSection] = useState<Section>('primary');
  const [formClass, setFormClass] = useState<SchoolClass | ''>('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [yearOfEntry, setYearOfEntry] = useState('25');
  const [isNewIntake, setIsNewIntake] = useState(true);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editMiddleName, setEditMiddleName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editClass, setEditClass] = useState<SchoolClass | ''>('');
  const [editIsNewIntake, setEditIsNewIntake] = useState(true);

  const classOptions = formSection === 'primary' ? PRIMARY_CLASSES : SECONDARY_CLASSES;

  const displayedStudents = selectedClass 
    ? getStudentsByClass(selectedClass)
    : searchQuery
      ? students.filter(s => 
          s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.regNumber.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  const canAddStudent = hasPermission('add_student');
  const canEditStudent = hasPermission('edit_student');
  const canDeleteStudent = hasPermission('delete_student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !surname.trim() || !formClass) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newStudent = await addStudent({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      surname: surname.trim(),
      section: formSection,
      class: formClass,
      yearOfEntry,
      isNewIntake,
    });

    if (newStudent) {
      toast({
        title: 'Student Registered',
        description: `${newStudent.firstName} ${newStudent.surname} has been registered with ID: ${newStudent.regNumber}`,
      });
    }

    // Reset form
    setFirstName('');
    setMiddleName('');
    setSurname('');
    setIsDialogOpen(false);
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setEditFirstName(student.firstName);
    setEditMiddleName(student.middleName || '');
    setEditSurname(student.surname);
    setEditClass(student.class);
    setEditIsNewIntake(student.isNewIntake);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const success = await updateStudent(selectedStudent.id, {
      firstName: editFirstName.trim(),
      middleName: editMiddleName.trim() || undefined,
      surname: editSurname.trim(),
      class: editClass as SchoolClass,
      isNewIntake: editIsNewIntake,
    });

    if (success) {
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    const success = await deleteStudent(selectedStudent.id, 'Deleted by admin');
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Student Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage student records and registrations
            </p>
          </div>
          
          {canAddStudent && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gold">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Register New Student</DialogTitle>
                  <DialogDescription>
                    Enter the student's details to generate their unique registration number
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  {/* Section Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={formSection === 'primary' ? 'default' : 'outline'}
                      className="h-auto py-4 flex-col"
                      onClick={() => {
                        setFormSection('primary');
                        setFormClass('');
                      }}
                    >
                      <GraduationCap className="w-6 h-6 mb-2" />
                      <span>Primary</span>
                      <span className="text-xs opacity-70">Creche - Primary 5</span>
                    </Button>
                    <Button
                      type="button"
                      variant={formSection === 'secondary' ? 'default' : 'outline'}
                      className="h-auto py-4 flex-col"
                      onClick={() => {
                        setFormSection('secondary');
                        setFormClass('');
                      }}
                    >
                      <GraduationCap className="w-6 h-6 mb-2" />
                      <span>Secondary</span>
                      <span className="text-xs opacity-70">JSS 1 - SSS 3</span>
                    </Button>
                  </div>

                  {/* Class Selection */}
                  <div className="space-y-2">
                    <Label>Class *</Label>
                    <Select value={formClass} onValueChange={(v) => setFormClass(v as SchoolClass)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classOptions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        placeholder="Middle name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Surname *</Label>
                    <Input
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="Surname"
                    />
                  </div>

                  {/* Year & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Year of Entry</Label>
                      <Select value={yearOfEntry} onValueChange={setYearOfEntry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="26">2026 (New)</SelectItem>
                          <SelectItem value="25">2025</SelectItem>
                          <SelectItem value="24">2024</SelectItem>
                          <SelectItem value="00">Old Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select 
                        value={isNewIntake ? 'new' : 'returning'} 
                        onValueChange={(v) => setIsNewIntake(v === 'new')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New Intake</SelectItem>
                          <SelectItem value="returning">Returning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" variant="gold" className="w-full">
                    Register Student
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or registration number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedClass(null);
                }}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Class Folders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Primary Section */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              Nursery & Primary
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
              {PRIMARY_CLASSES.map((c) => {
                const count = getStudentsByClass(c.value).length;
                const isSelected = selectedClass === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => {
                      setSelectedClass(isSelected ? null : c.value);
                      setSearchQuery('');
                    }}
                    className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-card'
                        : 'border-border bg-card hover:border-primary/30 hover:shadow-soft'
                    }`}
                  >
                    <FolderOpen className={`w-5 h-5 sm:w-8 sm:h-8 mb-1 sm:mb-2 ${isSelected ? 'text-primary' : 'text-secondary'}`} />
                    <p className="font-medium text-xs sm:text-sm truncate">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{count}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Section */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary-foreground" />
              </div>
              Secondary
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
              {SECONDARY_CLASSES.map((c) => {
                const count = getStudentsByClass(c.value).length;
                const isSelected = selectedClass === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => {
                      setSelectedClass(isSelected ? null : c.value);
                      setSearchQuery('');
                    }}
                    className={`p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-card'
                        : 'border-border bg-card hover:border-primary/30 hover:shadow-soft'
                    }`}
                  >
                    <FolderOpen className={`w-5 h-5 sm:w-8 sm:h-8 mb-1 sm:mb-2 ${isSelected ? 'text-primary' : 'text-secondary'}`} />
                    <p className="font-medium text-xs sm:text-sm truncate">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{count}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Student List */}
        {(selectedClass || searchQuery) && (
          <Card className="animate-slide-up">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                {selectedClass ? getClassLabel(selectedClass) : 'Search Results'}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {displayedStudents.length} student(s) found
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {displayedStudents.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No students found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {displayedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between py-3 sm:py-4 hover:bg-muted/50 -mx-3 sm:-mx-6 px-3 sm:px-6 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-semibold text-primary text-sm sm:text-base">
                            {student.firstName.charAt(0)}{student.surname.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {student.firstName} {student.middleName} {student.surname}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {student.regNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                            student.isNewIntake 
                              ? 'bg-success/10 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {student.isNewIntake ? 'New' : 'Returning'}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                            {getClassLabel(student.class)}
                          </p>
                        </div>
                        
                        {/* Action buttons - only for super admin */}
                        {(canEditStudent || canDeleteStudent) && (
                          <div className="flex gap-1 ml-2">
                            {canEditStudent && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditClick(student)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteStudent && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(student)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update student details. Only Super Admin can edit student records.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input
                    value={editMiddleName}
                    onChange={(e) => setEditMiddleName(e.target.value)}
                    placeholder="Middle name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Surname *</Label>
                <Input
                  value={editSurname}
                  onChange={(e) => setEditSurname(e.target.value)}
                  placeholder="Surname"
                />
              </div>

              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={editClass} onValueChange={(v) => setEditClass(v as SchoolClass)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
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

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editIsNewIntake ? 'new' : 'returning'} 
                  onValueChange={(v) => setEditIsNewIntake(v === 'new')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Intake</SelectItem>
                    <SelectItem value="returning">Returning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedStudent?.firstName} {selectedStudent?.surname}? 
                This action will archive the student record for reference purposes. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

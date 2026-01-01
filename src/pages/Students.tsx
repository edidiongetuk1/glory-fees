import { useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
  getClassLabel,
  Section,
  SchoolClass,
} from '@/types/school';
import {
  Users,
  UserPlus,
  Search,
  FolderOpen,
  GraduationCap,
  Phone,
  Hash,
} from 'lucide-react';

export default function Students() {
  const { students, addStudent, getStudentsByClass } = useSchool();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formSection, setFormSection] = useState<Section>('primary');
  const [formClass, setFormClass] = useState<SchoolClass | ''>('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [yearOfEntry, setYearOfEntry] = useState('25');
  const [isNewIntake, setIsNewIntake] = useState(true);

  const classOptions = formSection === 'primary' ? PRIMARY_CLASSES : SECONDARY_CLASSES;
  const allClasses = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES];

  const displayedStudents = selectedClass 
    ? getStudentsByClass(selectedClass)
    : searchQuery
      ? students.filter(s => 
          s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.regNumber.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !surname.trim() || !formClass || !parentPhone.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newStudent = addStudent({
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      surname: surname.trim(),
      section: formSection,
      class: formClass,
      parentPhone: parentPhone.trim(),
      yearOfEntry,
      isNewIntake,
    });

    toast({
      title: 'Student Registered',
      description: `${newStudent.firstName} ${newStudent.surname} has been registered with ID: ${newStudent.regNumber}`,
    });

    // Reset form
    setFirstName('');
    setMiddleName('');
    setSurname('');
    setParentPhone('');
    setIsDialogOpen(false);
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

                <div className="space-y-2">
                  <Label>Parent Phone *</Label>
                  <Input
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="e.g., 08012345678"
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
                        <SelectItem value="25">2025 (New)</SelectItem>
                        <SelectItem value="24">2024</SelectItem>
                        <SelectItem value="23">2023</SelectItem>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Primary Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              Nursery & Primary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-card'
                        : 'border-border bg-card hover:border-primary/30 hover:shadow-soft'
                    }`}
                  >
                    <FolderOpen className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : 'text-secondary'}`} />
                    <p className="font-medium text-sm">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{count} students</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Secondary Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-secondary-foreground" />
              </div>
              Secondary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-card'
                        : 'border-border bg-card hover:border-primary/30 hover:shadow-soft'
                    }`}
                  >
                    <FolderOpen className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : 'text-secondary'}`} />
                    <p className="font-medium text-sm">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{count} students</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Student List */}
        {(selectedClass || searchQuery) && (
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {selectedClass ? getClassLabel(selectedClass) : 'Search Results'}
              </CardTitle>
              <CardDescription>
                {displayedStudents.length} student(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayedStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No students found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {displayedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-6 px-6 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {student.firstName.charAt(0)}{student.surname.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.middleName} {student.surname}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {student.regNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {student.parentPhone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          student.isNewIntake 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {student.isNewIntake ? 'New' : 'Returning'}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getClassLabel(student.class)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

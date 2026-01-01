import { useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatCurrency,
  getClassLabel,
  PRIMARY_CLASSES,
  SECONDARY_CLASSES,
} from '@/types/school';
import {
  FileText,
  Download,
  Users,
  AlertTriangle,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function Reports() {
  const {
    students,
    getDebtorsByClass,
    getTotalExpectedRevenue,
    getTotalCollected,
    getStudentFee,
    getStudentBalance,
  } = useSchool();
  const [activeTab, setActiveTab] = useState('debtors');

  const debtorsByClass = getDebtorsByClass();
  const totalExpected = getTotalExpectedRevenue();
  const totalCollected = getTotalCollected();
  const outstanding = totalExpected - totalCollected;

  // Primary debtors
  const primaryDebtors = PRIMARY_CLASSES.map(c => ({
    class: c,
    students: debtorsByClass[c.value] || [],
  })).filter(d => d.students.length > 0);

  // Secondary debtors
  const secondaryDebtors = SECONDARY_CLASSES.map(c => ({
    class: c,
    students: debtorsByClass[c.value] || [],
  })).filter(d => d.students.length > 0);

  // Pie chart data
  const pieData = [
    { name: 'Collected', value: totalCollected, color: 'hsl(152, 60%, 40%)' },
    { name: 'Outstanding', value: outstanding, color: 'hsl(38, 92%, 50%)' },
  ];

  // Bar chart data
  const barData = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES].map(c => {
    const classStudents = students.filter(s => s.class === c.value);
    const classDebtors = debtorsByClass[c.value] || [];
    const totalDebt = classDebtors.reduce((sum, s) => sum + getStudentBalance(s.id), 0);
    
    return {
      name: c.label.replace('Primary ', 'P').replace('Nursery ', 'N').replace('Tender Love ', 'TL'),
      students: classStudents.length,
      debtors: classDebtors.length,
      debt: totalDebt,
    };
  });

  const downloadReport = (section: 'primary' | 'secondary') => {
    const debtors = section === 'primary' ? primaryDebtors : secondaryDebtors;
    let csv = 'Class,Reg Number,Name,Fee Payable,Balance\n';
    
    debtors.forEach(({ class: c, students: debtorStudents }) => {
      debtorStudents.forEach(student => {
        const fee = getStudentFee(student);
        const balance = getStudentBalance(student.id);
        csv += `"${c.label}","${student.regNumber}","${student.firstName} ${student.surname}",${fee},${balance}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section}-debtors-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              View financial reports and download debtors lists
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Expected Revenue</p>
                  <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(totalExpected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-success/10 flex-shrink-0">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-base sm:text-xl font-bold text-success truncate">{formatCurrency(totalCollected)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-warning/10 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-base sm:text-xl font-bold text-warning truncate">{formatCurrency(outstanding)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="debtors" className="gap-2">
              <FileText className="w-4 h-4" />
              Debtors List
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <PieChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="debtors" className="mt-6 space-y-6">
            {/* Primary Debtors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Primary Section Debtors
                  </CardTitle>
                  <CardDescription>
                    {primaryDebtors.reduce((sum, d) => sum + d.students.length, 0)} students with outstanding fees
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadReport('primary')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent>
                {primaryDebtors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No debtors in Primary section</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {primaryDebtors.map(({ class: c, students: debtorStudents }) => (
                      <div key={c.value}>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {c.label} ({debtorStudents.length})
                        </h3>
                        <div className="bg-muted/50 rounded-lg divide-y divide-border">
                          {debtorStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3">
                              <div>
                                <p className="font-medium text-sm">
                                  {student.firstName} {student.surname}
                                </p>
                                <p className="text-xs text-muted-foreground">{student.regNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-warning">
                                  {formatCurrency(getStudentBalance(student.id))}
                                </p>
                                <p className="text-xs text-muted-foreground">outstanding</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Secondary Debtors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Secondary Section Debtors
                  </CardTitle>
                  <CardDescription>
                    {secondaryDebtors.reduce((sum, d) => sum + d.students.length, 0)} students with outstanding fees
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadReport('secondary')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </CardHeader>
              <CardContent>
                {secondaryDebtors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No debtors in Secondary section</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {secondaryDebtors.map(({ class: c, students: debtorStudents }) => (
                      <div key={c.value}>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary" />
                          {c.label} ({debtorStudents.length})
                        </h3>
                        <div className="bg-muted/50 rounded-lg divide-y divide-border">
                          {debtorStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3">
                              <div>
                                <p className="font-medium text-sm">
                                  {student.firstName} {student.surname}
                                </p>
                                <p className="text-xs text-muted-foreground">{student.regNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-warning">
                                  {formatCurrency(getStudentBalance(student.id))}
                                </p>
                                <p className="text-xs text-muted-foreground">outstanding</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 sm:mt-6">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Collected vs Outstanding Fees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-card)',
                          }}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Students & Debtors by Class */}
              <Card>
                <CardHeader>
                  <CardTitle>Students by Class</CardTitle>
                  <CardDescription>Total students vs debtors per class</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-card)',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="students" name="Total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="debtors" name="Debtors" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

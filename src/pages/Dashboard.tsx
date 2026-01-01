import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, getClassLabel, PRIMARY_CLASSES, SECONDARY_CLASSES } from '@/types/school';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  Receipt,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    students, 
    recentStudents, 
    getTotalExpectedRevenue, 
    getTotalCollected,
    getDebtorsByClass,
  } = useSchool();

  const totalExpected = getTotalExpectedRevenue();
  const totalCollected = getTotalCollected();
  const outstanding = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  const debtorsByClass = getDebtorsByClass();
  const totalDebtors = Object.values(debtorsByClass).flat().length;

  // Pie chart data
  const pieData = [
    { name: 'Collected', value: totalCollected, color: 'hsl(152, 60%, 40%)' },
    { name: 'Outstanding', value: outstanding, color: 'hsl(38, 92%, 50%)' },
  ];

  // Bar chart data - debt by class
  const barData = [...PRIMARY_CLASSES, ...SECONDARY_CLASSES]
    .map(c => ({
      name: getClassLabel(c.value).replace('Primary ', 'P').replace('Nursery ', 'N'),
      debtors: debtorsByClass[c.value]?.length || 0,
    }))
    .filter(d => d.debtors > 0)
    .slice(0, 8);

  const stats = [
    {
      label: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Collected',
      value: formatCurrency(totalCollected),
      icon: CreditCard,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Collection Rate',
      value: `${collectionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'Total Debtors',
      value: totalDebtors,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Welcome, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your school's financial status
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
              <Link to="/students">
                <UserPlus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Student</span>
              </Link>
            </Button>
            <Button variant="gold" size="sm" asChild className="flex-1 sm:flex-none">
              <Link to="/payments">
                <Receipt className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Receive Payment</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <Card key={stat.label} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{stat.value}</p>
                  </div>
                  <div className={`p-2 sm:p-2.5 rounded-lg ${stat.bgColor} flex-shrink-0`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue Pie Chart */}
          <Card className="animate-slide-up">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Revenue Overview</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Collected vs Outstanding Fees</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 sm:gap-6 mt-3 sm:mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs sm:text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Debtors Bar Chart */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Debtors by Class</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Students with outstanding fees</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={50}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-card)',
                      }}
                    />
                    <Bar
                      dataKey="debtors"
                      fill="hsl(var(--chart-2))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* Recently Registered */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Recently Registered</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Latest student enrollments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/students">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {recentStudents.slice(0, 5).map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {student.firstName.charAt(0)}{student.surname.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">
                          {student.firstName} {student.surname}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {student.regNumber} • {getClassLabel(student.class)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0 ml-2">
                      {formatDateTime(student.createdAt).split(',')[0]}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" asChild className="w-full mt-3 sm:hidden">
                <Link to="/students">
                  View All Students
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
              <Link
                to="/students"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 border-transparent bg-muted/50 hover:border-primary/20 hover:bg-muted transition-all group"
              >
                <div className="p-2 sm:p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">Register New Student</p>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Add a new student to the system</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>

              <Link
                to="/payments"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 border-transparent bg-muted/50 hover:border-secondary/20 hover:bg-muted transition-all group"
              >
                <div className="p-2 sm:p-3 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors flex-shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">Receive Payment</p>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Process student fee payment</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-secondary transition-colors flex-shrink-0" />
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 border-transparent bg-muted/50 hover:border-warning/20 hover:bg-muted transition-all group"
              >
                <div className="p-2 sm:p-3 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors flex-shrink-0">
                  <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">View Debtors Report</p>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Check outstanding payments by class</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-warning transition-colors flex-shrink-0" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

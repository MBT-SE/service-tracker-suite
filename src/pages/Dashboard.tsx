import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Target, DollarSign, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalIncome: number;
  target: number;
  achievement: number;
  gap: number;
  quarterlyData: Array<{ quarter: string; income: number; target: number }>;
  categoryData: Array<{ name: string; value: number }>;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    target: 0,
    achievement: 0,
    gap: 0,
    quarterlyData: [],
    categoryData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Fetch projects for current year
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("year", currentYear);

      // Fetch target for current year
      const { data: targetData } = await supabase
        .from("targets")
        .select("*")
        .eq("year", currentYear)
        .single();

      if (projects) {
        const totalIncome = projects.reduce((sum, p) => sum + Number(p.nett_gp), 0);
        const yearlyTarget = targetData?.yearly_target || 0;
        const achievement = yearlyTarget > 0 ? (totalIncome / yearlyTarget) * 100 : 0;
        const gap = yearlyTarget - totalIncome;

        // Calculate quarterly data
        const quarterlyData = ['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => {
          const quarterIncome = projects
            .filter((p) => p.quarter === quarter)
            .reduce((sum, p) => sum + Number(p.nett_gp), 0);
          
          const quarterTarget = targetData?.[`${quarter.toLowerCase()}_target`] || 0;
          
          return {
            quarter,
            income: quarterIncome,
            target: quarterTarget,
          };
        });

        // Calculate category breakdown
        const categoryMap = new Map<string, number>();
        projects.forEach((p) => {
          const current = categoryMap.get(p.category) || 0;
          categoryMap.set(p.category, current + Number(p.nett_gp));
        });

        const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
          name,
          value,
        }));

        setStats({
          totalIncome,
          target: yearlyTarget,
          achievement,
          gap,
          quarterlyData,
          categoryData,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-muted-foreground">Year {new Date().getFullYear()}</div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.target)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.achievement.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GAP</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(stats.gap)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Target Achievement Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={stats.achievement} className="h-4" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(stats.totalIncome)}</span>
            <span>{formatCurrency(stats.target)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Income vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.quarterlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--chart-1))" name="Income" />
                <Bar dataKey="target" fill="hsl(var(--chart-3))" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

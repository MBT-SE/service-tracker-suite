import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Target, DollarSign, AlertCircle, Trophy, Medal, Award, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalIncome: number;
  target: number;
  achievement: number;
  gap: number;
  quarterlyData: Array<{ quarter: string; income: number; target: number }>;
  categoryData: Array<{ name: string; value: number }>;
}

interface PicRanking {
  pic: string;
  totalIncome: number;
  projectCount: number;
}

interface ProductRanking {
  product: string;
  totalIncome: number;
  projectCount: number;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    target: 0,
    achievement: 0,
    gap: 0,
    quarterlyData: [],
    categoryData: [],
  });
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>("");
  const [analyzingData, setAnalyzingData] = useState(false);
  const [topPics, setTopPics] = useState<PicRanking[]>([]);
  const [topProducts, setTopProducts] = useState<ProductRanking[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const analyzeData = async () => {
    setAnalyzingData(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-income', {
        body: {
          totalIncome: stats.totalIncome,
          target: stats.target,
          achievement: stats.achievement,
          gap: stats.gap,
          quarterlyData: stats.quarterlyData,
          categoryData: stats.categoryData,
          year: selectedYear,
        }
      });

      if (error) throw error;
      
      if (data?.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error: any) {
      console.error("Error analyzing data:", error);
      setAnalysis("Failed to generate analysis. Please try again.");
    } finally {
      setAnalyzingData(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const year = parseInt(selectedYear);

      // Fetch projects for selected year
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("year", year);

      // Fetch target for selected year
      const { data: targetData } = await supabase
        .from("targets")
        .select("*")
        .eq("year", year)
        .maybeSingle();

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

        // Calculate top PICs
        const picMap = new Map<string, { total: number; count: number }>();
        projects.forEach((project) => {
          const picName = project.pic || 'N/A';
          const current = picMap.get(picName) || { total: 0, count: 0 };
          picMap.set(picName, {
            total: current.total + Number(project.nett_gp),
            count: current.count + 1,
          });
        });

        const topPicsArray = Array.from(picMap.entries())
          .map(([pic, data]) => ({
            pic,
            totalIncome: data.total,
            projectCount: data.count,
          }))
          .sort((a, b) => b.totalIncome - a.totalIncome)
          .slice(0, 5);

        setTopPics(topPicsArray);

        // Calculate top products
        const productMap = new Map<string, { total: number; count: number }>();
        projects.forEach((project) => {
          const productName = project.product || 'N/A';
          const current = productMap.get(productName) || { total: 0, count: 0 };
          productMap.set(productName, {
            total: current.total + Number(project.nett_gp),
            count: current.count + 1,
          });
        });

        const topProductsArray = Array.from(productMap.entries())
          .map(([product, data]) => ({
            product,
            totalIncome: data.total,
            projectCount: data.count,
          }))
          .sort((a, b) => b.totalIncome - a.totalIncome)
          .slice(0, 5);

        setTopProducts(topProductsArray);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <div className="text-lg font-bold text-muted-foreground">#{rank}</div>;
    }
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
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                Year {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words">{formatCurrency(stats.target)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success break-words">{stats.achievement.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GAP</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning break-words">{formatCurrency(stats.gap)}</div>
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

      {/* Top PICs and Top Products */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top PICs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 5 PICs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPics.map((ranking, index) => (
                <div key={ranking.pic} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-10 flex items-center justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{ranking.pic}</div>
                    <div className="text-xs text-muted-foreground">
                      {ranking.projectCount} {ranking.projectCount === 1 ? "project" : "projects"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-sm break-words">
                      {formatCurrency(ranking.totalIncome)}
                    </div>
                  </div>
                </div>
              ))}
              {topPics.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top 5 Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((ranking, index) => (
                <div key={ranking.product} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-10 flex items-center justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{ranking.product}</div>
                    <div className="text-xs text-muted-foreground">
                      {ranking.projectCount} {ranking.projectCount === 1 ? "project" : "projects"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-sm break-words">
                      {formatCurrency(ranking.totalIncome)}
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analytics & Recommendations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Analytics & Recommendations</CardTitle>
          <button
            onClick={analyzeData}
            disabled={analyzingData || stats.totalIncome === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {analyzingData ? "Analyzing..." : "Generate Insights"}
          </button>
        </CardHeader>
        <CardContent>
          {analysis ? (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{analysis}</div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Click "Generate Insights" to get AI-powered analysis and recommendations based on your income data.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

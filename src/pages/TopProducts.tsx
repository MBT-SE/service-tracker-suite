import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PicBreakdown {
  pic: string;
  income: number;
}

interface ProductRanking {
  product: string;
  totalIncome: number;
  projectCount: number;
  pics: PicBreakdown[];
}

export default function TopProducts() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [rankings, setRankings] = useState<ProductRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, [selectedYear]);

  const fetchRankings = async () => {
    try {
      let query = supabase.from("projects").select("product, nett_gp, pic");

      if (selectedYear !== "all") {
        query = query.eq("year", parseInt(selectedYear));
      }

      const { data: projects } = await query;

      if (projects) {
        // Group by product and calculate totals with PIC breakdown
        const productMap = new Map<string, { 
          total: number; 
          count: number; 
          pics: Map<string, number> 
        }>();
        
        projects.forEach((project) => {
          const productName = project.product || 'N/A';
          const current = productMap.get(productName) || { 
            total: 0, 
            count: 0, 
            pics: new Map() 
          };
          
          const picIncome = current.pics.get(project.pic) || 0;
          current.pics.set(project.pic, picIncome + Number(project.nett_gp));
          
          productMap.set(productName, {
            total: current.total + Number(project.nett_gp),
            count: current.count + 1,
            pics: current.pics,
          });
        });

        // Convert to array and sort by total income
        const rankingsArray = Array.from(productMap.entries())
          .map(([product, data]) => ({
            product,
            totalIncome: data.total,
            projectCount: data.count,
            pics: Array.from(data.pics.entries())
              .map(([pic, income]) => ({ pic, income }))
              .sort((a, b) => b.income - a.income),
          }))
          .sort((a, b) => b.totalIncome - a.totalIncome)
          .slice(0, 5); // Top 5

        setRankings(rankingsArray);
      }
    } catch (error) {
      console.error("Error fetching rankings:", error);
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
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Top Products Ranking</h1>
          <p className="text-muted-foreground mt-1">
            Top 5 products ranked by total income generated
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                Year {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rankings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No data available for the selected period.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rankings.map((ranking, index) => (
            <Card key={ranking.product} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 flex items-center justify-center pt-2">
                    {getRankIcon(index + 1) || (
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {ranking.product}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {ranking.projectCount} {ranking.projectCount === 1 ? "project" : "projects"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary break-words">
                          {formatCurrency(ranking.totalIncome)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Income</p>
                      </div>
                    </div>
                    
                    {ranking.pics.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Users className="h-4 w-4" />
                          Top Contributors
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ranking.pics.map((picData) => (
                            <Badge 
                              key={picData.pic} 
                              variant="secondary"
                              className="text-xs"
                            >
                              {picData.pic}: {formatCurrency(picData.income)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

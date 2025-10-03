import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award } from "lucide-react";

interface PicRanking {
  pic: string;
  totalIncome: number;
  projectCount: number;
}

export default function TopPics() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [rankings, setRankings] = useState<PicRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, [selectedYear]);

  const fetchRankings = async () => {
    try {
      let query = supabase.from("projects").select("pic, nett_gp");

      if (selectedYear !== "all") {
        query = query.eq("year", parseInt(selectedYear));
      }

      const { data: projects } = await query;

      if (projects) {
        // Group by PIC and calculate totals
        const picMap = new Map<string, { total: number; count: number }>();
        
        projects.forEach((project) => {
          const current = picMap.get(project.pic) || { total: 0, count: 0 };
          picMap.set(project.pic, {
            total: current.total + Number(project.nett_gp),
            count: current.count + 1,
          });
        });

        // Convert to array and sort by total income
        const rankingsArray = Array.from(picMap.entries())
          .map(([pic, data]) => ({
            pic,
            totalIncome: data.total,
            projectCount: data.count,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Top PICs Ranking</h1>
          <p className="text-muted-foreground mt-1">
            Top 5 performers ranked by total income generated
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
            <Card key={ranking.pic} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 flex items-center justify-center">
                    {getRankIcon(index + 1) || (
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold truncate">
                      {ranking.pic}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

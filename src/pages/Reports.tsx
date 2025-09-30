import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  pid: string;
  business_partner: string;
  end_user: string;
  category: string;
  product: string;
  pic: string;
  nett_gp: number;
  quarter: string;
  year: number;
}

export default function Reports() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, year, quarter, category]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = projects.filter((p) => p.year.toString() === year);

    if (quarter !== "all") {
      filtered = filtered.filter((p) => p.quarter === quarter);
    }

    if (category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }

    setFilteredProjects(filtered);
  };

  const exportToCSV = () => {
    if (filteredProjects.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "PID",
      "Business Partner",
      "End User",
      "Category",
      "Product",
      "PIC",
      "Nett GP",
      "Quarter",
      "Year",
    ];

    const csvData = filteredProjects.map((p) => [
      p.pid,
      p.business_partner,
      p.end_user,
      p.category,
      p.product || "",
      p.pic,
      p.nett_gp,
      p.quarter,
      p.year,
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects-report-${year}-${quarter}-${category}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Implementation":
        return "bg-chart-1 text-primary-foreground";
      case "Maintenance":
        return "bg-chart-2 text-success-foreground";
      case "LSC":
        return "bg-chart-3 text-warning-foreground";
      default:
        return "bg-muted";
    }
  };

  const totalIncome = filteredProjects.reduce((sum, p) => sum + Number(p.nett_gp), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                    (y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quarter</label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Implementation">Implementation</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="LSC">LSC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Project Report</CardTitle>
            <div className="text-sm text-muted-foreground">
              Total Income: <span className="text-lg font-bold text-foreground">{formatCurrency(totalIncome)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PID</TableHead>
                <TableHead>Business Partner</TableHead>
                <TableHead>End User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Nett GP</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>PIC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No projects found with the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.pid}</TableCell>
                    <TableCell>{project.business_partner}</TableCell>
                    <TableCell>{project.end_user}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(project.category)}>
                        {project.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.product || "-"}</TableCell>
                    <TableCell>{formatCurrency(project.nett_gp)}</TableCell>
                    <TableCell>{project.quarter}</TableCell>
                    <TableCell>{project.pic}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

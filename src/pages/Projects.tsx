import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  keterangan: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = projects.filter(
        (p) =>
          p.pid.toLowerCase().includes(search.toLowerCase()) ||
          p.business_partner.toLowerCase().includes(search.toLowerCase()) ||
          p.end_user.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [search, projects]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      setFilteredProjects(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", deleteId);
      
      if (error) throw error;
      
      toast.success("Project deleted successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteId(null);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => navigate("/projects/add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PID, BP, End User, or Category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
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
                <TableHead>Nett GP</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No projects found
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
                    <TableCell>{formatCurrency(project.nett_gp)}</TableCell>
                    <TableCell>{project.quarter}</TableCell>
                    <TableCell>{project.pic}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/projects/edit/${project.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

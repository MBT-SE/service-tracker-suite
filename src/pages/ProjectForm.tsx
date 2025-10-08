import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import ExcelUpload from "@/components/ExcelUpload";

const projectSchema = z.object({
  pid: z.string().min(1, "PID is required"),
  business_partner: z.string().min(2, "Business Partner is required"),
  end_user: z.string().min(2, "End User is required"),
  category: z.enum(["Implementation", "Maintenance", "LSC"]),
  product: z.string().optional(),
  pic: z.string().min(2, "PIC is required"),
  nett_gp: z.number().positive("Nett GP must be positive"),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  year: z.number(),
  keterangan: z.string().optional(),
});

const products = [
  "NetApp",
  "Oracle",
  "Supermicro",
  "Huawei Cloud",
  "Ruijie",
  "Nakivo",
];

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    pid: "",
    business_partner: "",
    end_user: "",
    category: "Implementation",
    product: "",
    pic: "",
    nett_gp: "",
    quarter: "Q1",
    year: new Date().getFullYear().toString(),
    keterangan: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          pid: data.pid || "",
          business_partner: data.business_partner,
          end_user: data.end_user,
          category: data.category,
          product: data.product || "",
          pic: data.pic,
          nett_gp: data.nett_gp.toString(),
          quarter: data.quarter,
          year: data.year.toString(),
          keterangan: data.keterangan || "",
        });
      }
    } catch (error: any) {
      toast.error(error.message);
      navigate("/projects");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = projectSchema.parse({
        ...formData,
        nett_gp: parseFloat(formData.nett_gp),
        year: parseInt(formData.year),
      });

      if (isEdit) {
        const { error } = await supabase
          .from("projects")
          .update({
            pid: validatedData.pid,
            business_partner: validatedData.business_partner,
            end_user: validatedData.end_user,
            category: validatedData.category,
            product: validatedData.product,
            pic: validatedData.pic,
            nett_gp: validatedData.nett_gp,
            quarter: validatedData.quarter,
            year: validatedData.year,
            keterangan: validatedData.keterangan,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Project updated successfully");
      } else {
        const { error } = await supabase
          .from("projects")
          .insert([{
            pid: validatedData.pid,
            business_partner: validatedData.business_partner,
            end_user: validatedData.end_user,
            category: validatedData.category,
            product: validatedData.product,
            pic: validatedData.pic,
            nett_gp: validatedData.nett_gp,
            quarter: validatedData.quarter,
            year: validatedData.year,
            keterangan: validatedData.keterangan,
          }]);

        if (error) throw error;
        toast.success("Project created successfully");
      }

      navigate("/projects");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? "Edit Project" : "Add New Project"}</h1>
      </div>

      {isEdit ? (
        <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Update Project Details" : "Enter Project Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pid">PID *</Label>
                <Input
                  id="pid"
                  value={formData.pid}
                  onChange={(e) =>
                    setFormData({ ...formData, pid: e.target.value })
                  }
                  placeholder="e.g. P250001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_partner">Business Partner *</Label>
                <Input
                  id="business_partner"
                  value={formData.business_partner}
                  onChange={(e) =>
                    setFormData({ ...formData, business_partner: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_user">End User *</Label>
                <Input
                  id="end_user"
                  value={formData.end_user}
                  onChange={(e) => setFormData({ ...formData, end_user: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Implementation">Implementation</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="LSC">LSC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => setFormData({ ...formData, product: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pic">PIC *</Label>
                <Input
                  id="pic"
                  value={formData.pic}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nett_gp">Nett GP (Rp) *</Label>
                <Input
                  id="nett_gp"
                  type="number"
                  value={formData.nett_gp}
                  onChange={(e) => setFormData({ ...formData, nett_gp: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quarter">Quarter *</Label>
                <Select
                  value={formData.quarter}
                  onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update Project" : "Create Project"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/projects")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      ) : (
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="excel">Upload Excel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Enter Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pid">PID *</Label>
                      <Input
                        id="pid"
                        value={formData.pid}
                        onChange={(e) =>
                          setFormData({ ...formData, pid: e.target.value })
                        }
                        placeholder="e.g. P250001"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_partner">Business Partner *</Label>
                      <Input
                        id="business_partner"
                        value={formData.business_partner}
                        onChange={(e) =>
                          setFormData({ ...formData, business_partner: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_user">End User *</Label>
                      <Input
                        id="end_user"
                        value={formData.end_user}
                        onChange={(e) => setFormData({ ...formData, end_user: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Implementation">Implementation</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="LSC">LSC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product">Product</Label>
                      <Select
                        value={formData.product}
                        onValueChange={(value) => setFormData({ ...formData, product: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product} value={product}>
                              {product}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pic">PIC *</Label>
                      <Input
                        id="pic"
                        value={formData.pic}
                        onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nett_gp">Nett GP (Rp) *</Label>
                      <Input
                        id="nett_gp"
                        type="number"
                        value={formData.nett_gp}
                        onChange={(e) => setFormData({ ...formData, nett_gp: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quarter">Quarter *</Label>
                      <Select
                        value={formData.quarter}
                        onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keterangan">Keterangan</Label>
                    <Textarea
                      id="keterangan"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Create Project"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/projects")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="excel">
            <ExcelUpload onSuccess={() => navigate("/projects")} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

const targetSchema = z.object({
  year: z.number(),
  q1_target: z.number().nonnegative(),
  q2_target: z.number().nonnegative(),
  q3_target: z.number().nonnegative(),
  q4_target: z.number().nonnegative(),
  yearly_target: z.number().positive("Yearly target must be positive"),
});

export default function Targets() {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    q1_target: "",
    q2_target: "",
    q3_target: "",
    q4_target: "",
    yearly_target: "",
  });
  const [loading, setLoading] = useState(false);
  const [existingTarget, setExistingTarget] = useState<any>(null);

  useEffect(() => {
    fetchTarget();
  }, [formData.year]);

  const fetchTarget = async () => {
    try {
      const { data } = await supabase
        .from("targets")
        .select("*")
        .eq("year", parseInt(formData.year))
        .maybeSingle();

      if (data) {
        setExistingTarget(data);
        setFormData({
          year: data.year.toString(),
          q1_target: data.q1_target.toString(),
          q2_target: data.q2_target.toString(),
          q3_target: data.q3_target.toString(),
          q4_target: data.q4_target.toString(),
          yearly_target: data.yearly_target.toString(),
        });
      } else {
        setExistingTarget(null);
        setFormData({
          ...formData,
          q1_target: "",
          q2_target: "",
          q3_target: "",
          q4_target: "",
          yearly_target: "",
        });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = targetSchema.parse({
        year: parseInt(formData.year),
        q1_target: parseFloat(formData.q1_target) || 0,
        q2_target: parseFloat(formData.q2_target) || 0,
        q3_target: parseFloat(formData.q3_target) || 0,
        q4_target: parseFloat(formData.q4_target) || 0,
        yearly_target: parseFloat(formData.yearly_target),
      });

      if (existingTarget) {
        const { error } = await supabase
          .from("targets")
          .update({
            q1_target: validatedData.q1_target,
            q2_target: validatedData.q2_target,
            q3_target: validatedData.q3_target,
            q4_target: validatedData.q4_target,
            yearly_target: validatedData.yearly_target,
          })
          .eq("id", existingTarget.id);

        if (error) throw error;
        toast.success("Target updated successfully");
      } else {
        const { error } = await supabase.from("targets").insert([{
          year: validatedData.year,
          q1_target: validatedData.q1_target,
          q2_target: validatedData.q2_target,
          q3_target: validatedData.q3_target,
          q4_target: validatedData.q4_target,
          yearly_target: validatedData.yearly_target,
        }]);

        if (error) throw error;
        toast.success("Target created successfully");
      }

      fetchTarget();
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

  const formatCurrency = (value: string) => {
    if (!value) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Target Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Set Income Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q1_target">Q1 Target (Rp)</Label>
                <Input
                  id="q1_target"
                  type="number"
                  value={formData.q1_target}
                  onChange={(e) => setFormData({ ...formData, q1_target: e.target.value })}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.q1_target)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="q2_target">Q2 Target (Rp)</Label>
                <Input
                  id="q2_target"
                  type="number"
                  value={formData.q2_target}
                  onChange={(e) => setFormData({ ...formData, q2_target: e.target.value })}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.q2_target)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="q3_target">Q3 Target (Rp)</Label>
                <Input
                  id="q3_target"
                  type="number"
                  value={formData.q3_target}
                  onChange={(e) => setFormData({ ...formData, q3_target: e.target.value })}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.q3_target)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="q4_target">Q4 Target (Rp)</Label>
                <Input
                  id="q4_target"
                  type="number"
                  value={formData.q4_target}
                  onChange={(e) => setFormData({ ...formData, q4_target: e.target.value })}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.q4_target)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearly_target">Yearly Target (Rp) *</Label>
              <Input
                id="yearly_target"
                type="number"
                value={formData.yearly_target}
                onChange={(e) =>
                  setFormData({ ...formData, yearly_target: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                {formatCurrency(formData.yearly_target)}
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : existingTarget
                ? "Update Target"
                : "Create Target"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

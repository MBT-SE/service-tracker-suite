import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { parseExcelFile, downloadExcelTemplate, type ProjectData } from "@/utils/excel-parser";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";

interface ExcelUploadProps {
  onSuccess: () => void;
}

export default function ExcelUpload({ onSuccess }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<ProjectData[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);

    const result = await parseExcelFile(selectedFile);
    
    if (result.success && result.data) {
      setPreview(result.data);
      toast.success(`Preview: ${result.data.length} projects ready to upload`);
    } else if (result.errors) {
      setErrors(result.errors);
    }
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) {
      toast.error("Please select a valid Excel file first");
      return;
    }

    setUploading(true);
    
    try {
      const { error } = await supabase
        .from("projects")
        .insert(preview.map(project => ({
          pid: project.pid,
          business_partner: project.business_partner,
          end_user: project.end_user,
          category: project.category,
          product: project.product || null,
          pic: project.pic,
          nett_gp: project.nett_gp,
          quarter: project.quarter,
          year: project.year,
          keterangan: project.keterangan || null,
        })));

      if (error) throw error;

      toast.success(`Successfully uploaded ${preview.length} projects`);
      setFile(null);
      setPreview([]);
      setErrors([]);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload projects");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload from Excel
        </CardTitle>
        <CardDescription>
          Upload multiple projects at once using an Excel file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="excel-file">Excel File</Label>
          <Input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground">
            Upload an Excel file (.xlsx or .xls) with project data
          </p>
        </div>

        <Button
          variant="outline"
          onClick={downloadExcelTemplate}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Errors found in Excel file:</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && (
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Preview: {preview.length} projects found</div>
              <div className="text-sm space-y-1">
                {preview.slice(0, 3).map((project, index) => (
                  <div key={index}>
                    • {project.pid} - {project.business_partner} - {project.end_user}
                  </div>
                ))}
                {preview.length > 3 && (
                  <div className="text-muted-foreground">
                    ... and {preview.length - 3} more
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || preview.length === 0 || uploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : `Upload ${preview.length} Projects`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

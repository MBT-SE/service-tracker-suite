import * as XLSX from 'xlsx';
import { z } from 'zod';

const projectSchema = z.object({
  pid: z.string().min(1, "PID is required"),
  business_partner: z.string().min(2, "Business Partner is required"),
  end_user: z.string().min(2, "End User is required"),
  category: z.enum(["Implementation", "Maintenance", "LSC"], {
    errorMap: () => ({ message: "Category must be Implementation, Maintenance, or LSC" })
  }),
  product: z.string().optional(),
  pic: z.string().min(2, "PIC is required"),
  nett_gp: z.number().positive("Nett GP must be positive"),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"], {
    errorMap: () => ({ message: "Quarter must be Q1, Q2, Q3, or Q4" })
  }),
  year: z.number().int().min(2000).max(2100),
  keterangan: z.string().optional(),
});

export type ProjectData = z.infer<typeof projectSchema>;

export interface ParseResult {
  success: boolean;
  data?: ProjectData[];
  errors?: string[];
}

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const errors: string[] = [];
        const validProjects: ProjectData[] = [];

        jsonData.forEach((row: any, index: number) => {
          try {
            const project = projectSchema.parse({
              pid: row.PID || row.pid || "",
              business_partner: row['Business Partner'] || row.business_partner || "",
              end_user: row['End User'] || row.end_user || "",
              category: row.Category || row.category || "",
              product: row.Product || row.product || "",
              pic: row.PIC || row.pic || "",
              nett_gp: parseFloat(row['Nett GP'] || row.nett_gp || "0"),
              quarter: row.Quarter || row.quarter || "",
              year: parseInt(row.Year || row.year || new Date().getFullYear().toString()),
              keterangan: row.Keterangan || row.keterangan || "",
            });
            validProjects.push(project);
          } catch (error) {
            if (error instanceof z.ZodError) {
              errors.push(`Row ${index + 2}: ${error.errors.map(e => e.message).join(', ')}`);
            } else {
              errors.push(`Row ${index + 2}: Invalid data`);
            }
          }
        });

        if (errors.length > 0) {
          resolve({ success: false, errors });
        } else if (validProjects.length === 0) {
          resolve({ success: false, errors: ["No valid data found in Excel file"] });
        } else {
          resolve({ success: true, data: validProjects });
        }
      } catch (error) {
        resolve({ success: false, errors: ["Failed to parse Excel file. Please check the format."] });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, errors: ["Failed to read file"] });
    };

    reader.readAsBinaryString(file);
  });
};

export const downloadExcelTemplate = () => {
  const template = [
    {
      PID: "P250001",
      "Business Partner": "Example Corp",
      "End User": "ABC Company",
      Category: "Implementation",
      Product: "NetApp",
      PIC: "John Doe",
      "Nett GP": 50000000,
      Quarter: "Q1",
      Year: 2025,
      Keterangan: "Optional notes"
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
  XLSX.writeFile(workbook, "project_template.xlsx");
};

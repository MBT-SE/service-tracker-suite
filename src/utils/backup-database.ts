import { supabase } from "@/integrations/supabase/client";

/**
 * Backup Database Utility
 * This script exports all data from your Supabase database to JSON files
 */

interface BackupData {
  projects: any[];
  targets: any[];
  profiles: any[];
  timestamp: string;
  metadata: {
    totalRecords: number;
    tables: string[];
  };
}

export async function backupDatabase(): Promise<BackupData | null> {
  try {
    console.log("Starting database backup...");

    // Fetch all projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      throw projectsError;
    }

    // Fetch all targets
    const { data: targets, error: targetsError } = await supabase
      .from("targets")
      .select("*")
      .order("year", { ascending: true });

    if (targetsError) {
      console.error("Error fetching targets:", targetsError);
      throw targetsError;
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const backupData: BackupData = {
      projects: projects || [],
      targets: targets || [],
      profiles: profiles || [],
      timestamp: new Date().toISOString(),
      metadata: {
        totalRecords: (projects?.length || 0) + (targets?.length || 0) + (profiles?.length || 0),
        tables: ["projects", "targets", "profiles"],
      },
    };

    console.log("Backup completed successfully!");
    console.log(`Total records: ${backupData.metadata.totalRecords}`);
    console.log(`- Projects: ${projects?.length || 0}`);
    console.log(`- Targets: ${targets?.length || 0}`);
    console.log(`- Profiles: ${profiles?.length || 0}`);

    return backupData;
  } catch (error) {
    console.error("Backup failed:", error);
    return null;
  }
}

export function downloadBackup(backupData: BackupData) {
  // Create a JSON string with pretty formatting
  const jsonString = JSON.stringify(backupData, null, 2);

  // Create a Blob from the JSON string
  const blob = new Blob([jsonString], { type: "application/json" });

  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `database-backup-${new Date().toISOString().split("T")[0]}.json`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log("Backup file downloaded successfully!");
}

export async function exportToSQL(backupData: BackupData): Promise<string> {
  let sql = `-- Database Backup
-- Generated: ${backupData.timestamp}
-- Total Records: ${backupData.metadata.totalRecords}

`;

  // Export projects
  if (backupData.projects.length > 0) {
    sql += `\n-- Projects Table (${backupData.projects.length} records)\n`;
    backupData.projects.forEach((project) => {
      const values = [
        `'${project.id}'`,
        `'${project.pid}'`,
        `'${project.business_partner?.replace(/'/g, "''") || ""}'`,
        `'${project.end_user?.replace(/'/g, "''") || ""}'`,
        `'${project.category}'`,
        `'${project.product?.replace(/'/g, "''") || ""}'`,
        project.nett_gp,
        `'${project.pic}'`,
        project.pic_percentage,
        `'${project.quarter}'`,
        project.year,
        `'${project.keterangan?.replace(/'/g, "''") || ""}'`,
        project.created_by ? `'${project.created_by}'` : "NULL",
        `'${project.created_at}'`,
        `'${project.updated_at}'`,
      ];
      sql += `INSERT INTO public.projects (id, pid, business_partner, end_user, category, product, nett_gp, pic, pic_percentage, quarter, year, keterangan, created_by, created_at, updated_at) VALUES (${values.join(", ")});\n`;
    });
  }

  // Export targets
  if (backupData.targets.length > 0) {
    sql += `\n-- Targets Table (${backupData.targets.length} records)\n`;
    backupData.targets.forEach((target) => {
      const values = [
        `'${target.id}'`,
        target.year,
        target.q1_target,
        target.q2_target,
        target.q3_target,
        target.q4_target,
        target.yearly_target,
        target.created_by ? `'${target.created_by}'` : "NULL",
        `'${target.created_at}'`,
        `'${target.updated_at}'`,
      ];
      sql += `INSERT INTO public.targets (id, year, q1_target, q2_target, q3_target, q4_target, yearly_target, created_by, created_at, updated_at) VALUES (${values.join(", ")});\n`;
    });
  }

  // Export profiles
  if (backupData.profiles.length > 0) {
    sql += `\n-- Profiles Table (${backupData.profiles.length} records)\n`;
    backupData.profiles.forEach((profile) => {
      const values = [
        `'${profile.id}'`,
        `'${profile.email}'`,
        `'${profile.full_name?.replace(/'/g, "''") || ""}'`,
        `'${profile.role}'`,
        `'${profile.created_at}'`,
        `'${profile.updated_at}'`,
      ];
      sql += `INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at) VALUES (${values.join(", ")});\n`;
    });
  }

  return sql;
}

export function downloadSQL(sql: string) {
  const blob = new Blob([sql], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `database-backup-${new Date().toISOString().split("T")[0]}.sql`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log("SQL backup file downloaded successfully!");
}

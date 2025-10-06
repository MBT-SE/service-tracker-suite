import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database, FileJson, FileCode, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { backupDatabase, downloadBackup, exportToSQL, downloadSQL } from "@/utils/backup-database";

export default function BackupDatabase() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const { toast } = useToast();

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const data = await backupDatabase();
      if (data) {
        setBackupData(data);
        toast({
          title: "Backup Created",
          description: `Successfully backed up ${data.metadata.totalRecords} records`,
        });
      } else {
        toast({
          title: "Backup Failed",
          description: "Could not create backup. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Backup Error",
        description: "An error occurred during backup",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadJSON = () => {
    if (backupData) {
      downloadBackup(backupData);
      toast({
        title: "Download Started",
        description: "Your JSON backup is downloading",
      });
    }
  };

  const handleDownloadSQL = async () => {
    if (backupData) {
      const sql = await exportToSQL(backupData);
      downloadSQL(sql);
      toast({
        title: "Download Started",
        description: "Your SQL backup is downloading",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database Backup</h1>
        <p className="text-muted-foreground mt-1">
          Export your database to JSON or SQL format for local storage or migration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Create Database Backup
          </CardTitle>
          <CardDescription>
            Export all your data including projects, targets, and user profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleBackup}
            disabled={isBackingUp}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Create Backup
              </>
            )}
          </Button>

          {backupData && (
            <div className="mt-6 space-y-4 pt-6 border-t">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Backup Summary</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Created:</span>{" "}
                    {new Date(backupData.timestamp).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total Records:</span>{" "}
                    {backupData.metadata.totalRecords}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-muted-foreground">Records by table:</p>
                    <ul className="ml-4 space-y-1">
                      <li>• Projects: {backupData.projects.length}</li>
                      <li>• Targets: {backupData.targets.length}</li>
                      <li>• Profiles: {backupData.profiles.length}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleDownloadJSON} variant="outline" className="flex-1">
                  <FileJson className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
                <Button onClick={handleDownloadSQL} variant="outline" className="flex-1">
                  <FileCode className="mr-2 h-4 w-4" />
                  Download SQL
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions for On-Premises Deployment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">1. Download Backup Files</h4>
              <p className="text-muted-foreground">
                Click "Create Backup" above, then download both JSON and SQL formats.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">2. Set Up PostgreSQL Server</h4>
              <p className="text-muted-foreground">
                Install PostgreSQL on your on-premises server.
              </p>
              <code className="block bg-muted p-2 rounded mt-2 text-xs">
                sudo apt-get install postgresql postgresql-contrib
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-1">3. Import Database Schema</h4>
              <p className="text-muted-foreground">
                After connecting to GitHub, find migration files in{" "}
                <code className="bg-muted px-1 py-0.5 rounded">supabase/migrations/</code>
              </p>
              <code className="block bg-muted p-2 rounded mt-2 text-xs">
                psql -U postgres -d your_database -f migrations/*.sql
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-1">4. Import Data</h4>
              <p className="text-muted-foreground">
                Import the SQL backup file you downloaded.
              </p>
              <code className="block bg-muted p-2 rounded mt-2 text-xs">
                psql -U postgres -d your_database -f database-backup.sql
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-1">5. Update App Configuration</h4>
              <p className="text-muted-foreground">
                Update environment variables in your deployed app to point to your server.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

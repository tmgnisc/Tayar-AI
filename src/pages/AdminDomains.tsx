import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Briefcase, Plus, Edit, Trash2, Save, X, Users, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";

interface Domain {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

export default function AdminDomains() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<{ id: number; name: string } | null>(null);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (token) {
      fetchDomains();
    }
  }, [token]);

  const fetchDomains = async () => {
    try {
      const response = await apiRequest('api/admin/domains', {}, token);

      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load domains",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDomain(null);
    setFormData({ name: "", description: "", is_active: true });
    setIsDialogOpen(true);
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      description: domain.description || "",
      is_active: domain.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Domain name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDomain) {
        // Update domain
        const response = await apiRequest(`api/admin/domains/${editingDomain.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        }, token);

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Success",
            description: "Domain updated successfully",
          });
          setIsDialogOpen(false);
          fetchDomains();
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to update domain",
            variant: "destructive",
          });
        }
      } else {
        // Create domain
        const response = await apiRequest('api/admin/domains', {
          method: 'POST',
          body: JSON.stringify(formData),
        }, token);

        const data = await response.json();

        if (response.ok) {
          toast({
            title: "Success",
            description: "Domain created successfully",
          });
          setIsDialogOpen(false);
          fetchDomains();
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to create domain",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (domainId: number, domainName: string) => {
    setDomainToDelete({ id: domainId, name: domainName });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!domainToDelete) return;

    setDeleting(true);

    try {
      const response = await apiRequest(`api/admin/domains/${domainToDelete.id}`, {
        method: 'DELETE',
      }, token);

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Domain deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setDomainToDelete(null);
        fetchDomains();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete domain",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Domain Management</h1>
              <p className="text-muted-foreground">Manage technical domains for user profiles</p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>All Domains</CardTitle>
              <CardDescription>View and manage all available domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">#{domain.id}</TableCell>
                        <TableCell className="font-semibold">{domain.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {domain.description || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {domain.user_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={domain.is_active ? 'bg-green-600' : 'bg-gray-500'}>
                            {domain.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(domain.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(domain)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(domain.id, domain.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {domains.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No domains yet. Create your first domain to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDomain ? 'Edit Domain' : 'Create New Domain'}
              </DialogTitle>
              <DialogDescription>
                {editingDomain
                  ? 'Update domain information'
                  : 'Add a new technical domain for user profiles'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain-name">Domain Name *</Label>
                <Input
                  id="domain-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Frontend, Backend, MERN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain-description">Description</Label>
                <Textarea
                  id="domain-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the domain"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-border"
                />
                <Label htmlFor="is-active">Active (visible to users)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingDomain ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDomainToDelete(null);
          }
        }}>
          <AlertDialogContent className="sm:max-w-[500px]">
            <AlertDialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <AlertDialogTitle className="text-xl">Delete Domain</AlertDialogTitle>
                  <AlertDialogDescription className="mt-2 text-base">
                    This action cannot be undone. This will permanently remove the domain from your system.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="px-1 py-2">
              <div className="rounded-lg bg-muted/50 p-4 border border-border/50">
                <p className="text-sm font-medium text-foreground mb-2">
                  Domain: <span className="font-semibold text-primary">"{domainToDelete?.name}"</span>
                </p>
                {domainToDelete && domains.find(d => d.id === domainToDelete.id)?.user_count && domains.find(d => d.id === domainToDelete.id)!.user_count! > 0 ? (
                  <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> This domain is currently used by {domains.find(d => d.id === domainToDelete.id)?.user_count} user(s). 
                      It will be <strong>deactivated</strong> instead of deleted to preserve user data.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No users are currently using this domain.
                  </p>
                )}
              </div>
            </div>
            <AlertDialogFooter className="sm:justify-end gap-2">
              <AlertDialogCancel 
                onClick={() => {
                  setDomainToDelete(null);
                  setIsDeleteDialogOpen(false);
                }} 
                disabled={deleting}
                className="mt-0"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <span className="animate-spin mr-2 inline-block">⏳</span>
                    Deleting...
                  </>
                ) : (
                  "Delete Domain"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}


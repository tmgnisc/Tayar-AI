import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";

interface Domain {
  id: number;
  name: string;
  description?: string;
}

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [domainId, setDomainId] = useState<string | undefined>(undefined);
  const [level, setLevel] = useState<string | undefined>(undefined);
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    if (token && user) {
      fetchProfile();
      fetchDomains();
    }
  }, [token, user]);

  const fetchProfile = async () => {
    try {
      const response = await apiRequest('api/user/profile', {}, token);

      if (response.ok) {
        const data = await response.json();
        setName(data.user.name || "");
        setDomainId(data.user.domain_id?.toString());
        setLevel(data.user.level);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile fetch error:', errorData);
        toast({
          title: "Error",
          description: errorData.message || "Failed to load profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await apiRequest('api/user/domains', {}, token);

      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching domains:', errorData);
        toast({
          title: "Warning",
          description: "Failed to load domains. You may not be able to select a domain.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: "Warning",
        description: "Failed to load domains. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await apiRequest('api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          domain_id: domainId && domainId !== "none" ? parseInt(domainId) : null,
          level: level && level !== "none" ? level : null,
        }),
      }, token);

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Profile updated!",
          description: "Your profile has been successfully updated.",
        });
        // Update user in context
        updateUser(data.user);
        // Navigate back to dashboard after a moment
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-muted-foreground">Fetching your profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar showAuth={false} showProfile={false} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your profile information and preferences</p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your name and basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="h-12 bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Professional Information
              </CardTitle>
              <CardDescription>Select your domain and experience level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select 
                  value={domainId || "none"} 
                  onValueChange={(value) => setDomainId(value === "none" ? undefined : value)}
                >
                  <SelectTrigger id="domain" className="h-12">
                    <SelectValue placeholder="Select your domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id.toString()}>
                        {domain.name}
                        {domain.description && (
                          <span className="text-muted-foreground ml-2">- {domain.description}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the technical domain that best matches your expertise
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Experience Level</Label>
                <Select 
                  value={level || "none"} 
                  onValueChange={(value) => setLevel(value === "none" ? undefined : value)}
                >
                  <SelectTrigger id="level" className="h-12">
                    <SelectValue placeholder="Select your level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="beginner">Beginner - Entry Level</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Mid Level</SelectItem>
                    <SelectItem value="senior">Senior - Senior Level</SelectItem>
                    <SelectItem value="principal">Principal - Principal Engineer</SelectItem>
                    <SelectItem value="lead">Lead - Lead/Staff Engineer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select your current experience level in your domain
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-12 px-8"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


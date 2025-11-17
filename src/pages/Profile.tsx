import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Save, Briefcase, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (token) {
      console.log('[Profile] useEffect init', { tokenPresent: !!token });
      fetchProfile();
      fetchDomains();
    }
  }, [token]);

  useEffect(() => {
    console.log('[Profile] avatarUrl state changed', avatarUrl);
  }, [avatarUrl]);

  const fetchProfile = async () => {
    try {
      const response = await apiRequest('api/user/profile', {}, token);
      if (response.ok) {
        const data = await response.json();
        console.log('[Profile] fetchProfile data', data);
        const normalizedUser = {
          ...data.user,
          avatar_url: data.user?.avatar_url || null,
        };
        console.log('[Profile] normalized avatar_url', normalizedUser.avatar_url);
        setName(normalizedUser.name || "");
        setDomainId(normalizedUser.domain_id?.toString());
        setLevel(normalizedUser.level);
        setAvatarUrl(normalizedUser.avatar_url);
        updateUser(normalizedUser);
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        console.log('[Profile] Base64 length', base64String?.length);
        
        try {
          const response = await apiRequest('api/user/profile/upload-image', {
            method: 'POST',
            body: JSON.stringify({ image: base64String }),
          }, token);
          if (response.ok) {
            const data = await response.json();
            setAvatarUrl(data.avatar_url);
            updateUser({ avatar_url: data.avatar_url });
            toast({
              title: "Image uploaded!",
              description: "Your profile picture has been updated.",
            });
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Profile] Upload failed', errorData);
            toast({
              title: "Upload failed",
              description: errorData.message || "Failed to upload image",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setUploadingImage(false);
      toast({
        title: "Error",
        description: "Failed to read image file",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = async () => {
    try {
      const response = await apiRequest('api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          avatar_url: null,
        }),
      }, token);

      if (response.ok) {
        setAvatarUrl(null);
        updateUser({ avatar_url: null });
        toast({
          title: "Image removed",
          description: "Your profile picture has been removed.",
        });
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image",
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
          avatar_url: avatarUrl,
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
              {/* Profile Image Upload */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl || undefined} alt={name} />
                    <AvatarFallback className="text-lg">
                      {name.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="avatar-upload"
                      disabled={uploadingImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? "Uploading..." : "Upload"}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a profile picture (max 5MB, JPG/PNG)
                </p>
              </div>

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


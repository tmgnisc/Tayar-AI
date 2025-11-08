import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, DollarSign, Play, Search, Eye, Settings, Activity, Calendar, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

interface OverviewStats {
  total_users: number;
  active_users: number;
  total_interviews: number;
  recent_interviews: number;
}

interface Revenue {
  pro: number;
  enterprise: number;
  total: number;
}

interface GrowthData {
  date: string;
  count: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  subscription_type: string;
  subscription_status: string;
  created_at: string;
  interview_count: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [growth, setGrowth] = useState<GrowthData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchUsers();
    }
  }, [currentPage, token]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest('api/admin/dashboard', {}, token);

      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setRevenue(data.revenue);
        setGrowth(data.growth);
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiRequest(`api/admin/users?page=${currentPage}&limit=20&search=${searchTerm}`, {}, token);

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: overview?.total_users || 0,
      color: "from-primary to-accent",
      description: "All registered users",
    },
    {
      icon: Activity,
      label: "Active Users",
      value: overview?.active_users || 0,
      color: "from-secondary to-primary",
      description: "Last 30 days",
    },
    {
      icon: Play,
      label: "Total Interviews",
      value: overview?.total_interviews || 0,
      color: "from-accent to-secondary",
      description: "Completed interviews",
    },
    {
      icon: DollarSign,
      label: "Revenue",
      value: `$${revenue?.total.toLocaleString() || 0}`,
      color: "from-primary to-secondary",
      description: "All time revenue",
    },
  ];

  const getSubscriptionBadgeColor = (type: string) => {
    switch (type) {
      case 'free':
        return 'bg-gray-500';
      case 'pro':
        return 'bg-primary';
      case 'enterprise':
        return 'bg-purple-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600';
      case 'cancelled':
        return 'bg-orange-600';
      case 'expired':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading...</div>
          <div className="text-muted-foreground">Fetching dashboard data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <Navbar showAuth={false} showProfile={false} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard 👑</h1>
              <p className="text-muted-foreground">Monitor and manage your Tayar.ai platform</p>
            </div>
            <Link to="/admin/domains">
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Briefcase className="w-4 h-4 mr-2" />
                Manage Domains
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card border-border hover:shadow-[var(--shadow-card-hover)] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue Breakdown */}
        {revenue && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Subscription revenue by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">${revenue.pro.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Pro Plan</div>
                  </div>
                  <div className="text-center p-4 bg-purple-600/10 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">${revenue.enterprise.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Enterprise</div>
                  </div>
                  <div className="text-center p-4 bg-secondary/10 rounded-lg">
                    <div className="text-2xl font-bold text-secondary mb-1">${revenue.total.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all registered users</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Interviews</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">#{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getSubscriptionBadgeColor(user.subscription_type)}>
                            {user.subscription_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(user.subscription_status)}>
                            {user.subscription_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.interview_count}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage}</span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={users.length < 20}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth Chart */}
        {growth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>User Growth (Last 30 Days)</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Growth chart visualization would go here</p>
                    <p className="text-sm text-muted-foreground mt-2">{growth.length} data points available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}


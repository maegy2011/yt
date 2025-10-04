'use client';

/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Mail,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}

interface UserManagementProps {
  onUserUpdate?: () => void;
}

export default function UserManagement({ onUserUpdate }: UserManagementProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [message, setMessage] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'VIEWER' as 'ADMIN' | 'VIEWER',
  });

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Note: You would need to create a users list API endpoint
      // For now, we'll simulate with mock data
      const mockUsers: UserData[] = [
        {
          id: '1',
          email: 'admin@example.com',
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      // Note: You would need to create a user creation API endpoint
      setMessage('User creation functionality would be implemented here');
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      console.error('Error adding user:', error);
      setMessage('Error adding user');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Note: You would need to create a user update API endpoint
      setMessage('User update functionality would be implemented here');
      setIsEditDialogOpen(false);
      resetForm();
      fetchUsers();
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Error updating user');
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.email}"؟`)) {
      return;
    }

    try {
      // Note: You would need to create a user deletion API endpoint
      setMessage('User deletion functionality would be implemented here');
      fetchUsers();
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting user');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      role: 'VIEWER',
    });
    setSelectedUser(null);
    setMessage('');
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const UserForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      {message && (
        <Alert className={message.includes('success') ? 'border-green-200' : 'border-red-200'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="user@example.com"
          disabled={isEdit}
        />
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="role">الدور</Label>
        <Select value={formData.role} onValueChange={(value: 'ADMIN' | 'VIEWER') => setFormData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الدور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VIEWER">مشاهد</SelectItem>
            <SelectItem value="ADMIN">مدير</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            isEdit ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false);
            resetForm();
          }}
        >
          إلغاء
        </Button>
        <Button onClick={isEdit ? handleUpdateUser : handleAddUser}>
          {isEdit ? 'تحديث' : 'إضافة'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
          <p className="text-muted-foreground">إدارة مستخدمي النظام وصلاحياتهم</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            </DialogHeader>
            <UserForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="ADMIN">مدير</SelectItem>
                <SelectItem value="VIEWER">مشاهد</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>آخر تحديث</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin ml-2" />
                        جاري التحميل...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد مستخدمين</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className={`h-4 w-4 ${user.role === 'ADMIN' ? 'text-red-600' : 'text-blue-600'}`} />
                          <Badge variant={user.role === 'ADMIN' ? "destructive" : "secondary"}>
                            {user.role === 'ADMIN' ? 'مدير' : 'مشاهد'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(user.createdAt), { 
                            addSuffix: true, 
                            locale: arSA 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.updatedAt), { 
                            addSuffix: true, 
                            locale: arSA 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.role !== 'ADMIN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تحديث المستخدم</DialogTitle>
          </DialogHeader>
          <UserForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}
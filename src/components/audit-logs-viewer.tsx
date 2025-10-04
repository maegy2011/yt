'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Trash2,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: any;
  createdAt: string;
  user?: {
    id: string;
    email: string;
  };
}

export default function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const logsPerPage = 15;

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchTerm, actionFilter, targetTypeFilter, userFilter, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Note: You would need to create an audit logs API endpoint
      // For now, we'll simulate with mock data
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          userId: '1',
          action: 'ADD_VIDEO',
          targetType: 'VIDEO',
          targetId: 'dQw4w9WgXcQ',
          details: { title: 'Test Video', channelId: 'UC_test' },
          createdAt: new Date().toISOString(),
          user: { id: '1', email: 'admin@example.com' }
        },
        {
          id: '2',
          userId: '1',
          action: 'UPDATE_VIDEO',
          targetType: 'VIDEO',
          targetId: 'dQw4w9WgXcQ',
          details: { updatedFields: ['title', 'description'] },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          user: { id: '1', email: 'admin@example.com' }
        },
        {
          id: '3',
          userId: '1',
          action: 'ADD_CHANNEL',
          targetType: 'CHANNEL',
          targetId: 'UC_test',
          details: { channelTitle: 'Test Channel' },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          user: { id: '1', email: 'admin@example.com' }
        }
      ];
      setLogs(mockLogs);
      setTotalPages(Math.ceil(mockLogs.length / logsPerPage));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesTargetType = targetTypeFilter === 'all' || log.targetType === targetTypeFilter;
    const matchesUser = userFilter === 'all' || log.user?.email === userFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }

    return matchesSearch && matchesAction && matchesTargetType && matchesUser && matchesDate;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const formatAction = (action: string) => {
    const actions: { [key: string]: string } = {
      'ADD_VIDEO': 'إضافة فيديو',
      'UPDATE_VIDEO': 'تحديث فيديو',
      'DELETE_VIDEO': 'حذف فيديو',
      'ADD_CHANNEL': 'إضافة قناة',
      'UPDATE_CHANNEL': 'تحديث قناة',
      'DELETE_CHANNEL': 'حذف قناة',
      'ADD_USER': 'إضافة مستخدم',
      'UPDATE_USER': 'تحديث مستخدم',
      'DELETE_USER': 'حذف مستخدم',
      'FETCH_YOUTUBE_VIDEO': 'جلب فيديو يوتيوب',
      'LOGIN': 'تسجيل دخول',
      'LOGOUT': 'تسجيل خروج',
    };
    return actions[action] || action;
  };

  const formatTargetType = (type: string) => {
    const types: { [key: string]: string } = {
      'VIDEO': 'فيديو',
      'CHANNEL': 'قناة',
      'USER': 'مستخدم',
      'SYSTEM': 'نظام',
    };
    return types[type] || type;
  };

  const getActionIcon = (action: string) => {
    if (action.includes('ADD')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes('UPDATE')) return <Settings className="h-4 w-4 text-blue-600" />;
    if (action.includes('DELETE')) return <Trash2 className="h-4 w-4 text-red-600" />;
    if (action.includes('FETCH')) return <Download className="h-4 w-4 text-purple-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const exportLogs = () => {
    const csvContent = [
      ['التاريخ', 'المستخدم', 'الإجراء', 'نوع الهدف', 'معرف الهدف', 'التفاصيل'],
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString('ar-SA'),
        log.user?.email || 'غير معروف',
        formatAction(log.action),
        formatTargetType(log.targetType),
        log.targetId,
        JSON.stringify(log.details || {})
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const uniqueUsers = Array.from(new Set(logs.map(log => log.user?.email).filter(Boolean))) as string[];
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueTargetTypes = Array.from(new Set(logs.map(log => log.targetType)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">سجلات التدقيق</h2>
          <p className="text-muted-foreground">عرض وتصفية سجلات نشاط النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="ml-2 h-4 w-4" />
            تصدير
          </Button>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="ml-2 h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث في السجلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الإجراء" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الإجراءات</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الهدف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {uniqueTargetTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {formatTargetType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="المستخدم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستخدمين</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="التاريخ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التواريخ</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر 7 أيام</SelectItem>
                <SelectItem value="month">آخر 30 يوم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
                <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{uniqueUsers.length}</div>
                <div className="text-sm text-muted-foreground">مستخدمين نشطين</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{uniqueActions.length}</div>
                <div className="text-sm text-muted-foreground">نوع الإجراء</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {filteredLogs.length > 0 
                    ? formatDistanceToNow(new Date(filteredLogs[0].createdAt), { 
                        addSuffix: false, 
                        locale: arSA 
                      })
                    : '0'
                  }
                </div>
                <div className="text-sm text-muted-foreground">آخر نشاط</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوقت</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>الهدف</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin ml-2" />
                        جاري التحميل...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">لا توجد سجلات تطابق معايير البحث</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.createdAt).toLocaleString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{log.user?.email || 'غير معروف'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge variant="outline">
                            {formatAction(log.action)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatTargetType(log.targetType)}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({log.targetId})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLogDetail(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            السابق
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>
      )}

      {/* Log Detail Dialog */}
      {selectedLog && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${isDetailDialogOpen ? '' : 'hidden'}`}>
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">تفاصيل السجل</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsDetailDialogOpen(false)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">المعرف</label>
                    <div className="text-sm font-mono">{selectedLog.id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">التاريخ</label>
                    <div className="text-sm">{new Date(selectedLog.createdAt).toLocaleString('ar-SA')}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">المستخدم</label>
                    <div className="text-sm">{selectedLog.user?.email || 'غير معروف'}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الإجراء</label>
                    <div className="text-sm">{formatAction(selectedLog.action)}</div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نوع الهدف</label>
                  <div className="text-sm">{formatTargetType(selectedLog.targetType)}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">معرف الهدف</label>
                  <div className="text-sm font-mono">{selectedLog.targetId}</div>
                </div>
                
                {selectedLog.details && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">التفاصيل</label>
                    <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
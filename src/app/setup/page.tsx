'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SetupStatus {
  databaseConnected: boolean;
  tablesCreated: boolean;
  adminExists: boolean;
}

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SetupStatus>({
    databaseConnected: false,
    tablesCreated: false,
    adminExists: false,
  });
  const [loading, setLoading] = useState(true);
  const [settingUp, setUpSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminData, setAdminData] = useState({
    email: 'admin@example.com',
    password: 'admin123',
    confirmPassword: 'admin123',
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/status');
      const data = await response.json();
      
      if (data.adminExists) {
        router.push('/login');
        return;
      }
      
      setStatus(data);
    } catch (err) {
      setError('فشل في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const setupDatabase = async () => {
    setUpSetting(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/database', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إعداد قاعدة البيانات');
      }

      setStatus(data.status);
      
      if (data.status.adminExists) {
        router.push('/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setUpSetting(false);
    }
  };

  const createAdmin = async () => {
    if (adminData.password !== adminData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setUpSetting(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminData.email,
          password: adminData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء حساب المسؤول');
      }

      setStatus(prev => ({ ...prev, adminExists: true }));
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setUpSetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            إعداد النظام
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            مرحباً بك في نظام YT Islami. يرجى إعداد النظام للمتابعة.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>حالة الإعداد</CardTitle>
            <CardDescription>
              تحقق من حالة نظامك وقم بإعداده خطوة بخطوة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              {status.databaseConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span>اتصال قاعدة البيانات</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {status.tablesCreated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span>جداول قاعدة البيانات</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {status.adminExists ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span>حساب المسؤول</span>
            </div>
          </CardContent>
        </Card>

        {!status.tablesCreated && (
          <Card>
            <CardHeader>
              <CardTitle>إعداد قاعدة البيانات</CardTitle>
              <CardDescription>
                قم بإنشاء جداول قاعدة البيانات اللازمة لتشغيل النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={setupDatabase} 
                disabled={settingUp}
                className="w-full"
              >
                {settingUp && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إنشاء جداول قاعدة البيانات
              </Button>
            </CardContent>
          </Card>
        )}

        {status.tablesCreated && !status.adminExists && (
          <Card>
            <CardHeader>
              <CardTitle>إنشاء حساب المسؤول</CardTitle>
              <CardDescription>
                قم بإنشاء حساب المسؤول الأول للنظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={settingUp}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={settingUp}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={settingUp}
                />
              </div>
              
              <Button 
                onClick={createAdmin} 
                disabled={settingUp}
                className="w-full"
              >
                {settingUp && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                إنشاء حساب المسؤول
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
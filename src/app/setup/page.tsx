'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SetupPage() {
  const [status, setStatus] = useState<'loading' | 'checking' | 'needs_setup' | 'ready' | 'error'>('checking');
  const [result, setResult] = useState<any>(null);
  const [settingUp, setSettingUp] = useState(false);

  const checkDatabase = async () => {
    try {
      setStatus('checking');
      const response = await fetch('/api/setup-database');
      const data = await response.json();
      setResult(data);

      if (data.success) {
        setStatus('ready');
      } else if (data.message === 'Database needs setup') {
        setStatus('needs_setup');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: 'Failed to check database status' });
    }
  };

  const setupDatabase = async () => {
    try {
      setSettingUp(true);
      const response = await fetch('/api/setup-database', {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);

      if (data.success) {
        setStatus('ready');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: 'Failed to setup database' });
    } finally {
      setSettingUp(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
      case 'checking':
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case 'ready':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'needs_setup':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Database className="h-6 w-6" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'جاري التحميل...';
      case 'checking':
        return 'جاري فحص قاعدة البيانات...';
      case 'ready':
        return 'قاعدة البيانات جاهزة';
      case 'needs_setup':
        return 'قاعدة البيانات تحتاج للإعداد';
      case 'error':
        return 'خطأ في قاعدة البيانات';
      default:
        return 'غير معروف';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return 'bg-green-50 border-green-200';
      case 'needs_setup':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Database className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-3xl font-bold mb-2">إعداد قاعدة البيانات</h1>
          <p className="text-muted-foreground">
            هذه الصفحة تقوم بإعداد جدول القنوات في قاعدة البيانات الخاصة بك
          </p>
        </div>

        {/* Status Card */}
        <Card className={`mb-6 ${getStatusColor()}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusText()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">الاتصال:</span>
                    <Badge variant={result.details?.connection === 'OK' ? 'default' : 'destructive'} className="ml-2">
                      {result.details?.connection || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">الجدول:</span>
                    <Badge variant={result.details?.table === 'Exists' || result.details?.table === 'Created' ? 'default' : 'secondary'} className="ml-2">
                      {result.details?.table || 'N/A'}
                    </Badge>
                  </div>
                </div>
                
                {result.message && (
                  <p className="text-sm text-muted-foreground">
                    {result.message}
                  </p>
                )}
                
                {result.error && (
                  <div className="p-3 bg-red-100 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <strong>خطأ:</strong> {result.error}
                    </p>
                    {result.details && (
                      <p className="text-xs text-red-600 mt-1">
                        {result.details}
                      </p>
                    )}
                  </div>
                )}
                
                {result.suggestion && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>اقتراح:</strong> {result.suggestion}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={checkDatabase}
            disabled={status === 'loading' || status === 'checking'}
            variant="outline"
          >
            إعادة الفحص
          </Button>
          
          {status === 'needs_setup' && (
            <Button
              onClick={setupDatabase}
              disabled={settingUp}
            >
              {settingUp ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإعداد...
                </>
              ) : (
                'إعداد قاعدة البيانات'
              )}
            </Button>
          )}
        </div>

        {/* Next Steps */}
        {status === 'ready' && (
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">الخطوات التالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-green-700">
                  ✅ تم إعداد قاعدة البيانات بنجاح! الآن يمكنك:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-green-700 text-sm">
                  <li>الذهاب إلى <a href="/admin" className="underline">لوحة التحكم</a></li>
                  <li>إضافة قنوات YouTube الإسلامية</li>
                  <li>اختبار وظائف التطبيق</li>
                </ol>
                <div className="pt-2">
                  <Button asChild>
                    <a href="/admin">
                      الذهاب إلى لوحة التحكم
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>تفاصيل الفحص</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Play, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestDatabasePage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTest = async (name: string, testFunction: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setResults(prev => [...prev, { name, result, timestamp: new Date().toISOString() }]);
    } catch (error) {
      setResults(prev => [...prev, { 
        name, 
        result: { error: error instanceof Error ? error.message : 'Unknown error' }, 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    const response = await fetch('/api/setup-database');
    return response.json();
  };

  const testDatabaseSetup = async () => {
    const response = await fetch('/api/setup-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reset: false }),
    });
    return response.json();
  };

  const testDatabaseReset = async () => {
    const response = await fetch('/api/setup-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reset: true }),
    });
    return response.json();
  };

  const testAddChannel = async () => {
    const response = await fetch('/api/channels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'UCtest_channel_' + Date.now(),
        name: 'قناة اختبار',
        description: 'قناة اختبار لفحص قاعدة البيانات',
        category: 'اختبار'
      }),
    });
    return response.json();
  };

  const testForceReset = async () => {
    const response = await fetch('/api/force-reset-database', {
      method: 'POST',
    });
    return response.json();
  };

  const testGetChannels = async () => {
    const response = await fetch('/api/channels');
    return response.json();
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusIcon = (result: any) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (result: any) => {
    if (result.success) {
      return <Badge variant="default">نجاح</Badge>;
    }
    return <Badge variant="destructive">فشل</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Database className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-3xl font-bold mb-2">اختبار قاعدة البيانات</h1>
          <p className="text-muted-foreground">
            صفحة اختبار شاملة لوظائف قاعدة البيانات
          </p>
        </div>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اختبارات قاعدة البيانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => runTest('فحص الاتصال', testDatabaseConnection)}
                disabled={loading}
                variant="outline"
              >
                <Play className="h-4 w-4 ml-2" />
                فحص الاتصال
              </Button>
              
              <Button
                onClick={() => runTest('إعداد قاعدة البيانات', testDatabaseSetup)}
                disabled={loading}
              >
                <Play className="h-4 w-4 ml-2" />
                إعداد قاعدة البيانات
              </Button>
              
              <Button
                onClick={() => runTest('إعادة تعيين قاعدة البيانات', testDatabaseReset)}
                disabled={loading}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                إعادة تعيين قاعدة البيانات
              </Button>
              
              <Button
                onClick={() => runTest('إعادة تعيين قسري', testForceReset)}
                disabled={loading}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                إعادة تعيين قسري
              </Button>
              
              <Button
                onClick={() => runTest('إضافة قناة اختبار', testAddChannel)}
                disabled={loading}
                variant="secondary"
              >
                <Play className="h-4 w-4 ml-2" />
                إضافة قناة اختبار
              </Button>
              
              <Button
                onClick={() => runTest('جلب القنوات', testGetChannels)}
                disabled={loading}
                variant="outline"
              >
                <Play className="h-4 w-4 ml-2" />
                جلب القنوات
              </Button>
              
              <Button
                onClick={clearResults}
                disabled={loading}
                variant="outline"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                مسح النتائج
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>نتائج الاختبارات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((test, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.result)}
                        <span className="font-medium">{test.name}</span>
                        {getStatusBadge(test.result)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(test.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(test.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>كيفية الاستخدام</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. ابدأ بفحص الاتصال بقاعدة البيانات</p>
              <p>2. إذا كانت قاعدة البيانات تحتاج للإعداد، اضغط على "إعداد قاعدة البيانات"</p>
              <p>3. إذا واجهت مشاكل مستمرة، استخدم "إعادة تعيين قاعدة البيانات"</p>
              <p>4. إذا لم تنجح الطرق السابقة، استخدم "إعادة تعيين قسري" (يحذف كل شيء ويعيد الإنشاء)</p>
              <p>5. اختبر إضافة قناة وجلب القنوات للتأكد من أن كل شيء يعمل</p>
              <p>6. يمكنك مسح النتائج وبدء الاختبارات من جديد في أي وقت</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
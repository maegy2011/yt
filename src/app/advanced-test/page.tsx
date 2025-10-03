'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Play, Trash2, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function AdvancedTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelInput, setChannelInput] = useState({
    id: 'UCtest_' + Date.now(),
    name: 'قناة اختبار متقدمة',
    description: 'قناة اختبار للتشخيص المتقدم',
    category: 'اختبار'
  });

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

  const testFullDebug = async () => {
    const response = await fetch('/api/debug-database');
    return response.json();
  };

  const testRawSqlInsert = async () => {
    try {
      const testId = 'UCraw_test_' + Date.now();
      const response = await fetch('/api/test-raw-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'insert',
          data: {
            id: testId,
            name: 'Raw SQL Test',
            description: 'Testing raw SQL operations',
            category: 'test'
          }
        }),
      });
      const result = await response.json();
      
      // Clean up
      await fetch('/api/test-raw-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'delete',
          id: testId
        }),
      });
      
      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const testPrismaInsert = async () => {
    try {
      const testId = 'UCprisma_test_' + Date.now();
      const response = await fetch('/api/test-prisma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'insert',
          data: {
            id: testId,
            name: 'Prisma Test',
            description: 'Testing Prisma operations',
            category: 'test'
          }
        }),
      });
      const result = await response.json();
      
      // Clean up
      await fetch('/api/test-prisma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'delete',
          id: testId
        }),
      });
      
      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const testChannelApi = async () => {
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(channelInput),
      });
      return response.json();
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const testGetChannels = async () => {
    try {
      const response = await fetch('/api/channels');
      return response.json();
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const testForceReset = async () => {
    const response = await fetch('/api/force-reset-database', {
      method: 'POST',
    });
    return response.json();
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusIcon = (result: any) => {
    if (result.success || !result.error) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (result: any) => {
    if (result.success || !result.error) {
      return <Badge variant="default">نجاح</Badge>;
    }
    return <Badge variant="destructive">فشل</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Database className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-3xl font-bold mb-2">التشخيص المتقدم لقاعدة البيانات</h1>
          <p className="text-muted-foreground">
            أدوات تشخيص متقدمة لحل مشاكل إضافة القنوات
          </p>
        </div>

        {/* Channel Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>بيانات قناة الاختبار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">معرف القناة</label>
                <input
                  type="text"
                  value={channelInput.id}
                  onChange={(e) => setChannelInput(prev => ({ ...prev, id: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="UC..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">اسم القناة</label>
                <input
                  type="text"
                  value={channelInput.name}
                  onChange={(e) => setChannelInput(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="اسم القناة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <input
                  type="text"
                  value={channelInput.description}
                  onChange={(e) => setChannelInput(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="وصف القناة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">التصنيف</label>
                <input
                  type="text"
                  value={channelInput.category}
                  onChange={(e) => setChannelInput(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded"
                  placeholder="التصنيف"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اختبارات متقدمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => runTest('تشخيص شامل', testFullDebug)}
                disabled={loading}
                variant="outline"
              >
                <Play className="h-4 w-4 ml-2" />
                تشخيص شامل
              </Button>
              
              <Button
                onClick={() => runTest('اختبار Raw SQL', testRawSqlInsert)}
                disabled={loading}
                variant="secondary"
              >
                <Play className="h-4 w-4 ml-2" />
                اختبار Raw SQL
              </Button>
              
              <Button
                onClick={() => runTest('اختبار Prisma', testPrismaInsert)}
                disabled={loading}
                variant="secondary"
              >
                <Play className="h-4 w-4 ml-2" />
                اختبار Prisma
              </Button>
              
              <Button
                onClick={() => runTest('إضافة قناة عبر API', testChannelApi)}
                disabled={loading}
              >
                <Play className="h-4 w-4 ml-2" />
                إضافة قناة عبر API
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
                onClick={() => runTest('إعادة تعيين قسري', testForceReset)}
                disabled={loading}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                إعادة تعيين قسري
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
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
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
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              خطوات الحل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-medium text-blue-800">الخطوة 1: التشخيص الشامل</p>
                <p className="text-blue-700">اضغط على "تشخيص شامل" للحصول على تقرير مفصل عن حالة قاعدة البيانات</p>
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-medium text-yellow-800">الخطوة 2: اختبار العمليات</p>
                <p className="text-yellow-700">جرب اختباري Raw SQL و Prisma لمعرفة أيهما يعمل</p>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="font-medium text-green-800">الخطوة 3: اختبار API</p>
                <p className="text-green-700">حاول إضافة قناة عبر API الرئيسي</p>
              </div>
              
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="font-medium text-red-800">الخطوة 4: الحل النهائي</p>
                <p className="text-red-700">إذا فشلت كل المحاولات، استخدم "إعادة تعيين قسري"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
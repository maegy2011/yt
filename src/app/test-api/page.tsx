'use client';

import { useState } from 'react';

export default function TestAPIPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testHealth = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/health');
      const data = await response.json();
      setResults({ type: 'Health Check', status: response.status, data });
    } catch (err) {
      setError('Health check failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const testGetChannels = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/channels');
      const data = await response.json();
      setResults({ type: 'Get Channels', status: response.status, data });
    } catch (err) {
      setError('Get channels failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const testAddChannel = async () => {
    try {
      setLoading(true);
      setError('');
      const testData = {
        id: 'UCtest123456789',
        name: 'قناة اختبار',
        description: 'قناة اختبار للتأكد من أن الإضافة تعمل',
        category: 'اختبار'
      };
      
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const data = await response.json();
      setResults({ type: 'Add Channel', status: response.status, data, sent: testData });
    } catch (err) {
      setError('Add channel failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const testAddDuplicate = async () => {
    try {
      setLoading(true);
      setError('');
      const testData = {
        id: 'UCtest123456789', // Same as above to test duplicate
        name: 'قناة مكررة',
        description: 'قناة مكررة لاختبار الخطأ',
        category: 'اختبار'
      };
      
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const data = await response.json();
      setResults({ type: 'Add Duplicate Channel', status: response.status, data, sent: testData });
    } catch (err) {
      setError('Add duplicate channel failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const testInvalidChannel = async () => {
    try {
      setLoading(true);
      setError('');
      const testData = {
        id: 'invalid_id', // Doesn't start with UC
        name: 'قناة غير صالحة',
        description: 'قناة بمعرف غير صالح',
        category: 'اختبار'
      };
      
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const data = await response.json();
      setResults({ type: 'Add Invalid Channel', status: response.status, data, sent: testData });
    } catch (err) {
      setError('Add invalid channel failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">صفحة اختبار API</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={testHealth}
            disabled={loading}
            className="p-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            اختبار الصحة
          </button>
          
          <button
            onClick={testGetChannels}
            disabled={loading}
            className="p-4 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            عرض القنوات
          </button>
          
          <button
            onClick={testAddChannel}
            disabled={loading}
            className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            إضافة قناة اختبار
          </button>
          
          <button
            onClick={testAddDuplicate}
            disabled={loading}
            className="p-4 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            إضافة قناة مكررة
          </button>
          
          <button
            onClick={testInvalidChannel}
            disabled={loading}
            className="p-4 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            إضافة قناة غير صالحة
          </button>
        </div>

        {loading && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded">
            جاري الاختبار...
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
            <strong>خطأ:</strong> {error}
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">نتائج الاختبار</h2>
            
            <div className="p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">{results.type}</h3>
              <p><strong>الحالة:</strong> {results.status}</p>
              
              {results.sent && (
                <div className="mt-2">
                  <strong>البيانات المرسلة:</strong>
                  <pre className="bg-white p-2 rounded text-sm mt-1 overflow-auto">
                    {JSON.stringify(results.sent, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="mt-2">
                <strong>البيانات المستلمة:</strong>
                <pre className="bg-white p-2 rounded text-sm mt-1 overflow-auto">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-bold mb-2">كيفية الاستخدام:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>اضغط على "اختبار الصحة" للتحقق من حالة النظام</li>
            <li>اضغط على "عرض القنوات" لرؤية القنوات الحالية</li>
            <li>اضغط على "إضافة قناة اختبار" لإضافة قناة جديدة</li>
            <li>جرب الاختبارات الأخرى لفحص معالجة الأخطاء</li>
            <li>شاهد النتائج في الأسفل لفهم المشاكل</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
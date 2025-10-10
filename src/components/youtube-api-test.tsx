"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink } from "lucide-react";

interface YouTubeTestResult {
  success?: boolean;
  error?: string;
  message?: string;
  details?: any;
  suggestion?: string;
}

export function YouTubeAPITest() {
  const [result, setResult] = useState<YouTubeTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/youtube-test');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: "Network Error",
        message: "Failed to connect to test API",
        suggestion: "Please check your internet connection"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          YouTube API Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          This tool tests your YouTube API configuration and helps diagnose common issues.
        </div>
        
        <Button 
          onClick={testAPI} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Test YouTube API
            </>
          )}
        </Button>

        <Button 
          onClick={() => {
            // Test with a known channel (Google Developers)
            window.open('https://www.youtube.com/@googledevelopers', '_blank');
          }}
          variant="outline"
          className="w-full"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Test Channel
        </Button>

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <Badge className="bg-green-100 text-green-800">Success</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <Badge className="bg-red-100 text-red-800">Error</Badge>
                </>
              )}
            </div>

            {result.message && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{result.message}</p>
              </div>
            )}

            {result.error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">{result.error}</p>
              </div>
            )}

            {result.suggestion && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Suggestion:</strong> {result.suggestion}
                </p>
              </div>
            )}

            {result.details && (
              <details className="p-3 bg-gray-50 rounded-lg">
                <summary className="text-sm font-medium cursor-pointer">Technical Details</summary>
                <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}

            <div className="text-xs text-gray-500">
              <strong>خطوات الإصلاح السريع:</strong>
              <ul className="mt-1 space-y-1">
                <li>• تأكد من تفعيل YouTube Data API v3 في Google Cloud Console</li>
                <li>• تحقق من صحة مفتاح API</li>
                <li>• تأكد من عدم تجاوز الحصة اليومية (10000 طلب)</li>
                <li>• جرب استخدام قناة اختبار: UC_x5XG1OV2P6uZZ5FSM9Ttw</li>
                <li>• تأكد من عدم وجود قيود على مفتاح API</li>
              </ul>
              <div className="mt-2 p-2 bg-yellow-50 rounded text-yellow-800">
                <strong>ملاحظة هامة:</strong> إذا كان المفتاح يعمل محلياً ولكن لا يعمل على Vercel، 
                تحقق من إعدادات "Application restrictions" في Google Cloud Console.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
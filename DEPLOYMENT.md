# دليل نشر مشروع مشغل يوتيوب وموسوعة الأحاديث على Vercel

## المتطلبات الأساسية

1. حساب على [Vercel](https://vercel.com)
2. مستودع GitHub للمشروع
3. مفتاح YouTube API من [Google Cloud Console](https://console.cloud.google.com/)

## خطوات النشر

### الطريقة الأولى: عبر Vercel CLI

#### 1. تثبيت Vercel CLI
```bash
npm install -g vercel
```

#### 2. تسجيل الدخول إلى Vercel
```bash
vercel login
```

#### 3. نشر المشروع
```bash
# من جذر المشروع
vercel --prod
```

### الطريقة الثانية: عبر GitHub Integration

#### 1. ربط المستودع مع Vercel
1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. انقر على "New Project"
3. اختر مستودع GitHub الخاص بالمشروع
4. انقر على "Import"

#### 2. إعدادات النشر
Vercel سيكتشف تلقائياً أن هذا مشروع Next.js ويستخدم الإعدادات من `vercel.json`.

### الطريقة الثالثة: عبر واجهة Vercel الإلكترونية

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. انقر على "New Project"
3. اسحب وأفلت مجلد المشروع
4. انتظر حتى يكتمل التحليل التلقائي

## إعدادات متغيرات البيئة

### في لوحة تحكم Vercel

1. اذهب إلى إعدادات المشروع
2. انقر على "Environment Variables"
3. أضف المتغيرات التالية:

```env
# YouTube API (مطلوب)
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here

# قاعدة البيانات (اختياري - سيتم إنشاؤها تلقائياً)
DATABASE_URL=file:./custom.db

# الأمان (اختياري)
NEXTAUTH_SECRET=your_secure_secret_here
NEXTAUTH_URL=https://your-app.vercel.app

# AI SDK (اختياري)
Z_AI_API_KEY=your_z_ai_api_key_here
```

### الحصول على YouTube API Key

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. فعّل "YouTube Data API v3"
4. اذهب إلى "Credentials"
5. أنشئ "API Key"
6. انسخ المفتاح وأضفه إلى متغيرات البيئة

## التحقق من النشر

### بعد النشر

1. تحقق من أن التطبيق يعمل بشكل صحيح
2. اختبر وظائف YouTube API
3. تأكد من أن قاعدة البيانات تعمل
4. اختبر واجهة المستخدم باللغة العربية

### حل المشاكل الشائعة

#### خطأ: `functions` property cannot be used with `builds`
- تم حل هذا الخطأ في الإصدار الحالي من `vercel.json`
- تأكد من استخدام أحدث إصدار من الملف

#### خطأ: `The pattern "api/**/*.{js,ts}" defined in functions doesn't match any Serverless Functions`
- تم تحديث النمط ليتناسب مع هيكل Next.js App Router
- النمط الصحيح: `src/app/api/**/route.ts` للـ API routes
- النمط الصحيح: `src/app/**/page.tsx` للـ pages

#### خطأ: YouTube API quota exceeded
- تحقق من استخدام API في [Google Cloud Console](https://console.cloud.google.com/)
- يمكنك طلب زيادة الحصة أو استخدام مفتاح API جديد

#### خطأ: Database connection failed
- تأكد من أن `DATABASE_URL` صحيح
- في Vercel، يمكنك استخدام Vercel Postgres بدلاً من SQLite

#### مشاكل في الاتجاه من اليمين إلى اليسار (RTL)
- تأكد من أن المتصفح يدعم العربية
- تحقق من إعدادات CSS في `globals.css`

## تحديثات النشر

### النشر التلقائي
عند ربط المشروع مع GitHub، أي دفع إلى الفرع الرئيسي سيؤدي إلى نشر تلقائي.

### النشر اليدوي
```bash
vercel --prod
```

### التراجع عن النشر
1. اذهب إلى Vercel Dashboard
2. اختر المشروع
3. انقر على "Deployments"
4. اختر النشر السابق وانقر على "Promote to Production"

## مراقبة الأداء

### Vercel Analytics
- مفعّلة تلقائياً للمشاريع المجانية
- تقدم رؤى حول أداء التطبيق

### تحسينات الأداء
- تم تضمين تحسينات الأداء في `next.config.ts`
- يتم ضغط الصور تلقائياً
- التخزين المؤقت محسّن

## الأمان

### رؤوس الأمان
- تم تكوين رؤوس الأمان في `vercel.json`
- تشمل:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Permissions-Policy محددة

### حماية CORS
- تم تكوين CORS لـ API routes
- يسمح بالوصول من جميع المصادر (يمكن تقييده في الإنتاج)

## الدعم

### إذا واجهت أي مشاكل
1. تحقق من سجلات Vercel
2. راجع وثائق Next.js و Vercel
3. تأكد من أن جميع متغيرات البيئة صحيحة
4. اختبر المشروع محلياً أولاً

### موارد مفيدة
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [YouTube API Documentation](https://developers.google.com/youtube/v3)

---

## ملاحظات النشر النهائية

المشروع جاهز تماماً للنشر على Vercel مع:
- ✅ إعدادات الأمان المثلى
- ✅ تحسينات الأداء
- ✅ دعم عربي كامل
- ✅ واجهات برمجية جاهزة
- ✅ قاعدة بيانات متكاملة

بعد النشر، تأكد من:
1. تحديث `NEXT_PUBLIC_APP_URL` برابط التطبيق الفعلي
2. اختبار جميع الوظائف الأساسية
3. مراقبة استخدام YouTube API
4. إعداد النسخ الاحتياطي لقاعدة البيانات إذا لزم الأمر
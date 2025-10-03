# 🗄️ دليل إعداد قاعدة البيانات مع Vercel

## 📋 نظرة عامة

### المشكلة الحالية
تطبيقك يستخدم **SQLite** حاليًا، ولكن Vercel لا يدعم SQLite لأنه يعتمد على نظام الملفات.

### الحل المطلوب
التحويل إلى **PostgreSQL** التي تدعمها Vercel وتعمل بشكل ممتاز في البيئة Serverless.

---

## 🎯 الخيارات المتاحة

### الخيار 1: Vercel Postgres (موصى به للأفضلية والسهولة)

#### المميزات
- ✅ تكامل تام مع Vercel
- ✅ إدارة تلقائية
- ✅ نسخ احتياطي تلقائي
- ✅ قناة مجانية للبدء
- ✅ أداء ممتاز

#### الخطوات التفصيلية

**الخطوة 1: إنشاء قاعدة البيانات**
1. سجل الدخول إلى [Vercel](https://vercel.com)
2. اختر مشروعك
3. من القائمة العلوية، اضغط على **"Storage"**
4. اضغط على **"Create Database"**
5. اختر **"Postgres"**
6. اختر المنطقة (Region) الأقرب لجمهورك:
   - `iad` (الولايات المتحدة - شرق)
   - `sfo` (الولايات المتحدة - غرب)
   - `fra` (أوروبا - فرانكفورت)
   - `hnd` (آسيا - طوكيو)
7. اضغط **"Create"**
8. انتظر حتى تكتمل عملية الإنشاء (1-2 دقيقة)

**الخطوة 2: الحصول على معلومات الاتصال**
بعد الإنشاء، Vercel سيظهر لك:
```
🔗 Connection String:
postgresql://vercel-user:your-password@your-project-db.vercel-storage.com:5432/vercel-db?sslmode=require

📋 Environment Variables:
POSTGRES_HOST=your-project-db.vercel-storage.com
POSTGRES_USER=vercel-user
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=vercel-db
POSTGRES_URL_NON_POOLING=postgresql://vercel-user:your-password@your-project-db.vercel-storage.com:5432/vercel-db?sslmode=require
POSTGRES_PRISMA_URL=postgresql://vercel-user:your-password@your-project-db.vercel-storage.com:5432/vercel-db?pgbouncer=true&connect_timeout=15&sslmode=require
POSTGRES_URL=postgresql://vercel-user:your-password@your-project-db.vercel-storage.com:5432/vercel-db?sslmode=require&pgbouncer=true
```

**الخطوة 3: تكوين متغيرات البيئة**
1. اذهب إلى **"Settings"** → **"Environment Variables"**
2. أضف المتغير التالي:
   ```
   Key: DATABASE_URL
   Value: postgresql://vercel-user:your-password@your-project-db.vercel-storage.com:5432/vercel-db?sslmode=require
   ```
3. اضغط **"Save"**

**الخطوة 4: تحديث Prisma Schema**
استبدل محتوى `prisma/schema.prisma` بـ:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**الخطوة 5: إعادة النشر**
1. Vercel سيقوم بإعادة النشر تلقائيًا
2. انتظر حتى اكتمال النشر (2-3 دقائق)

---

### الخيار 2: Supabase (بديل مجاني ممتاز)

#### المميزات
- ✅ خطة مجانية سخية
- ✅ واجهة إدارة سهلة
- ✅ تكامل جيد مع Prisma
- ✅ أداء جيد

#### الخطوات التفصيلية

**الخطوة 1: إنشاء حساب ومشروع**
1. اذهب إلى [Supabase](https://supabase.com)
2. سجل حسابًا جديدًا
3. اضغط على **"New Project"**
4. املأ معلومات المشروع:
   - **Project Name**: اسم مشروعك (مثلاً: islamic-youtube)
   - **Database Password**: كلمة مرور قوية
   - **Region**: اختر المنطقة الأقرب لجمهورك
5. اضغط **"Create new project"**
6. انتظر حتى اكتمال الإنشاء (2-3 دقائق)

**الخطوة 2: الحصول على معلومات الاتصال**
1. في لوحة التحكم، اذهب إلى **"Settings"** → **"Database"**
2. ابحث عن **"Connection string"**
3. ستجد شيئًا مثل:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
   ```

**الخطوة 3: تكوين Vercel**
1. في Vercel، اذهب إلى **"Settings"** → **"Environment Variables"**
2. أضف المتغير:
   ```
   Key: DATABASE_URL
   Value: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres?sslmode=require
   ```
3. اضغط **"Save"**

---

### الخيار 3: Neon (بديل حديث وسريع)

#### المميزات
- ✅ خطة مجانية سخية
- ✅ سرعة عالية
- ✩ تكامل سهل مع Vercel
- ✩ واجهة حديثة

#### الخطوات
1. اذهب إلى [Neon](https://neon.tech)
2. أنشئ حسابًا ومشروعًا جديدًا
3. احصل على Connection String
4. أضفه إلى متغيرات البيئة في Vercel

---

## 🔧 تحديث ملفات المشروع

### 1. تحديث Prisma Schema
استبدل محتوى `prisma/schema.prisma` بـ:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Channel {
  id            String   @id
  name          String
  description   String?
  thumbnailUrl  String?
  category      String?
  addedAt       DateTime @default(now()) @map("added_at")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("channels")
}
```

### 2. تحديث متغيرات البيئة المحلية (للتطوير)
أنشئ ملف `.env.local`:
```bash
# للتطوير المحلي (اختياري)
DATABASE_URL="postgresql://user:password@localhost:5432/islamic_youtube?sslmode=require"

# للإنتاج (من Vercel)
# DATABASE_URL="postgresql://vercel-user:password@host:port/db?sslmode=require"
YOUTUBE_API_KEY="your_youtube_api_key_here"
```

---

## 🧪 الاختبار والتحقق

### 1. اختبار الاتصال بقاعدة البيانات
بعد النشر، اختبر الاتصال:
```
https://your-app.vercel.app/api/health
```

يجب أن تعيد:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "provider": "postgresql"
  },
  "youtube": {
    "apiKey": "configured",
    "isDemo": false
  }
}
```

### 2. اختبار إضافة قناة
1. اذهب إلى `/admin`
2. سجل الدخول بكلمة المرور: `admin123`
3. اضغط على **"إضافة قناة"**
4. أدخل بيانات اختبار:
   - **معرف القناة**: `UCXbP_pDv9wEeT9tOEGiZU2g`
   - **اسم القناة**: `قناة تجريبية`
   - **التصنيف**: `تجريبي`
5. اضغط **"إضافة القناة"**
6. يجب أن تظهر رسالة نجاح

---

## 🚨 استكشاف الأخطاء وإصلاحها

### مشكلة: الاتصال بقاعدة البيانات فشل
**الحل**: تأكد من:
- صحة CONNECTION STRING
- إضافة `?sslmode=require` في النهاية
- أن قاعدة البيانات نشطة

### مشكلة: Prisma generate فشل
**الحل**: 
1. تأكد من أن `DATABASE_URL` صحيح
2. شغل `npx prisma generate` محليًا للاختبار

### مشكلة: النشر فشل
**الحل**: تحقق من:
- متغيرات البيئة صحيحة
- لا توجد أخطاء في الكود
- سجل النشر في Vercel

---

## 📊 مقارنة الخيارات

| الميزة | Vercel Postgres | Supabase | Neon |
|--------|----------------|----------|------|
| السهولة | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| التكلفة | مجاني للبدء | مجاني سخي | مجاني سخي |
| الأداء | ممتاز | جيد جدًا | ممتاز |
| التكامل | تام مع Vercel | جيد | جيد جدًا |
| الدعم | رسمي | مجتمعي | مجتمعي |

---

## 🎯 التوصية النهائية

**للمبتدئين**: استخدم **Vercel Postgres** - الأسهل والأكثر تكاملاً

**للمتقدمين**: استخدم **Supabase** - ميزات أكثر وتكلفة معقولة

**للأداء العالي**: استخدم **Neon** - سرعة فائقة وتكامل حديث

---

## 📞 المساعدة

إذا واجهت أي مشكلة:
1. تحقق من سجل Functions في Vercel
2. تأكد من متغيرات البيئة
3. اختبر الاتصال باستخدام `/api/health`
4. راجع هذا الدليل مرة أخرى

**بعد اتباع هذه الخطوات، تطبيقك سيعمل بشكل مثالي على Vercel!** 🎉
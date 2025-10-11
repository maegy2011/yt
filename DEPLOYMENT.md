# 🚀 دليل النشر على Vercel - ماي يوتيوب

## 📋 المتطلبات الأساسية

1. **حساب GitHub** - لاستضافة الكود
2. **حساب Vercel** - للنشر
3. **مفتاح YouTube Data API v3** - للتكامل مع يوتيوب

## 🔑 الخطوة 1: الحصول على مفتاح YouTube API

### 1.1 إنشاء مشروع في Google Cloud
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. سجل الدخول بحساب Google الخاص بك
3. انقر على "Select a project" ثم "NEW PROJECT"
4. أعط المشروع اسمًا (مثلاً: "my-youtube-app")
5. انقر على "CREATE"

### 1.2 تفعيل YouTube Data API
1. من القائمة الجانبية، اذهب إلى "APIs & Services" → "Library"
2. ابحث عن "YouTube Data API v3"
3. انقر على API ثم اضغط "ENABLE"

### 1.3 إنشاء بيانات الاعتماد
1. اذهب إلى "APIs & Services" → "Credentials"
2. انقر على "+ CREATE CREDENTIALS" → "API key"
3. سيتم إنشاء مفتاح API تلقائيًا
4. انقر على "EDIT API KEY"
5. في "API restrictions"، اختر "Restrict key"
6. من القائمة، اختر "YouTube Data API v3"
7. انقر على "SAVE"

### 1.4 نسخ المفتاح
- انقر على "COPY TO CLIPBOARD" لنسخ مفتاح API
- احفظ المفتاح في مكان آمن

## 📂 الخطوة 2: إعداد المشروع

### 2.1 نسخ المتغيرات البيئية
```bash
# انسخ ملف المتغيرات
cp .env.example .env.local

# افتح الملف وأضف مفتاح API
nano .env.local
```

### 2.2 إضافة مفتاح API
في ملف `.env.local`:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=https://your-app.vercel.app
```

### 2.3 دفع الكود إلى GitHub
```bash
# تهيئة Git إذا لم يكن مهيئًا
git init

# إضافة جميع الملفات
git add .

# إنشاء commit أولي
git commit -m "Initial commit: ماي يوتيوب تطبيق"

# ربط المستودع البعيد
git remote add origin https://github.com/your-username/my-youtube-app.git

# دفع الكود
git push -u origin main
```

## 🚀 الخطوة 3: النشر على Vercel

### 3.1 تسجيل الدخول إلى Vercel
1. اذهب إلى [Vercel.com](https://vercel.com)
2. سجل الدخول باستخدام حساب GitHub الخاص بك

### 3.2 استيراد المشروع
1. انقر على "New Project"
2. من قسم "Import Git Repository"، اختر مستودع GitHub الخاص بك
3. إذا لم يظهر المستودع، انقر على "Configure Git" وامنح Vercel الوصول

### 3.3 إعدادات المشروع
1. **Project Name**: أدخل اسمًا للتطبيق (مثلاً: "my-youtube-app")
2. **Framework Preset**: سيتم اكتشاف Next.js تلقائيًا
3. **Build Command**: تأكد من أنه `npm run build`
4. **Output Directory**: تأكد من أنه `.next`
5. **Install Command**: تأكد من أنه `npm install`

### 3.4 إضافة المتغيرات البيئية
1. انقر على "Environment Variables"
2. أضف المتغيرات التالية:
   - **YOUTUBE_API_KEY**: القيمة التي نسختها من Google Cloud
   - **NEXTAUTH_SECRET**: سلسلة عشوائية (يمكنك استخدام `openssl rand -base64 32`)
   - **NEXTAUTH_URL**: سيتم تعيينه تلقائيًا بعد النشر

3. انقر على "Add" لكل متغير
4. تأكد من تحديد "Environment": Production, Development, Preview

### 3.5 النشر
1. انقر على "Deploy"
2. انتظر حتى يكتمل عملية النشر (قد يستغرق بضع دقائق)
3. بعد اكتمال النشر، ستحصل على رابط مثل: `https://my-youtube-app.vercel.app`

## ✅ الخطوة 4: الاختبار والتحقق

### 4.1 اختبار التطبيق
1. افتح الرابط الذي حصلت عليه من Vercel
2. تأكد من أن الصفحة الرئيسية تعمل
3. جرب البحث عن فيديوهات
4. اختبر الأزرار (الأكثر شيوعاً، الأشهر)
5. انقر على فيديو لاختبار المشغل

### 4.2 التحقق من المتغيرات البيئية
إذا واجهت أخطاء متعلقة بـ YouTube API:
1. اذهب إلى Vercel Dashboard
2. اختر مشروعك
3. اذهب إلى "Settings" → "Environment Variables"
4. تأكد من أن `YOUTUBE_API_KEY` صحيح
5. أعد النشر إذا أجريت تغييرات

## 🔧 الخطوة 5: الصيانة والتحديثات

### 5.1 تحديث الكود
```bash
# بعد إجراء تغييرات على الكود
git add .
git commit -m "Update: وصف التغيير"
git push
```
سيقوم Vercel بإعادة النشر تلقائيًا.

### 5.2 مراقبة الأداء
1. من Vercel Dashboard، اذهب إلى "Analytics"
2. راقب أداء التطبيق وعدد الزوار
3. تحقق من استخدام API في "Functions"

### 5.3 إدارة التكاليف
- YouTube Data API مجاني حتى حد معين (100 طلب/يوم)
- Vercel لديه خطة مجانية سخية
- راقب الاستخدام لتجنب التكاليف غير المتوقعة

## 🚨 استكشاف الأخطاء الشائعة

### مشكلة: "YouTube API key not configured"
**الحل**: تأكد من إضافة `YOUTUBE_API_KEY` في متغيرات البيئة في Vercel

### مشكلة: "Failed to fetch videos"
**الحل**: 
1. تحقق من صحة مفتاح API
2. تأكد من تفعيل YouTube Data API v3 في Google Cloud
3. تحقق من قيود API

### مشكلة: البناء يفشل
**الحل**: 
1. تأكد من أن جميع الاعتماديات مثبتة
2. تحقق من أخطاء TypeScript
3. راجع سجلات البناء في Vercel

### مشكلة: التطبيق بطيء
**الحل**: 
1. تمكين التخزين المؤقت (مفعل تلقائيًا)
2. تحسين الصور
3. استخدام CDN

## 🎯 نصائح للإنتاج

### الأمان
1. لا تكشف مفتاح API أبدًا
2. استخدم متغيرات البيئة دائمًا
3. حدد قيود API في Google Cloud

### الأداء
1. تمكين التخزين المؤقت (مفعل في الكود)
2. استخدام الصور المضغوطة
3. تحسين استعلامات API

### التجربة المستخدم
1. اختبر التطبيق على أجهزة مختلفة
2. تأكد من التصميم المتجاوب
3. اختبر سرعة التحميل

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من سجلات Vercel
2. راجع وثائق YouTube API
3. افتح Issue في GitHub إذا كان الكود مفتوح المصدر

مبارك! 🎉 تطبيق "ماي يوتيوب" جاهز الآن للنشر على Vercel.
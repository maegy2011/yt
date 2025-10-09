# 🎥 YouTube Player & Hadith Encyclopedia

تطبيق ويب عربي متكامل يجمع بين مشغل يوتيوب متقدم وموسوعة الأحاديث النبوية، مصمم للعمل على Vercel.

## ✨ المميزات الرئيسية

### 🎥 مشغل يوتيوب المتقدم
- **مشغل مخصص**: واجهة مستخدم عربية بالكامل مع تحكم كامل بالفيديو
- **مزامنة الملاحظات**: إضافة ملاحظات متزامنة مع أوقات الفيديو
- **إدارة القنوات**: إضافة وإدارة قنوات يوتيوب المفضلة
- **التصفح السهل**: عرض الفيديوهات في شبكات أو قوائم مع البحث المتقدم
- **المفضلة والمشاهدة**: حفظ الفيديوهات المفضلة وتتبع المشاهدة

### 📚 موسوعة الأحاديث النبوية
- **بحث متقدم**: البحث في الأحاديث النبوية من مصادر موثوقة
- **حديث اليوم**: حديث عشوائي وحديث اليوم اليومي
- **التصفيف والتصنيف**: حسب المصنف والحكم والراوي
- **نظام المفضلة**: حفظ الأحاديث المفضلة ومشاركتها
- **واجهة عربية**: بالكامل مع دعم كامل للغة العربية

### 🎨 واجهة المستخدم
- **تصميم عربي**: مصمم خصيصًا للمستخدمين العرب
- **وضع الليل والنهار**: دعم كامل للوضع المظلم
- **متجاوب**: يعمل بشكل مثالي على جميع الأجهزة
- **سريع**: مُحسَّن للأداء مع Vercel

## 🚀 التقنيات المستخدمة

### 🏗️ الإطار الأساسي
- **⚡ Next.js 15** - إطار React للإنتاج مع App Router
- **📘 TypeScript 5** - JavaScript آمن للنوع
- **🎨 Tailwind CSS 4** - إطار عمل CSS للأداء

### 🧩 مكونات واجهة المستخدم
- **🧩 shadcn/ui** - مكونات عالية الجودة
- **🎯 Lucide React** - مكتبة الأيقونات
- **🎨 Framer Motion** - مكتبة الحركة للإنتاج

### 🔄 إدارة البيانات
- **🗄️ Prisma** - ORM لـ Node.js و TypeScript
- **🌐 Axios** - عميل HTTP قائم على الوعود
- **💾 Local Storage** - تخزين البيانات محليًا

### 🎨 الميزات المتقدمة
- **📝 محرر نصوص غني** - محرر نصوص متقدم
- **🎵 WebSocket** - دعم الاتصال الفوري
- **🖼️ معالجة الصور** - تحسين الصور والأداء

## 🚀 البدء السريع

### المتطلبات
- Node.js 18 أو أحدث
- npm أو yarn
- حساب Vercel

### التثبيت المحلي

```bash
# استنساخ المستودع
git clone <your-repo-url>
cd <project-name>

# تثبيت الاعتماديات
npm install

# إعداد متغيرات البيئة
cp .env.example .env.local

# تحرير .env.local وإضافة:
# NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here
# DATABASE_URL="file:./custom.db"

# بدء خادم التطوير
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) لرؤية التطبيق يعمل.

### النشر على Vercel

#### الطريقة 1: عبر واجهة Vercel (موصى بها)

1. **ادفع الكود إلى GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **استيراد إلى Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - انقر على "New Project"
   - اختر مستودع GitHub الخاص بك
   - Vercel سيكتشف الإعدادات تلقائيًا

3. **إعداد متغيرات البيئة**
   في لوحة تحكم Vercel:
   - اذهب إلى Settings > Environment Variables
   - أضف المتغيرات التالية:
     ```
     NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
     DATABASE_URL=file:./custom.db
     NODE_ENV=production
     ```

4. **النشر**
   - انقر على "Deploy"
   - سيتم نشر تطبيقك تلقائيًا

#### الطريقة 2: عبر Vercel CLI

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول إلى Vercel
vercel login

# النشر
vercel --prod

# اتبع التعليمات لإعداد متغيرات البيئة
```

## ⚙️ الإعدادات

### متغيرات البيئة

انسخ `.env.example` إلى `.env.local` وقم بتحديث القيم:

```env
# مفتاح API لـ YouTube (مطلوب)
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here

# إعدادات قاعدة البيانات
DATABASE_URL="file:./custom.db"

# رابط التطبيق
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# بيئة التشغيل
NODE_ENV=production
```

### الحصول على مفتاح YouTube API

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديدًا
3. فعّل "YouTube Data API v3"
4. أنشئ بيانات اعتماد API
5. انسخ مفتاح API وأضفه إلى متغيرات البيئة

## 📁 هيكل المشروع

```
src/
├── app/                    # صفحات Next.js App Router
│   ├── api/               # واجهات برمجة التطبيقات
│   ├── hadith/            # صفحة الأحاديث
│   ├── video/             # صفحة الفيديو
│   ├── layout.tsx         # التخطيط الرئيسي
│   └── page.tsx           # الصفحة الرئيسية
├── components/            # مكونات React قابلة لإعادة الاستخدام
│   ├── ui/               # مكونات shadcn/ui
│   ├── hadith-search.tsx  # مكون البحث عن الأحاديث
│   ├── custom-youtube-player.tsx  # مشغل يوتيوب المخصص
│   └── *-manager.tsx     # مكونات إدارة الملاحظات
├── hooks/                 # خطاط React المخصصة
├── lib/                   # وظائف الأداة والتكوينات
│   ├── hadith-api.ts      # واجهة برمجة تطبيقات الأحاديث
│   ├── youtube-api.ts     # تتبع استخدام YouTube API
│   ├── db.ts             # إعدادات قاعدة البيانات
│   └── socket.ts         # إعدادات WebSocket
└── public/                # الملفات العامة
```

## 🎨 المكونات المتاحة

### 🧩 مكونات واجهة المستخدم (shadcn/ui)
- **التصميم**: Card, Separator, Aspect Ratio
- **النماذج**: Input, Textarea, Select, Checkbox
- **التغذية الراجعة**: Alert, Skeleton
- **التنقل**: Dialog, Sheet, Tabs
- **عرض البيانات**: Badge

### 📊 الميزات المتقدمة
- **مشغل فيديو**: مشغل يوتيوب مخصص مع تحكم كامل
- **محرر نصوص**: محرر نصوص غني مع تنسيق
- **البحث**: بحث متقدم في الأحاديث والفيديوهات
- **المزامنة**: ملاحظات متزامنة مع الفيديو

## 🔧 التطوير

### أوامر التطوير

```bash
# بدء خادم التطوير
npm run dev

# بناء للإنتاج
npm run build

# بدء خادم الإنتاج
npm start

# فحص الكود
npm run lint

# دفع قاعدة البيانات
npm run db:push
```

### إضافة مكونات جديدة

1. استخدم `npx shadcn-ui@latest add [component-name]` لإضافة مكونات shadcn/ui
2. ضع المكونات المخصصة في `src/components/`
3. استخدم الأدوات المساعدة في `src/lib/`

## 🌐 النشر

### Vercel

1. **اتصل بمستودع GitHub**
2. **أضف متغيرات البيئة في Vercel**
3. **انقر Deploy**

المشروع مُعد مسبقًا لـ Vercel مع:
- تحسينات الأداء
- إعدادات الأمان
- دعم WebSocket
- تحسين الصور

### متغيرات البيئة للإنتاج

في Vercel، أضف هذه المتغيرات:
- `NEXT_PUBLIC_YOUTUBE_API_KEY` - مفتاح YouTube API
- `DATABASE_URL` - رابط قاعدة البيانات
- `NODE_ENV=production` - بيئة الإنتاج

## 🐛 حل المشكلات الشائعة

### مشاكل البناء

```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install

# حذف .next وإعادة البناء
rm -rf .next
npm run build
```

### مشاكل API

- تأكد من أن مفتاح YouTube API صالح
- تحقق من حصص API اليومية
- تأكد من إعدادات CORS في Vercel

### مشاكل قاعدة البيانات

- تأكد من وجود ملف قاعدة البيانات
- تحقق من صلاحيات الكتابة
- استخدم `npm run db:push` لمزامنة المخطط

## 📝 المساهمة

1. Fork المستودع
2. أنشئ فرعًا (`git checkout -b feature/amazing-feature`)
3. اCommit التغييرات (`git commit -m 'Add amazing feature'`)
4. ادفع الفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص بموجب ترخيص MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🤞 الدعم

إذا واجهت أي مشكلة أو كان لديك سؤال:

1. تحقق من [Issues](https://github.com/your-repo/issues)
2. أنشأ issue جديد
3. أو تواصل عبر البريد الإلكتروني

---

**مبني بـ ❤️ للمجتمع العربي** 🇸🇦  
مُحسَّن للعمل على **Vercel** ⚡
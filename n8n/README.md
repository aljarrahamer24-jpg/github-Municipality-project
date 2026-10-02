# ورك فلو n8n: إيميل + تلجرام → Google Sheets بالذكاء الاصطناعي

الملف: `email-telegram-to-sheets.json`

## شو بيعمل؟

```
Gmail Trigger ──► Normalize Email ───┐
                                     ├─► Unified Input ─► Has Text? ─► AI Extract & Classify ─► Prepare Row
Telegram Trigger ─► Normalize Telegram┘                                 (Claude + Structured Parser)        │
                                                                                                            ▼
   Reply to Sender ◄─ From Telegram? ◄─ Notify Me ◄─ Save to Category Sheet ◄─ Save to Main Sheet ◄──────────┘
```

1. **يستقبل** أي إيميل جديد غير مقروء (يفحص كل دقيقة) أو أي رسالة تُرسل للبوت على تلجرام.
2. **يوحّد** البيانات من المصدرين بنفس الشكل (المرسل، الموضوع، النص، التاريخ).
3. **الذكاء الاصطناعي (Claude)** يقرأ الرسالة ويستخرج: اسم الجهة، التصنيف، اسم الشخص، الهاتف، الإيميل، نوع الطلب، الموقع، الأولوية، وملخص.
4. **يحفظ** الصف في ورقة `جميع البيانات`، ونسخة في ورقة باسم التصنيف (مثلاً `مؤسسة حقوق المرأة`) — هيك البيانات مرتبة حسب الجهة المرسلة.
5. **يبعتلك رسالة تلجرام** إنو تم حفظ البيانات مع ملخص.
6. إذا كانت الرسالة من تلجرام، **يرد على المرسل** إنو رسالته وصلت.

## التصنيفات

`مؤسسة حقوق المرأة` · `جمعية خيرية` · `مؤسسة شبابية` · `جهة حكومية` · `شركة / مورد` · `شكوى مواطن` · `طلب خدمة بلدية` · `أخرى`

لتعديلها: غيّر القائمة في 3 أماكن — نص الـ prompt بعقدة **AI Extract & Classify**، الـ `enum` بعقدة **Structured Output Parser**، والمصفوفة `CATEGORIES` بعقدة **Prepare Row** — وأنشئ ورقة بنفس الاسم في الشيت.

## خطوات التشغيل

### 1) جهّز Google Sheet
- اعمل شيت جديد وانسخ الـ ID من الرابط: `docs.google.com/spreadsheets/d/`**`<ID>`**`/edit`
- أنشئ ورقة (Tab) اسمها `جميع البيانات`، وورقة لكل تصنيف من القائمة فوق (بنفس الاسم بالضبط).
- بالصف الأول من **كل** ورقة حط العناوين الموجودة في `sheet-headers.csv`:
  `التاريخ, المصدر, الجهة المرسلة, التصنيف, اسم المرسل, وسيلة التواصل, رقم الهاتف, البريد الإلكتروني, نوع الطلب, الموقع, الأولوية, الملخص, الموضوع, نص الرسالة`

### 2) جهّز بوت تلجرام
- من [@BotFather](https://t.me/BotFather) اعمل بوت جديد وخذ الـ Token.
- لتعرف الـ Chat ID تبعك: ابعت رسالة لـ [@userinfobot](https://t.me/userinfobot).
- ابعت `/start` للبوت تبعك عشان يقدر يراسلك.

### 3) استورد الورك فلو في n8n
- **Workflows → Import from File** واختر `email-telegram-to-sheets.json`.
- اربط الـ Credentials:
  | العقدة | Credential |
  |---|---|
  | Gmail Trigger | Gmail OAuth2 |
  | Telegram Trigger / Notify Me / Reply to Sender | Telegram API (توكن البوت) |
  | Claude Chat Model | Anthropic API key (من console.anthropic.com) |
  | Save to Main Sheet / Save to Category Sheet | Google Sheets OAuth2 |
- استبدل `PUT_YOUR_GOOGLE_SHEET_ID_HERE` بالعقدتين **Save to …** بـ ID الشيت.
- استبدل `PUT_YOUR_TELEGRAM_CHAT_ID_HERE` بعقدة **Notify Me** بالـ Chat ID تبعك.

### 4) فعّل
- اضغط **Active**. ملاحظة: Telegram Trigger بيحتاج n8n يكون على رابط HTTPS عام (n8n Cloud أو سيرفر عليه دومين). إذا شغال محلي استخدم tunnel: `n8n start --tunnel`.

## ملاحظات
- النموذج المستخدم `claude-haiku-4-5-20251001` (سريع ورخيص ومناسب للتصنيف). بتقدر تغيره من عقدة **Claude Chat Model**. وإذا بتفضّل OpenAI أو Gemini، بدّل عقدة الموديل فقط والباقي بيضل زي ما هو.
- إذا ما في ورقة باسم التصنيف، الحفظ بالورقة الرئيسية بيضل يصير والورك فلو بيكمل (العقدة معمول لها Continue on error).
- التوقيت مأخوذ من إعدادات n8n — عدّله من **Settings → Timezone** (مثلاً `Asia/Amman` أو `Asia/Hebron`).
- الرسائل اللي إنت بتبعتها للبوت كمان رح تنحفظ. إذا بدك تتجاهلها، زِد شرط بعقدة **Has Text?**: `reply_chat_id` لا يساوي الـ Chat ID تبعك.

# MATRIX STUDIO PRO v4

بيئة تطوير شخصية تجمع محرر الأكواد، مختبر Python، أدوات JavaScript، مختبر البرومبت، أدوات الدراسة وإدارة الأعمال، والخريطة الذهنية.

## التشغيل والنشر

1. ارفع محتويات هذا المجلد إلى جذر مستودع GitHub.
2. افتح Settings → Pages.
3. اختر Deploy from a branch ثم `main` و`/(root)`.
4. افتح رابط GitHub Pages مرة واحدة مع الإنترنت.

لا يوجد Backend أو قاعدة بيانات على سيرفر. بيانات المستخدم تُحفظ على نفس المتصفح والجهاز باستخدام Local Storage. امسح بيانات الموقع أو غيّر المتصفح فقط بعد تصدير نسخة احتياطية JSON.

## العمل دون إنترنت

- واجهة التطبيق وملفاته الأساسية تُخزَّن عبر Service Worker بعد أول زيارة ناجحة.
- يعمل التطبيق دون اتصال بعد تثبيت ملفات الواجهة في المتصفح.
- Python الحقيقي يعمل بواسطة Pyodide / CPython WebAssembly. يحتاج تنزيل محرك Python وملفاته أول مرة من jsDelivr. بعد تنزيلها وتخزينها في Service Worker يمكن تشغيله دون اتصال على نفس المتصفح والجهاز.
- لتجهيز Python للأوفلاين: افتح التطبيق مع الإنترنت، انتقل إلى تبويب Python وانتظر ظهور «جاهز»، ثم أعد تحميل الصفحة مرة واحدة حتى يصبح Service Worker متحكمًا في الصفحة. جرّب تشغيل مثال Python، وبعدها اختبر وضع الطيران.
- لا يمكن ضمان تشغيل Python لأول مرة دون إنترنت لأن ملفات مفسر Python وWebAssembly ليست مضمنة في هذا الأرشيف.

## التخزين والنسخ الاحتياطي

- الحفظ التلقائي مفعّل افتراضيًا.
- البيانات محفوظة محليًا في المتصفح ولا تنتقل إلى سيرفر.
- استخدم إعدادات التطبيق لتصدير نسخة JSON أو استيراد نسخة سابقة.
- GitHub Pages يستضيف ملفات البرنامج فقط. لا يزامن بياناتك بين الأجهزة.

## المزايا

- واجهة RTL عربية مع هوية MATRIX STUDIO PRO.
- وضع فاتح وداكن وحجم خط وحركة قابلة للتحكم.
- تنقل متحرك بين الأقسام.
- محرر JavaScript يشغّل الكود داخل iframe معزولًا عن الصفحة الرئيسية.
- Python حقيقي عبر Pyodide، وليس مفسرًا شكليًا مبنيًا على تحليل نصوص محدود.
- بلوكات منطقية تدعم السحب والإفلات وإعادة الترتيب وأزرار التحريك المناسبة للمس.
- مكتبة برومبتات للبرمجة وإدارة الأعمال والمحاسبة والمالية والتسويق والموارد البشرية والعمليات والذكاء الاصطناعي والدراسة.
- تصدير واستيراد الإعدادات والبيانات.

## ملاحظات تقنية مهمة

- تشغيل JavaScript داخل iframe يقلل أثر الكود على واجهة التطبيق، لكنه ليس بيئة تشغيل آمنة لتشغيل أكواد غير موثوقة أو سرية.
- قيود المتصفح تمنع بعض وظائف Python التي تحتاج نظام تشغيل أو صلاحيات محلية أو حزمًا غير متاحة لـ WebAssembly.
- الحفظ محلي لكل متصفح. صدّر نسخة احتياطية بانتظام.
- GitHub Pages لا يوفر Backend أو قاعدة بيانات أو مزامنة حسابات.

## MATRIX STUDIO PRO v6 additions
- Fixed IDE-style workspace and text navigation.
- Local system font stack; no Google Fonts or font CDN requests.
- Project explorer, browser-local project files, and JSON project export.
- Configurations editor with JSON import/apply and config export.
- Developer shortcut reference and expanded prompt engineering library.
- Keyboard shortcuts: Ctrl/Cmd+S saves; Ctrl/Cmd+K opens the developer reference.

See `CHANGELOG.md` for details and offline-runtime limitations.


## Version 6.0 — Developer Workstation

- Added a multi-file local editor with tabs, line numbers, file import/export, find/replace, basic cleanup, and keyboard shortcuts.
- JavaScript snippets run in a dedicated Web Worker with a timeout. The worker has no DOM access to the application page.
- Added a browser-based command workbench. It is intentionally not a real OS shell, Bash, PowerShell, or Node.js runtime.
- Expanded prompt engineering templates for software architecture, APIs, databases, Python, frontend, security, DevOps, AI agents, and technical product/business work.
- Added a decorative offline-safe Unicode signature for Mohamed Salah and larger system-font typography. No remote fonts are loaded.
- Updated the service worker cache to v6 and added `pro.js` to the offline application shell.

### Runtime boundaries

The editor is a lightweight offline editor, not the Monaco Editor package. Monaco and a full Node.js runtime are not bundled because this environment cannot retrieve their large vendor distributions. Python uses Pyodide from its configured CDN and is cached by the service worker after a successful online load. The Developer Terminal is a clearly labeled in-browser command workbench, not an operating-system terminal.

## Notes about the editor and terminal

The v6 editor provides local multi-file tabs, line numbers, keyboard shortcuts, import/export, find/replace, and JavaScript Worker execution. It is a lightweight editor rather than Monaco. The Developer Terminal is a browser command workbench, not a real operating-system shell, and Node.js CLI commands cannot run inside it. No web fonts are requested; typography uses installed system fonts and local monospace stacks.

The decorative profile signature reads “𝕸𝖔𝖍𝖆𝖒𝖊𝖉 𝕾𝖆𝖑𝖆𝖍”.


## Mobile use (v7)
- The primary navigation is fixed at the bottom. Swipe it horizontally to reach all sections.
- Use the on-screen buttons for save, search, file creation, and code execution; no physical keyboard shortcuts are required.
- Rotate the phone to landscape for a wider code editing area.
- The app uses system fonts only and does not download web fonts.

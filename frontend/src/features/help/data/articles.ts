/**
 * Knowledge base content for the public help center.
 *
 * Kept out of the i18n dictionaries on purpose: articles are content, not UI
 * chrome, and they are read/searched as a single document tree. Every string
 * is a LocalizedText so the English and Arabic versions stay in lockstep.
 */

export type LocalizedText = { en: string; ar: string };

export type HelpCategoryId =
    | "account"
    | "courses"
    | "certificates"
    | "simulator"
    | "billing"
    | "troubleshooting";

export interface HelpCategory {
    id: HelpCategoryId;
    label: LocalizedText;
    description: LocalizedText;
}

export interface HelpArticle {
    slug: string;
    category: HelpCategoryId;
    title: LocalizedText;
    summary: LocalizedText;
    /** Body paragraphs, rendered in order. */
    body: LocalizedText[];
    /** Optional numbered walkthrough shown under the body. */
    steps?: LocalizedText[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
    {
        id: "account",
        label: { en: "Account & sign-in", ar: "الحساب والدخول" },
        description: {
            en: "Verification emails, passwords, two-factor codes.",
            ar: "رسائل التحقق، كلمات المرور، رموز التحقق الثنائي.",
        },
    },
    {
        id: "courses",
        label: { en: "Courses & progress", ar: "الدورات والتقدّم" },
        description: {
            en: "Access, lesson progress, quizzes and assessments.",
            ar: "الوصول، تقدّم الدروس، الاختبارات والتقييمات.",
        },
    },
    {
        id: "certificates",
        label: { en: "Certificates", ar: "الشهادات" },
        description: {
            en: "Earning, downloading and verifying a certificate.",
            ar: "الحصول على الشهادات وتحميلها والتحقق منها.",
        },
    },
    {
        id: "simulator",
        label: { en: "Simulator", ar: "المحاكي" },
        description: {
            en: "Vehicles, data packs, diagnostics sessions.",
            ar: "المركبات، حزم البيانات، جلسات التشخيص.",
        },
    },
    {
        id: "billing",
        label: { en: "Billing", ar: "الفوترة" },
        description: {
            en: "Orders, invoices, subscriptions and refunds.",
            ar: "الطلبات، الفواتير، الاشتراكات واسترداد المبالغ.",
        },
    },
    {
        id: "troubleshooting",
        label: { en: "Troubleshooting", ar: "حل المشكلات" },
        description: {
            en: "Slow pages, broken media, browser problems.",
            ar: "الصفحات البطيئة، الوسائط المعطّلة، مشاكل المتصفح.",
        },
    },
];

export const HELP_ARTICLES: HelpArticle[] = [
    {
        slug: "verify-email",
        category: "account",
        title: {
            en: "I never received the verification email",
            ar: "لم يصلني بريد التحقق",
        },
        summary: {
            en: "What to check before asking support to resend your link.",
            ar: "ما يجب التحقق منه قبل طلب إعادة إرسال الرابط من الدعم.",
        },
        body: [
            {
                en: "You need a verified email address before you can sign in. The message comes from support@hbtronics.dz and usually arrives within a minute.",
                ar: "تحتاج إلى بريد إلكتروني مُتحقَّق منه قبل تسجيل الدخول. تأتي الرسالة من support@hbtronics.dz وعادةً تصل خلال دقيقة.",
            },
            {
                en: "If it is not there, the address was probably typed differently at signup, or the message was filtered before it reached your inbox.",
                ar: "إذا لم تصل، فغالبًا تم كتابة العنوان بشكل مختلف عند التسجيل، أو تم تصنيف الرسالة كغير مرغوبة قبل وصولها إلى صندوق وارد.",
            },
        ],
        steps: [
            {
                en: "Search your inbox (and Spam/Promotions) for “HBTronics” or support@hbtronics.dz.",
                ar: "ابحث في صندوق الوارد (والرسائل غير المرغوبة) عن “HBTronics” أو support@hbtronics.dz.",
            },
            {
                en: "On the sign-in page, enter your address and choose “Resend verification email”.",
                ar: "في صفحة تسجيل الدخول، أدخل بريدك واختر “إعادة إرسال بريد التحقق”.",
            },
            {
                en: "Already signed in? The blue gate screen has the same resend button.",
                ar: "هل سجّلت الدخول بالفعل؟ شاشة التحقق الزرقاء تحتوي على زر إعادة الإرسال نفسه.",
            },
            {
                en: "Still nothing after two minutes — open a ticket and we will verify the address for you.",
                ar: "إذا لم يصل شيء بعد دقيقتين — أفتح تذكرة وسنتحقّق من العنوان نيابةً عنك.",
            },
        ],
    },
    {
        slug: "cannot-sign-in",
        category: "account",
        title: { en: "I cannot sign in", ar: "لا أستطيع تسجيل الدخول" },
        summary: {
            en: "Credentials, verification and two-factor codes explained.",
            ar: "شرح بيانات الدخول والتحقق ورموز التحقق الثنائي.",
        },
        body: [
            {
                en: "The sign-in screen answers with the same message whether the password is wrong, the account does not exist, or the email is still unverified — this is intentional so accounts cannot be discovered.",
                ar: "تعطي شاشة الدخول نفس الرسالة سواء كانت كلمة المرور خاطئة أو الحساب غير موجود أو البريد غير مُتحقَّق منه — وهذا مقصود حتى لا يمكن اكتشاف الحسابات.",
            },
            {
                en: "Accounts created through Google sign-in do not use a password at all.",
                ar: "الحسابات التي أنشئت عبر تسجيل الدخول بـ Google لا تستخدم كلمة مرور إطلاقًا.",
            },
        ],
        steps: [
            {
                en: "Use “Forgot password” and follow the reset link (valid for one hour).",
                ar: "استخدم “نسيت كلمة المرور” واتبع رابط إعادة التعيين (صالح لمدة ساعة).",
            },
            {
                en: "If the message says your email is not verified, resend it and confirm the link.",
                ar: "إذا كانت الرسالة تقول إن بريدك غير مُتحقَّق منه، أعد إرساله وافتح الرابط للتأكيد.",
            },
            {
                en: "Too many attempts? Wait a few minutes — the lock clears on its own.",
                ar: "محاولات كثيرة؟ انتظر دقائق — يُلغى القفل تلقائيًا.",
            },
        ],
    },
    {
        slug: "two-factor",
        category: "account",
        title: {
            en: "Two-factor authentication (OTP)",
            ar: "التحقق الثنائي (رمز OTP)",
        },
        summary: {
            en: "Where the code comes from and what to do if it never arrives.",
            ar: "من أين يأتي الرمز وماذا تفعل إذا لم يصل.",
        },
        body: [
            {
                en: "If two-factor is enabled on your account, signing in asks for a 6-digit code after your password.",
                ar: "إذا كان التحقق الثنائي مفعّلًا على حسابك، يطلب تسجيل الدخول رمزًا من 6 أرقام بعد كلمة المرور.",
            },
            {
                en: "The code is valid for a short window and each code can be used once. Requesting a new code invalidates the previous one.",
                ar: "الرمز صالح لوقت قصير ويُستخدم مرة واحدة فقط. طلب رمز جديد يجعل الرمز السابق غير صالح.",
            },
        ],
        steps: [
            {
                en: "Wait for the email, then check Spam/Promotions before requesting another.",
                ar: "انتظر الرسالة، ثم تحقق من غير المرغوب فيها قبل طلب رمز آخر.",
            },
            {
                en: "Use “Resend code” on the challenge screen if the first one expired.",
                ar: "استخدم “إعادة إرسال الرمز” في شاشة التحقق إذا انتهت صلاحية الأول.",
            },
            {
                en: "Wrong time zone or device clock? Codes are time based — keep your clock automatic.",
                ar: "منطقة وقت أو ساعة جهاز غير صحيحة؟ الرموز تعتمد على الوقت — اترك ساعة جهازك على التلقائي.",
            },
        ],
    },
    {
        slug: "course-not-opening",
        category: "courses",
        title: {
            en: "I bought a course but cannot open it",
            ar: "اشتريت دورة لكنني لا أستطيع فتحها",
        },
        summary: {
            en: "Enrollment, pending payments and where access shows up.",
            ar: "التسجيل، المدفوعات المعلّقة، وأين يظهر الوصول.",
        },
        body: [
            {
                en: "Access is granted the moment a payment succeeds. If the payment is still pending with the provider, the course stays locked until the confirmation arrives.",
                ar: "يُمنح الوصول فور نجاح الدفع. إذا كان الدفع لا يزال معلقًا لدى مزوّد الدفع، تبقى الدورة مقفلة حتى تصل الموافقة.",
            },
            {
                en: "Your dashboard “My courses” list and the catalog badge are the source of truth — a course you own always shows as enrolled there.",
                ar: "قائمة “دوراتي” في لوحة التحكم وشارة الكتالوج هما المرجع — الدورة التي تملكها تظهر دائمًا كمسجّلة لديك.",
            },
        ],
        steps: [
            {
                en: "Open Billing → Orders and check the order status.",
                ar: "افتح الفوترة → الطلبات وتحقق من حالة الطلب.",
            },
            {
                en: "Refresh the catalog page so the new enrollment is loaded.",
                ar: "حدّث صفحة الكتالوج ليتم تحميل التسجيل الجديد.",
            },
            {
                en: "Paid but still locked after ten minutes? Send us the order reference in a ticket.",
                ar: "هل دفعت لكن الوصول ما زال مقفلًا بعد عشر دقائق؟ أرسل لنا مرجع الطلب في تذكرة.",
            },
        ],
    },
    {
        slug: "progress-not-saved",
        category: "courses",
        title: {
            en: "Lesson progress was not saved",
            ar: "لم يُحفظ تقدّم الدرس",
        },
        summary: {
            en: "Why a completed lesson can still show 0%.",
            ar: "لماذا قد يظهر درس مكتمل بنسبة 0%.",
        },
        body: [
            {
                en: "Progress is saved when you mark a lesson complete or when a quiz attempt is submitted — opening a lesson alone does not count.",
                ar: "يُحفظ التقدّم عند تعليم الدرس كمكتمل أو عند إرسال محاولة اختبار — فتح الدرس وحده لا يُحتسب.",
            },
            {
                en: "Video lessons also remember your last position, so leaving mid-video resumes where you stopped.",
                ar: "تتذكر دروس الفيديو آخر موقع توقفت عنده، لذا مغادرة الفيديو في منتصفه يعيدك إلى نفس النقطة.",
            },
        ],
        steps: [
            {
                en: "Press “Mark as complete” at the end of the lesson.",
                ar: "اضغط “تعليم كمكتمل” في نهاية الدرس.",
            },
            {
                en: "Stay on the page a second after the action — closing too fast can drop the request.",
                ar: "ابقَ في الصفحة ثانية بعد الإجراء — الإغلاق السريع قد يُسقط الطلب.",
            },
            {
                en: "Sign out and back in if the percentage still looks wrong.",
                ar: "سجّل الخروج ثم الدخول إذا بقيت النسبة غير صحيحة.",
            },
        ],
    },
    {
        slug: "certificates",
        category: "certificates",
        title: {
            en: "Earning, sharing and verifying a certificate",
            ar: "الحصول على الشهادة ومشاركتها والتحقق منها",
        },
        summary: {
            en: "Requirements, the public verification link and PDF downloads.",
            ar: "المتطلبات ورابط التحقق العام وتحميل ملف PDF.",
        },
        body: [
            {
                en: "A certificate is issued when you pass the course assessment with the required score. It appears under your certificates with a unique number.",
                ar: "تُصدر الشهادة عند اجتياز تقييم الدورة بالدرجة المطلوبة. تظهر ضمن شهاداتك برقم فريد.",
            },
            {
                en: "Every certificate has a public verification page — employers can confirm it without an account by scanning the QR code or opening the short link.",
                ar: "لكل شهادة صفحة تحقق عامة — يمكن لأصحاب العمل تأكيدها دون حساب عبر مسح رمز QR أو فتح الرابط القصير.",
            },
        ],
        steps: [
            {
                en: "Open Certificates and choose the certificate you want to share.",
                ar: "افتح الشهادات واختر الشهادة التي تريد مشاركتها.",
            },
            {
                en: "Copy the verification link (or download the PDF) from the share menu.",
                ar: "انسخ رابط التحقق (أو نزّل ملف PDF) من قائمة المشاركة.",
            },
            {
                en: "Anyone can validate it at /verify/<certificate number>.",
                ar: "يمكن لأي شخص التحقق منها عبر ‎/verify/<رقم الشهادة>‎.",
            },
        ],
    },
    {
        slug: "simulator-wont-start",
        category: "simulator",
        title: {
            en: "The simulator does not start",
            ar: "لا يبدأ المحاكي",
        },
        summary: {
            en: "Browser, data packs and session troubleshooting.",
            ar: "المتصفح، حزم البيانات، وحل مشاكل الجلسات.",
        },
        body: [
            {
                en: "The simulator needs a current desktop or mobile browser with JavaScript and WebSockets enabled. Corporate proxies sometimes block the streaming connection.",
                ar: "يتطلب المحاكي متصفحًا حديثًا يعمل على الحاسوب أو الهاتف مع تفعيل JavaScript و WebSockets. غالبًا ما تحجب شبكات الشركات اتصال البث.",
            },
            {
                en: "Each vehicle needs a published data pack. If a pack was removed by an instructor, the environment shows as unavailable rather than starting empty.",
                ar: "تحتاج كل مركبة إلى حزم بيانات منشورة. إذا حذف مدرّس الحزمة، تظهر البيئة كغير متاحة بدل أن تبدأ فارغة.",
            },
        ],
        steps: [
            {
                en: "Reload the page once — a stale session from a previous run is the usual cause.",
                ar: "أعد تحميل الصفحة مرة واحدة — غالبًا السبب جلسة قديمة من تشغيل سابق.",
            },
            {
                en: "Disable VPN/extension blockers for this domain and try again.",
                ar: "عطّل VPN أو إضافات الحجب لهذا النطاق ثم أعد المحاولة.",
            },
            {
                en: "Tell us the vehicle, data pack and time of the attempt in a ticket.",
                ar: "أخبرنا بالمركبة وحزمة البيانات ووقت المحاولة في تذكرة.",
            },
        ],
    },
    {
        slug: "billing-refunds",
        category: "billing",
        title: {
            en: "Orders, invoices and refunds",
            ar: "الطلبات والفواتير واسترداد المبالغ",
        },
        summary: {
            en: "Where receipts live and how refund requests work.",
            ar: "أين توجد الإيصالات وكيف تعمل طلبات الاسترداد.",
        },
        body: [
            {
                en: "Every order is listed under Billing with its status, amount and downloadable invoice.",
                ar: "كل طلب مدرج ضمن الفوترة مع حالته ومبلغه وفاتورته القابلة للتحميل.",
            },
            {
                en: "Refund eligibility follows the plan terms shown at checkout. Approved refunds are returned through the original payment method.",
                ar: "تتبع أهلية الاسترداد شروط الخطة المعروضة عند الدفع. تُعاد المبالغ المعتمدة عبر وسيلة الدفع نفسها.",
            },
        ],
        steps: [
            {
                en: "Open Billing → Orders and locate the order reference.",
                ar: "افتح الفوترة → الطلبات وحدد مرجع الطلب.",
            },
            {
                en: "Attach the reference and the reason when you open a billing ticket.",
                ar: "أرفق المرجع والسبب عند فتح تذكرة فوترة.",
            },
        ],
    },
    {
        slug: "slow-or-broken",
        category: "troubleshooting",
        title: {
            en: "Pages are slow or videos will not play",
            ar: "الصفحات بطيئة أو الفيديوهات لا تعمل",
        },
        summary: {
            en: "Quick checks before you report a problem.",
            ar: "فحوصات سريعة قبل الإبلاغ عن المشكلة.",
        },
        body: [
            {
                en: "Media is served from the platform storage domain. If images or videos fail while the rest of the page loads, the connection to that domain is usually the problem.",
                ar: "تُقدَّم الوسائط من نطاق تخزين المنصة. إذا فشلت الصور أو مقاطع الفيديو بينما تعمل بقية الصفحة، فغالبًا المشكلة في الاتصال بذلك النطاق.",
            },
            {
                en: "Adblockers and strict tracking protection can also stop the player from loading.",
                ar: "قد تمنع إضافات حظر الإعلانات وحماية التتبع الصارمة تحميل المشغّل أيضًا.",
            },
        ],
        steps: [
            {
                en: "Try another browser or an incognito window to rule out extensions.",
                ar: "جرّب متصفحًا آخر أو نافذة خفية لاستبعاد الإضافات.",
            },
            {
                en: "Sign out, clear the site data, and sign in again.",
                ar: "سجّل الخروج، امسح بيانات الموقع، ثم سجّل الدخول مجددًا.",
            },
            {
                en: "Include the page address, browser and time in your ticket.",
                ar: "أدرج عنوان الصفحة والمتصفح والوقت في تذكرتك.",
            },
        ],
    },
];

export function localized(value: LocalizedText, locale: string): string {
    return locale.startsWith("ar") ? value.ar : value.en;
}

export function helpArticleUrl(slug: string): string {
    return `/help/${slug}`;
}

/** Cheap relevance score used by the help center and the widget search. */
export function searchArticles(query: string, locale: string, limit = 6): HelpArticle[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    const terms = needle.split(/\s+/).filter(Boolean);

    return HELP_ARTICLES.map((article) => {
        const haystack = [
            localized(article.title, locale),
            localized(article.summary, locale),
            ...article.body.map((paragraph) => localized(paragraph, locale)),
            ...article.steps?.map((step) => localized(step, locale)) ?? [],
        ]
            .join(" ")
            .toLowerCase();

        let score = 0;
        for (const term of terms) {
            if (localized(article.title, locale).toLowerCase().includes(term)) score += 3;
            if (haystack.includes(term)) score += 1;
        }

        return { article, score };
    })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((entry) => entry.article);
}

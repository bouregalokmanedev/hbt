export interface GuideText {
    en: string;
    ar: string;
}

export interface GuideLink {
    label: GuideText;
    to: string;
}

export interface GuideChapter {
    title: GuideText;
    body: GuideText;
    steps: GuideText[];
    links: GuideLink[];
}

export interface GuideFaq {
    q: GuideText;
    a: GuideText;
}

export interface GuideContent {
    badge: GuideText;
    title: GuideText;
    description: GuideText;
    rightsTitle: GuideText;
    canTitle: GuideText;
    cantTitle: GuideText;
    can: GuideText[];
    cant: GuideText[];
    chaptersTitle: GuideText;
    chapters: GuideChapter[];
    faqTitle: GuideText;
    faqs: GuideFaq[];
}

export type GuideRole = "student" | "instructor" | "support" | "admin" | "sales";

const t = (en: string, ar: string): GuideText => ({ en, ar });

export const guideContent: Record<GuideRole, GuideContent> = {
    student: {
        badge: t("Learner guide", "دليل المتعلم"),
        title: t("How learning works", "كيف يعمل التعلّم"),
        description: t(
            "Everything a student can do on HBTronics — from first click to verified certificate — and the rules that keep it fair.",
            "كل ما يمكنك فعله كمتعلم على HBTronics — من أول نقرة حتى الشهادة الموثقة — والقواعد التي تحافظ على العدالة.",
        ),
        rightsTitle: t("Your rights on the platform", "حقوقك على المنصة"),
        canTitle: t("You can", "يمكنك"),
        cantTitle: t("You cannot", "لا يمكنك"),
        can: [
            t("Enroll in free courses instantly, or unlock paid ones through checkout", "الالتحاق بالدورات المجانية فوراً، أو فتح المدفوعة عبر الدفع"),
            t("Learn lessons in order, retry quizzes, and take final assessments", "دراسة الدروس بالترتيب وإعادة الاختبارات وخوض التقييمات النهائية"),
            t("Earn QR-verifiable certificates and share them", "الحصول على شهادات موثقة برمز QR ومشاركتها"),
            t("Use diagnostics, simulator labs, AI mentor, messages and support", "استخدام التشخيصات والمحاكاة والمرشد الذكي والرسائل والدعم"),
        ],
        cant: [
            t("Share your account or download lesson videos", "مشاركة حسابك أو تحميل فيديوهات الدروس"),
            t("Skip ahead — lessons unlock in sequence", "تخطي الدروس — تُفتح بالترتيب"),
            t("Open another learner's certificates or private data", "الوصول لشهادات أو بيانات متعلم آخر"),
        ],
        chaptersTitle: t("From signup to certificate", "من التسجيل إلى الشهادة"),
        chapters: [
            {
                title: t("1 · Enroll in a course", "1 · الالتحاق بدورة"),
                body: t(
                    "Browse the catalog, open a course to check its curriculum, diagnostics and certificate, then enroll. Paid courses go through secure checkout first.",
                    "تصفح الفهرس، وافتح الدورة لمراجعة منهجها وتشخيصاتها وشهادتها، ثم التحق. الدورات المدفوعة تمر عبر دفع آمن أولاً.",
                ),
                steps: [
                    t("Open Catalog and pick a course", "افتح الفهرس واختر دورة"),
                    t("Review curriculum, diagnostics and certificate sections", "راجع أقسام المنهج والتشخيصات والشهادة"),
                    t("Enroll free, or pay and return to start learning", "التحق مجاناً، أو ادفع ثم ابدأ التعلم"),
                ],
                links: [{ label: t("Open catalog", "افتح الفهرس"), to: "/catalog" }],
            },
            {
                title: t("2 · Learn, practise, prove", "2 · تعلّم وتدرّب وأثبت"),
                body: t(
                    "Watch each lesson, complete it to unlock the next, pass section quizzes, then take the final assessment. Diagnostics and simulator labs turn theory into hands-on skill.",
                    "شاهد كل درس وأكمله لفتح التالي، وتجاوز اختبارات الأقسام، ثم خض التقييم النهائي. التشخيصات والمحاكاة تحوّل النظرية إلى مهارة عملية.",
                ),
                steps: [
                    t("Complete lessons in order — progress saves automatically", "أكمل الدروس بالترتيب — يُحفظ التقدم تلقائياً"),
                    t("Pass section quizzes to prove each checkpoint", "تجاوز اختبارات الأقسام لإثبات كل مرحلة"),
                    t("Take the final assessment when eligible", "خض التقييم النهائي عند الاستحقاق"),
                ],
                links: [{ label: t("My courses", "دوراتي"), to: "/my-courses" }],
            },
            {
                title: t("3 · Get certified and keep going", "3 · احصل على الشهادة وواصل"),
                body: t(
                    "Passing the final assessment issues your certificate automatically. Download the PDF, verify it anytime, and keep your streak alive with daily practice.",
                    "اجتياز التقييم النهائي يصدر شهادتك تلقائياً. حمّل PDF وتحقق منها في أي وقت، وحافظ على سلسلة التعلم بالممارسة اليومية.",
                ),
                steps: [
                    t("Download your certificate from My certificates", "حمّل شهادتك من شهاداتي"),
                    t("Verify any certificate by its HBT number", "تحقق من أي شهادة برقم HBT"),
                    t("Return daily — streaks and XP reward consistency", "عُد يومياً — السلاسل والنقاط تكافئ الاستمرارية"),
                ],
                links: [{ label: t("Verify a certificate", "تحقق من شهادة"), to: "/verify-certificate" }],
            },
        ],
        faqTitle: t("Student questions", "أسئلة المتعلمين"),
        faqs: [
            {
                q: t("Why is the next lesson locked?", "لماذا الدرس التالي مقفل؟"),
                a: t(
                    "Lessons unlock in sequence. Complete the current lesson — and any section quiz — to open the next one.",
                    "تُفتح الدروس بالترتيب. أكمل الدرس الحالي — وأي اختبار قسم — لفتح التالي.",
                ),
            },
            {
                q: t("I failed a quiz. What now?", "رسبت في اختبار. ماذا الآن؟"),
                a: t(
                    "Review the lessons, then retry the quiz. Your best score counts toward assessment eligibility.",
                    "راجع الدروس ثم أعد الاختبار. أفضل نتيجة تُحتسب لأهلية التقييم.",
                ),
            },
            {
                q: t("Where is my certificate?", "أين شهادتي؟"),
                a: t(
                    "Certificates appear under My certificates after you pass the final assessment. Each carries a verifiable HBT number.",
                    "تظهر الشهادات تحت شهاداتي بعد اجتياز التقييم النهائي. كل شهادة تحمل رقم HBT قابلاً للتحقق.",
                ),
            },
            {
                q: t("Who do I contact for help?", "لمن أتوجه للمساعدة؟"),
                a: t(
                    "Use Messages for your instructor, Support tickets for account or billing issues, and Announcements for platform news.",
                    "استخدم الرسائل لمدربك، وتذاكر الدعم لمشاكل الحساب أو الدفع، والإعلانات لأخبار المنصة.",
                ),
            },
        ],
    },
    instructor: {
        badge: t("Teaching guide", "دليل التدريس"),
        title: t("How teaching works", "كيف يعمل التدريس"),
        description: t(
            "Your role, rights and limits as an instructor — plus the full path from draft course to graded learners and revenue.",
            "دورك وحقوقك وحدودك كمدرب — والمسار الكامل من مسودة الدورة إلى تقييم المتعلمين والإيرادات.",
        ),
        rightsTitle: t("Your rights on the platform", "حقوقك على المنصة"),
        canTitle: t("You can", "يمكنك"),
        cantTitle: t("You cannot", "لا يمكنك"),
        can: [
            t("Create and fully own your courses: curriculum, quizzes, assessments, diagnostics", "إنشاء دوراتك وامتلاكها بالكامل: المنهج والاختبارات والتقييمات والتشخيصات"),
            t("Publish, unpublish, archive and price your courses", "نشر دوراتك وإلغاء نشرها وأرشفتها وتسعيرها"),
            t("Grade attempts, regrade answers, and message your students", "تصحيح المحاولات وإعادة التصحيح ومراسلة طلابك"),
            t("Track revenue, analytics and learner progress", "تتبع الإيرادات والتحليلات وتقدم المتعلمين"),
        ],
        cant: [
            t("Edit other instructors' courses or publish without review", "تعديل دورات مدربين آخرين أو النشر دون مراجعة"),
            t("See other instructors' revenue or private learner data", "رؤية إيرادات مدربين آخرين أو بيانات المتعلمين الخاصة"),
            t("Change platform roles or access admin areas", "تغيير أدوار المنصة أو دخول مناطق الإدارة"),
        ],
        chaptersTitle: t("From draft to graded learners", "من المسودة إلى متعلمين مُقيَّمين"),
        chapters: [
            {
                title: t("1 · Build the course", "1 · بناء الدورة"),
                body: t(
                    "Start from Courses → New. Fill the basics, add artwork (URL or upload), set language, duration, visibility and pricing. The setup checklist tracks publish readiness live.",
                    "ابدأ من الدورات ← جديد. املأ الأساسيات وأضف الصور (رابط أو رفع) وحدد اللغة والمدة والظهور والتسعير. قائمة الإعداد تتبع جاهزية النشر مباشرة.",
                ),
                steps: [
                    t("Complete basics, media, and access sections", "أكمل أقسام الأساسيات والوسائط والوصول"),
                    t("Follow the setup checklist to 4/4 required steps", "اتبع قائمة الإعداد حتى 4/4 خطوات مطلوبة"),
                    t("Submit for review, then publish", "أرسل للمراجعة ثم انشر"),
                ],
                links: [{ label: t("My courses", "دوراتي"), to: "/instructor/courses" }],
            },
            {
                title: t("2 · Teach with curriculum and quizzes", "2 · درّس بالمنهج والاختبارات"),
                body: t(
                    "Structure sections and lessons, attach videos and documents, then add quiz checkpoints per section. Lessons unlock for learners in the order you set.",
                    "نظّم الأقسام والدروس وأرفق الفيديوهات والمستندات ثم أضف اختبارات لكل قسم. تُفتح الدروس للمتعلمين بالترتيب الذي تحدده.",
                ),
                steps: [
                    t("Add sections, then lessons with durations", "أضف الأقسام ثم الدروس مع المدد"),
                    t("Attach one video plus supporting files per lesson", "أرفق فيديو واحداً وملفات داعمة لكل درس"),
                    t("Publish section by section", "انشر قسماً فقسماً"),
                ],
                links: [{ label: t("Open lounge", "افتح الاستراحة"), to: "/instructor/lounge" }],
            },
            {
                title: t("3 · Assess, grade, earn", "3 · قيّم وصحّح واكسب"),
                body: t(
                    "Build final assessments from your question bank, link competencies, review manual answers, handle flagged attempts, and watch revenue and certificates on outcomes.",
                    "ابنِ التقييمات النهائية من بنك الأسئلة واربط الكفاءات وراجع الإجابات اليدوية وتعامل مع المحاولات المبلغ عنها وراقب الإيرادات والشهادات في النتائج.",
                ),
                steps: [
                    t("Create assessments with modes and attempt limits", "أنشئ تقييمات بأنماط وحدود محاولات"),
                    t("Grade the review queue and regrade fairly", "صحّح قائمة المراجعة وأعد التصحيح بعدل"),
                    t("Follow certificates and feedback on outcomes", "تابع الشهادات والآراء في النتائج"),
                ],
                links: [{ label: t("View revenue", "عرض الإيرادات"), to: "/instructor/revenue" }],
            },
        ],
        faqTitle: t("Instructor questions", "أسئلة المدربين"),
        faqs: [
            {
                q: t("Why can't I publish yet?", "لماذا لا أستطيع النشر بعد؟"),
                a: t(
                    "Publishing needs a title, description, duration, thumbnail, one section and one published lesson. The setup checklist shows exactly what's missing.",
                    "يتطلب النشر عنواناً ووصفاً ومدة وصورة مصغرة وقسماً واحداً ودرساً منشوراً واحداً. قائمة الإعداد توضح الناقص بدقة.",
                ),
            },
            {
                q: t("Can I upload videos directly?", "هل يمكنني رفع الفيديوهات مباشرة؟"),
                a: t(
                    "Yes — course artwork and preview video accept uploads up to 50 MB, or paste a URL. Lesson files upload from each lesson card.",
                    "نعم — صور الدورة وفيديو المعاينة تقبل الرفع حتى 50 ميغابايت أو لصق رابط. ملفات الدروس تُرفع من بطاقة كل درس.",
                ),
            },
            {
                q: t("How do certificates get issued?", "كيف تُصدر الشهادات؟"),
                a: t(
                    "Automatically when a learner passes your final assessment. You can follow every issuance on the outcomes page.",
                    "تلقائياً عند اجتياز المتعلم تقييمك النهائي. يمكنك متابعة كل إصدار في صفحة النتائج.",
                ),
            },
            {
                q: t("A learner disputes a grade?", "متعلم يعترض على درجة؟"),
                a: t(
                    "Open the assessment workspace, review the attempt, and regrade with feedback. Flagged attempts surface integrity signals.",
                    "افتح مساحة التقييم وراجع المحاولة وأعد التصحيح مع ملاحظات. المحاولات المبلغ عنها تُظهر مؤشرات النزاهة.",
                ),
            },
        ],
    },
    support: {
        badge: t("Agent handbook", "دليل الوكيل"),
        title: t("How support works", "كيف يعمل الدعم"),
        description: t(
            "Your role, rights and limits as a support agent — plus the exact ticket workflow, SLAs and escalation rules.",
            "دورك وحقوقك وحدودك كوكيل دعم — وسير عمل التذاكر الدقيق واتفاقيات الاستجابة وقواعد التصعيد.",
        ),
        rightsTitle: t("Your rights on the platform", "حقوقك على المنصة"),
        canTitle: t("You can", "يمكنك"),
        cantTitle: t("You cannot", "لا يمكنك"),
        can: [
            t("Reply to tickets, leave internal notes, assign, resolve and close", "الرد على التذاكر وترك ملاحظات داخلية والإسناد والحل والإغلاق"),
            t("Bulk resolve or close a whole page of tickets at once", "حلّ أو إغلاق صفحة كاملة من التذاكر دفعة واحدة"),
            t("Look up any student's enrollments, certificates and open tickets", "الاطلاع على تسجيلات أي طالب وشهاداته وتذاكره المفتوحة"),
            t("Save canned replies and tag tickets for faster triage", "حفظ ردود محفوظة ووسم التذاكر لفرز أسرع"),
            t("Escalate tickets upward to admins", "تصعيد التذاكر للأعلى إلى الإداريين"),
            t("Message admins and instructors directly", "مراسلة الإداريين والمدربين مباشرة"),
            t("Read admin announcements addressed to staff", "قراءة إعلانات الإدارة الموجهة للفريق"),
        ],
        cant: [
            t("Issue refunds, change roles, or open payments and commerce", "إصدار المبالغ المستردة أو تغيير الأدوار أو فتح المدفوعات"),
            t("Edit a student's account, enrollments or progress", "تعديل حساب طالب أو تسجيلاته أو تقدمه"),
            t("Message students directly — they reach you through tickets", "مراسلة الطلاب مباشرة — يصلون إليك عبر التذاكر"),
            t("Edit courses, quizzes or platform settings", "تعديل الدورات أو الاختبارات أو إعدادات المنصة"),
        ],
        chaptersTitle: t("The ticket workflow", "سير عمل التذاكر"),
        chapters: [
            {
                title: t("1 · Triage the queue", "1 · فرز القائمة"),
                body: t(
                    "Start on the dashboard: open, overdue and unassigned counts tell you where the fire is. Filter by status, grab unassigned work, and keep your own queue empty.",
                    "ابدأ من اللوحة: أعداد المفتوحة والمتأخرة وغير المسندة تدلك أين المشكلة. صفِّ حسب الحالة والتقط العمل غير المسند وحافظ على قائمتك فارغة.",
                ),
                steps: [
                    t("Check overdue and unassigned first", "تحقق من المتأخرة وغير المسندة أولاً"),
                    t("Assign to yourself before replying", "أسندها لنفسك قبل الرد"),
                    t("Use search to spot repeat issues", "استخدم البحث لرصد المشاكل المتكررة"),
                ],
                links: [{ label: t("Open queue", "افتح القائمة"), to: "/support-desk/tickets" }],
            },
            {
                title: t("2 · Resolve well", "2 · حلّ بإتقان"),
                body: t(
                    "Read the full thread, reply clearly, and use internal notes for context other agents need. Resolve only when the learner's problem is actually fixed — then close.",
                    "اقرأ السلسلة كاملة ورد بوضوح واستخدم الملاحظات الداخلية للسياق الذي يحتاجه الوكلاء الآخرون. لا تحسم إلا عند حل مشكلة المتعلم فعلاً — ثم أغلق.",
                ),
                steps: [
                    t("Reply with concrete next steps, not just acknowledgment", "رد بخطوات عملية لا مجرد إقرار"),
                    t("Log internal notes for handoffs", "سجّل ملاحظات داخلية للتسليم"),
                    t("Resolve, then close — never close an open problem", "احسم ثم أغلق — ولا تغلق مشكلة مفتوحة"),
                ],
                links: [{ label: t("My tickets", "تذاكري"), to: "/support-desk/my-tickets" }],
            },
            {
                title: t("3 · Escalate and coordinate", "3 · صعّد ونسّق"),
                body: t(
                    "Money, accounts and policy issues go up to admins with a note. Message instructors about course-content tickets, and watch announcements for staff decisions.",
                    "مشاكل المال والحسابات والسياسات تُصعَّد للإداريين مع ملاحظة. راسل المدربين بشأن تذاكر المحتوى وراقب الإعلانات لقرارات الفريق.",
                ),
                steps: [
                    t("Escalate refunds, suspensions and policy cases", "صعّد المبالغ والحسابات وقضايا السياسات"),
                    t("Always attach an escalation note", "أرفق دائماً ملاحظة تصعيد"),
                    t("Check Messages and Announcements daily", "تحقق من الرسائل والإعلانات يومياً"),
                ],
                links: [{ label: t("Messages", "الرسائل"), to: "/support-desk/messages" }],
            },
            {
                title: t("4 · Use the student directory", "4 · استخدم دليل الطلاب"),
                body: t(
                    "Before you guess why a learner is stuck, look them up. The directory shows enrollments, certificates and open tickets for any student — click through from a ticket's \"View student profile\" link.",
                    "قبل أن تخمّن سبب تعثر المتعلم، اطّلع عليه. الدليل يعرض التسجيلات والشهادات والتذاكر المفتوحة لأي طالب — انقر من رابط «عرض ملف الطالب» في التذكرة.",
                ),
                steps: [
                    t("Search by name or email from the Students page", "ابحث بالاسم أو البريد من صفحة الطلاب"),
                    t("Check enrollment progress before suggesting next steps", "تحقق من تقدم التسجيل قبل اقتراح الخطوات"),
                    t("Cross-reference open tickets to spot repeat issues", "قارن التذاكر المفتوحة لرصد المشاكل المتكررة"),
                ],
                links: [{ label: t("Student directory", "دليل الطلاب"), to: "/support-desk/students" }],
            },
            {
                title: t("5 · Move faster with desk tools", "5 · تسريع بأدوات المكتب"),
                body: t(
                    "Tick several tickets and resolve or close them in one action. Save your common answers as canned replies and drop them into the reply box. Tag tickets (billing, vip, bug) so the queue stays searchable as it grows.",
                    "حدّد عدة تذاكر واحلّها أو أغلقها بحركة واحدة. احفظ إجاباتك الشائعة كردود محفوظة وأدرجها في صندوق الرد. وسّم التذاكر (فوترة، مهم، خطأ) لتبقى القائمة قابلة للبحث مع نموها.",
                ),
                steps: [
                    t("Bulk-resolve a page of similar resolved tickets", "حلّ صفحة من تذاكر مماثلة دفعة واحدة"),
                    t("Save your top 5 answers as canned replies", "احفظ أهم 5 إجابات كردود محفوظة"),
                    t("Tag tickets so filters stay useful", "وسّم التذاكر لتبقى المرشّحات مفيدة"),
                ],
                links: [{ label: t("Open queue", "افتح القائمة"), to: "/support-desk/tickets" }],
            },
        ],
        faqTitle: t("Agent questions", "أسئلة الوكلاء"),
        faqs: [
            {
                q: t("A ticket needs a refund. What do I do?", "تذكرة تحتاج استرداد مبلغ. ماذا أفعل؟"),
                a: t(
                    "You can't refund — escalate to admin with an internal note summarizing the order and reason. Tell the learner it's with the billing team.",
                    "لا يمكنك الاسترداد — صعّد للإدارة مع ملاحظة داخلية تلخص الطلب والسبب. أخبر المتعلم أن الأمر لدى فريق الفوترة.",
                ),
            },
            {
                q: t("Can I message a student?", "هل يمكنني مراسلة طالب؟"),
                a: t(
                    "No. Students contact support through tickets so every exchange stays auditable. Reply inside the ticket thread instead.",
                    "لا. يتواصل الطلاب مع الدعم عبر التذاكر ليبقى كل تبادل قابلاً للتدقيق. رد داخل سلسلة التذكرة بدلاً من ذلك.",
                ),
            },
            {
                q: t("Ticket is really an admin decision?", "التذكرة قرار إداري فعلاً؟"),
                a: t(
                    "Escalate with context: what was tried, what the learner expects, and what you recommend. Don't leave it sitting in your queue.",
                    "صعّد مع السياق: ما جُرّب وما يتوقعه المتعلم وما توصي به. لا تتركها راكدة في قائمتك.",
                ),
            },
            {
                q: t("Where do staff announcements appear?", "أين تظهر إعلانات الفريق؟"),
                a: t(
                    "Under Announcements in your sidebar — the same inbox system, filtered to broadcasts addressed to you.",
                    "تحت الإعلانات في شريطك الجانبي — نفس نظام البريد مفلتراً على التعميمات الموجهة إليك.",
                ),
            },
        ],
    },
    admin: {
        badge: t("Operations manual", "دليل التشغيل"),
        title: t("How administration works", "كيف تعمل الإدارة"),
        description: t(
            "Your role, rights and hard limits as an administrator — plus the daily flows for people, content, money and trust.",
            "دورك وحقوقك وحدودك الصارمة كإداري — والتدفقات اليومية للأشخاص والمحتوى والمال والثقة.",
        ),
        rightsTitle: t("Your rights on the platform", "حقوقك على المنصة"),
        canTitle: t("You can", "يمكنك"),
        cantTitle: t("You cannot", "لا يمكنك"),
        can: [
            t("Manage users, students and instructors (except admin accounts)", "إدارة المستخدمين والطلاب والمدربين (عدا حسابات الإدارة)"),
            t("Moderate courses, enrollments, diagnostics and support tickets", "الإشراف على الدورات والتسجيلات والتشخيصات وتذاكر الدعم"),
            t("Run commerce: refunds, payouts, invoices, webhook replays", "إدارة التجارة: الاستردادات والمدفوعات والفواتير وإعادة تشغيل الويبهوك"),
            t("Broadcast announcements and monitor security, risk and system health", "بث الإعلانات ومراقبة الأمان والمخاطر وصحة النظام"),
        ],
        cant: [
            t("Touch the permission model (Roles page is Super Admin-only)", "المساس بنموذج الصلاحيات (صفحة الأدوار للمشرف العام فقط)"),
            t("Suspend, delete or re-role Admin and Super Admin accounts", "تعليق أو حذف أو تغيير دور حسابات الإدارة والمشرف العام"),
            t("Grant Admin or Super Admin roles to anyone", "منح دور الإدارة أو المشرف العام لأي شخص"),
        ],
        chaptersTitle: t("Daily operations", "العمليات اليومية"),
        chapters: [
            {
                title: t("1 · People and access", "1 · الأشخاص والوصول"),
                body: t(
                    "Keep accounts healthy: verify users, suspend abusers (never fellow admins), and assign Student, Instructor or Support roles. Privileged grants need a Super Admin.",
                    "حافظ على سلامة الحسابات: تحقق من المستخدمين وعلّق المسيئين (وليس الإداريين أبداً) وأسند أدوار طالب أو مدرب أو دعم. المنح المميزة تحتاج مشرفاً عاماً.",
                ),
                steps: [
                    t("Review new and flagged accounts under People", "راجع الحسابات الجديدة والمبلغ عنها تحت الأشخاص"),
                    t("Suspend abusers; escalate anything involving staff", "علّق المسيئين؛ وصعّد أي شيء يخص الفريق"),
                    t("Assign roles — Admin grants will be blocked", "أسند الأدوار — منح الإدارة ستُرفض"),
                ],
                links: [{ label: t("Open users", "افتح المستخدمين"), to: "/admin/users" }],
            },
            {
                title: t("2 · Content and commerce", "2 · المحتوى والتجارة"),
                body: t(
                    "Run the course review pipeline, then follow the money: orders, invoices, refunds and payouts. Failed webhooks replay from commerce — money movement is always audited.",
                    "أدر خط مراجعة الدورات ثم تابع المال: الطلبات والفواتير والاستردادات والمدفوعات. الويبهوك الفاشلة تُعاد من التجارة — وحركة المال مدققة دائماً.",
                ),
                steps: [
                    t("Approve or reject courses with reasons", "اقبل الدورات أو ارفضها بأسباب"),
                    t("Refund and pay out from commerce, never by hand", "استرد وادفع من التجارة وليس يدوياً"),
                    t("Replay failed webhooks before touching data", "أعد تشغيل الويبهوك الفاشلة قبل لمس البيانات"),
                ],
                links: [{ label: t("Open commerce", "افتح التجارة"), to: "/admin/commerce" }],
            },
            {
                title: t("3 · Trust and health", "3 · الثقة والصحة"),
                body: t(
                    "Watch security alerts and sessions, triage support escalations, review the audit trail, and broadcast clearly when the platform speaks.",
                    "راقب تنبيهات الأمان والجلسات وفرز تصعيدات الدعم وراجع سجل التدقيق وبث بوضوح عندما تتحدث المنصة.",
                ),
                steps: [
                    t("Clear security alerts and revoke hostile sessions", "صفِّ تنبيهات الأمان وأبطل الجلسات العدائية"),
                    t("Decide escalated tickets from support agents", "احسم التذاكر المصعدة من وكلاء الدعم"),
                    t("Check system health before announcing issues", "تحقق من صحة النظام قبل إعلان المشاكل"),
                ],
                links: [{ label: t("System health", "صحة النظام"), to: "/admin/system" }],
            },
        ],
        faqTitle: t("Admin questions", "أسئلة الإداريين"),
        faqs: [
            {
                q: t("Why can't I open the Roles page?", "لماذا لا أستطيع فتح صفحة الأدوار؟"),
                a: t(
                    "Role definitions shape the whole platform, so only Super Admins can view or change them. Your routes return 403 by design.",
                    "تعريفات الأدوار تشكّل المنصة كلها لذا لا يعرضها أو يغيرها إلا المشرفون العامون. مساراتك ترد 403 بالتصميم.",
                ),
            },
            {
                q: t("An admin account is compromised. What now?", "حساب إداري مخترق. ماذا الآن؟"),
                a: t(
                    "Don't touch it yourself — escalate to a Super Admin immediately, revoke its sessions from Security, and log the incident.",
                    "لا تلمسه بنفسك — صعّد لمشرف عام فوراً وأبطل جلساته من الأمان وسجّل الحادثة.",
                ),
            },
            {
                q: t("A payment webhook failed?", "فشل ويبهوك دفع؟"),
                a: t(
                    "Open commerce, inspect the event, and replay it. The handler is idempotent — already-processed events report back safely.",
                    "افتح التجارة وافحص الحدث وأعد تشغيله. المعالج آمن التكرار — الأحداث المعالجة تُبلَّغ بأمان.",
                ),
            },
            {
                q: t("When do I broadcast vs message?", "متى أبث ومتى أراسل؟"),
                a: t(
                    "Broadcast for platform-wide news to a role audience; message individuals for account-specific matters that need a reply thread.",
                    "ابث لأخبار المنصة لجمهور دور؛ وراسل الأفراد لأمور الحسابات التي تحتاج سلسلة رد.",
                ),
            },
        ],
    },
    sales: {
        badge: t("Sales handbook", "دليل المبيعات"),
        title: t("How sales works", "كيف تعمل المبيعات"),
        description: t(
            "Your role, rights and limits across growth — campaigns, merchandising, referrals, broadcasts, leads and visitor analytics.",
            "دورك وحقوقك وحدودك في النمو — الحملات والترويج والإحالات والبث والعملاء المحتملون وتحليلات الزوار.",
        ),
        rightsTitle: t("Your rights on the platform", "حقوقك على المنصة"),
        canTitle: t("You can", "يمكنك"),
        cantTitle: t("You cannot", "لا يمكنك"),
        can: [
            t("Create discount campaigns and validate codes at checkout", "إنشاء حملات الخصم والتحقق من الرموز عند الدفع"),
            t("Feature courses, run referral stats and broadcast to learners", "إبراز الدورات ومتابعة الإحالات والبث للمتعلمين"),
            t("Read leads, analytics, revenue and funnel data", "قراءة العملاء والتحليلات والإيرادات وبيانات التحويل"),
        ],
        cant: [
            t("Refund, pay out, or touch orders and payments", "استرداد المبالغ أو الدفع أو لمس الطلبات والمدفوعات"),
            t("Suspend users, change roles, or edit course content", "تعليق المستخدمين أو تغيير الأدوار أو تعديل محتوى الدورات"),
            t("Message staff privately or open security and system areas", "مراسلة الفريق على الخاص أو فتح مناطق الأمان والنظام"),
        ],
        chaptersTitle: t("Growing HBTronics", "تنمية HBTronics"),
        chapters: [
            {
                title: t("1 · Campaigns that convert", "1 · حملات تحوّل"),
                body: t(
                    "Create percent or fixed codes with windows and usage caps. Validate them before announcing, then watch used counts climb on paid orders.",
                    "أنشئ رموز نسبة أو مبلغ ثابت بنوافذ زمنية وحدود استخدام. تحقق منها قبل الإعلان ثم راقب عداد الاستخدام على الطلبات المدفوعة.",
                ),
                steps: [
                    t("Create the campaign with a memorable code", "أنشئ الحملة برمز سهل التذكر"),
                    t("Validate it, then announce via broadcast", "تحقق منه ثم أعلن عبر البث"),
                    t("Track used counts and revenue lift", "تتبع عداد الاستخدام ونمو الإيرادات"),
                ],
                links: [{ label: t("Open campaigns", "افتح الحملات"), to: "/marketing/campaigns" }],
            },
            {
                title: t("2 · Merchandise the homepage", "2 · رتّب الصفحة الرئيسية"),
                body: t(
                    "Featured slots decide which courses greet visitors on the landing showcase. Order them by campaign priority and keep the badge labels current.",
                    "مواضع الإبراز تحدد أي الدورات ترحّب بالزوار في الصفحة الرئيسية. رتبها حسب أولوية الحملة وابقِ شارات التمييز محدّثة.",
                ),
                steps: [
                    t("Pin the campaign course first", "ثبّت دورة الحملة أولاً"),
                    t("Refresh badge labels with each push", "حدّث شارات التمييز مع كل دفعة"),
                    t("Check the public landing after saving", "افحص الصفحة العامة بعد الحفظ"),
                ],
                links: [{ label: t("Open featured", "افتح الإبراز"), to: "/marketing/featured" }],
            },
            {
                title: t("3 · Prove it with data", "3 · أثبت بالأرقام"),
                body: t(
                    "Visitors, top pages, clicks, time on page, countries and the full funnel live under analytics. Every page view is tracked automatically once the tracker ships.",
                    "الزوار والصفحات والنقرات ومدة البقاء والدول ومسار التحويل الكامل تحت التحليلات. كل مشاهدة صفحة تُتتبع تلقائياً.",
                ),
                steps: [
                    t("Find drop-off between pricing views and signups", "اكتشف التسرب بين مشاهدة الأسعار والتسجيل"),
                    t("Double down on the top-converting pages", "ضاعف التركيز على الصفحات الأعلى تحويلاً"),
                    t("Target top countries with localized campaigns", "استهدف الدول الأعلى بحملات محلية"),
                ],
                links: [{ label: t("Open analytics", "افتح التحليلات"), to: "/marketing/analytics" }],
            },
            {
                title: t("4 · Turn visitors into learners", "4 · حوّل الزوار إلى متعلمين"),
                body: t(
                    "Capture emails before signup with the newsletter endpoint, work the leads inbox, and announce offers by broadcast while interest is hot.",
                    "التقط البريد قبل التسجيل عبر نقطة الاشتراك واعمل على صندوق العملاء وأعلن العروض بالبث ما دام الاهتمام حياً.",
                ),
                steps: [
                    t("Embed capture forms that send visitor_id", "ضمّن نماذج اشتراك ترسل معرّف الزائر"),
                    t("Work unread leads first, watch converted flags", "ابدأ بالعملاء غير المقروئين وراقب شارات التحويل"),
                    t("Broadcast the offer behind your best code", "ابث العرض المرتبط بأفضل رمز لديك"),
                ],
                links: [{ label: t("Open leads", "افتح العملاء"), to: "/marketing/leads" }],
            },
            {
                title: t("5 · Let referrals compound", "5 · دع الإحالات تتراكم"),
                body: t(
                    "Every learner carries an invite link worth XP. Ambassadors with 3+ invites are your cheapest channel — reward them and the loop keeps spinning.",
                    "كل متعلم يحمل رابط دعوة يساوي نقاط XP. السفراء بثلاث دعوات فأكثر هم قناتك الأرخص —كافئهم لتبقى الحلقة دائرة.",
                ),
                steps: [
                    t("Surface the invite link in broadcasts", "أبرز رابط الدعوة في رسائلك"),
                    t("Track invites and XP earned per cycle", "تتبع الدعوات والنقاط لكل دورة"),
                    t("Spot ambassadors and reward them early", "اكتشف السفراء وكافئهم مبكراً"),
                ],
                links: [{ label: t("Open referrals", "افتح الإحالات"), to: "/marketing/referrals" }],
            },
            {
                title: t("6 · Work the pipeline board", "6 · اعمل على لوحة خط الأنابيب"),
                body: t(
                    "Every lead has a stage, an owner, a heat score and a next follow-up. Drag cards between columns, log calls and notes, and let the browser-journey timeline tell you how warm the lead really is.",
                    "لكل عميل مرحلة ومسؤول ودرجة سخونة وموعد متابعة. اسحب البطاقات بين الأعمدة وسجّل المكالمة والملاحظات، ودَع خط سير الزائر يخبرك بحرارة العميل الحقيقية.",
                ),
                steps: [
                    t("Assign each new lead an owner the same day", "كلّف مسؤولًا لكل عميل جديد في نفس اليوم"),
                    t("Clear due and overdue follow-ups before noon", "أغلق المتابعات المستحقة والمتأخرة قبل الظهر"),
                    t("Score-qualify hot leads before proposing", "قيّم العملاء الساخنين قبل إرسال العرض"),
                ],
                links: [{ label: t("Open leads", "افتح العملاء"), to: "/marketing/leads" }],
            },
            {
                title: t("7 · Run it like a spreadsheet", "7 · أدِرها كورقة بيانات"),
                body: t(
                    "The Sales Sheet is your in-app spreadsheet: inline editing of stage, owner, follow-up and interest, CSV import for lists you already have, CSV export for anything else. The Customers tab shows who converted, from which source, and what they paid.",
                    "ورقة المبيعات جدولك الداخلي: تحرير مباشر للمرحلة والمسؤول والمتابعة، واستيراد CSV للقوائم الموجودة، وتصدير CSV لكل ما عداها. تبويب العملاء يعرض من حوّل ومن أي مصدر وما دفع.",
                ),
                steps: [
                    t("Import legacy lists, dedupe by email", "استورد القوائم القديمة مع منع التكرار بالبريد"),
                    t("Edit several leads in one sitting", "عدّل عدة عملاء في جلسة واحدة"),
                    t("Review customer sources before the next campaign", "راجع مصادر العملاء قبل الحملة القادمة"),
                ],
                links: [{ label: t("Open the sheet", "افتح الورقة"), to: "/marketing/sheet" }],
            },
            {
                title: t("8 · Automate and compete", "8 · أتمتة وتنافس"),
                body: t(
                    "Timed follow-up emails (day 1 thank-you, day 3 pricing nudge with a live coupon, day 7 social proof) run from marketing:lead-drip once enabled. The leaderboard tracks every rep's open leads, due follow-ups and monthly deal quota.",
                    "رسائل المتابعة المجدولة (شكر بعد يوم، تسعير بعد 3 أيام مع رمز فعّال، شهادة نجاح بعد 7 أيام) تعمل عبر marketing:lead-drip بعد تفعيلها. لوحة الفريق تتابع مفتوحات كل عضو ومتابعاته وحصته الشهرية.",
                ),
                steps: [
                    t("Set a monthly deal quota per rep", "حدّد حصة صفقات شهرية لكل عضو"),
                    t("Turn the drip on after reviewing the templates", "فعّل المتابعة بعد مراجعة القوالب"),
                    t("Coach from the leaderboard, not guesses", "درّب من اللوحة لا من التخمين"),
                ],
                links: [{ label: t("Open the dashboard", "افتح اللوحة"), to: "/marketing" }],
            },
        ],
        faqTitle: t("Sales questions", "أسئلة المبيعات"),
        faqs: [
            {
                q: t("Do discount codes apply automatically?", "هل تُطبق رموز الخصم تلقائياً؟"),
                a: t(
                    "No — shoppers type the code at checkout, which validates it live (window, usage cap, eligible courses) before reducing the total.",
                    "لا — يدخل المتسوق الرمز عند الدفع فيُتحقق منه مباشرة (النافذة الزمنية وحد الاستخدام والدورات المؤهلة) قبل خفض الإجمالي.",
                ),
            },
            {
                q: t("How are anonymous visitors identified?", "كيف يُعرَّف الزوار المجهولون؟"),
                a: t(
                    "Each browser gets a visitor_id. Emails captured from any form stitch to it, and registration links the whole history to the new account.",
                    "كل متصفح يحصل على معرّف زائر. البريد الملتقط من أي نموذج يرتبط به، والتسجيل يربط السجل الكامل بالحساب الجديد.",
                ),
            },
            {
                q: t("Can I see who opened a broadcast?", "هل أرى من فتح البث؟"),
                a: t(
                    "Broadcast history shows audience and timing today; per-recipient read receipts live in the admin announcements area.",
                    "سجل البث يعرض الجمهور والتوقيت اليوم؛ وإيصالات القراءة لكل مستلم في منطقة إعلانات الإدارة.",
                ),
            },
            {
                q: t("What happens to an abandoned checkout?", "ماذا يحدث لدفع متروك؟"),
                a: t(
                    "Orders pending past 24 hours trigger a daily recovery run: the learner is nudged once with a time-limited 10% code and a direct checkout link.",
                    "الطلبات المعلّقة منذ 24 ساعة تُشغّل عملية استرداد يومية: يُنبَّه المتعلم مرة واحدة برمز خصم 10% محدود ورابط دفع مباشر.",
                ),
            },
        ],
    },
};

export const superAdminChapter = {
    title: t("Super Admin · Governance", "المشرف العام · الحوكمة"),
    body: t(
        "You hold every grant on the platform: the full admin surface plus the permission model, admin accounts, and the governance dashboard (staff, escalations, failed webhooks, privileged audit trail).",
        "تملك كل الصلاحيات على المنصة: كامل سطح الإدارة، إضافة إلى نموذج الصلاحيات وحسابات الإدارة ولوحة الحوكمة (الفريق والتصعيدات والويبهوك الفاشلة وسجل التدقيق المميز).",
    ),
    steps: [
        t("Manage Roles: definitions and permission grants", "أدر الأدوار: التعريفات ومنح الصلاحيات"),
        t("Manage admin accounts other admins cannot touch", "أدر حسابات الإدارة التي لا يلمسها غيرك"),
        t("Clear escalations and failed webhooks first", "صفِّ التصعيدات والويبهوك الفاشلة أولاً"),
    ],
    links: [{ label: t("Open roles", "افتح الأدوار"), to: "/admin/roles" }],
};

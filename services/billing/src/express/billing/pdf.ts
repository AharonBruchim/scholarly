import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import type { PaymentLineItem } from './model';

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let cachedBackground: string | null | undefined;

function paymentBackground(): string | undefined {
    if (cachedBackground !== undefined) return cachedBackground ?? undefined;
    const imagePath =
        process.env.PAYMENT_PDF_BACKGROUND_PATH ??
        fileURLToPath(new URL('../../../../../apps/web-client/public/background_pdf.png', import.meta.url));
    try {
        cachedBackground = `data:image/png;base64,${readFileSync(imagePath).toString('base64')}`;
    } catch {
        cachedBackground = null;
    }
    return cachedBackground ?? undefined;
}

async function renderPdf(html: string): Promise<Buffer> {
    const browser = await chromium.launch({
        executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });
        return Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));
    } finally {
        await browser.close();
    }
}

export async function generatePaymentRequestPdf(input: {
    teacherName: string;
    studentName: string;
    period: string;
    requestNumber: string;
    source: 'automatic' | 'manual';
    notes?: string;
    bank: { bankName: string; branchNumber: string; accountNumber: string };
    lines: PaymentLineItem[];
    total: number;
}): Promise<Buffer> {
    const rows = input.lines
        .map(
            (line) =>
                `<tr><td>${line.date ? new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(line.date) : '—'}</td><td>${escapeHtml(line.subject)}</td><td>${line.durationMinutes ? `${line.durationMinutes} דק׳` : '—'}</td><td>${line.kind === 'late_cancellation' ? 'ביטול מאוחר' : line.kind === 'custom' ? 'סעיף נוסף' : 'שיעור'}</td><td>${line.amount.toFixed(2)} ₪</td></tr>`,
        )
        .join('');
    const lessonCount = input.lines.filter((line) => line.kind !== 'custom').length;
    const generatedAt = new Intl.DateTimeFormat('he-IL', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jerusalem',
    }).format(new Date());
    const periodLabel = input.source === 'automatic' ? `תקופה ${escapeHtml(input.period)}` : 'דרישה ידנית';
    const notes = input.notes ? `<div class="notes"><strong>הערות:</strong> ${escapeHtml(input.notes)}</div>` : '';
    const background = paymentBackground();
    const backgroundStyle = background
        ? `background-image:linear-gradient(180deg,rgba(255,255,255,.97) 0%,rgba(255,252,245,.94) 48%,rgba(255,248,234,.68) 100%),url('${background}');`
        : '';
    const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>
        @page{size:A4;margin:14mm}
        *{box-sizing:border-box}
        body{margin:0;font-family:Arial,"Noto Sans Hebrew",sans-serif;color:#2b1a12;background:#f8f0df}
        main{min-height:269mm;padding:12mm;border:1px solid rgba(120,75,38,.28);border-radius:18px;${backgroundStyle}background-color:#fffdf8;background-position:center;background-size:cover;background-repeat:no-repeat;box-shadow:0 8px 30px rgba(73,42,23,.12)}
        header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;border-bottom:3px solid #a45f2a;padding-bottom:16px}
        .brand{font-size:13px;font-weight:700;letter-spacing:2px;color:#9a5a2a}.title{margin:4px 0 0;font-size:31px;color:#4c2d1b}.number{border:1px solid #d6b48d;border-radius:999px;padding:8px 14px;background:#fff8ed;font-size:13px;font-weight:700;white-space:nowrap}
        .meta{margin-top:14px;color:#6b4a36;font-size:14px}.meta strong{color:#3c2418}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.stats>div{padding:11px;border:1px solid #eadcca;border-radius:10px;background:rgba(255,255,255,.82);font-size:12px}.stats strong{display:block;color:#70401f;margin-bottom:3px}
        table{width:100%;border-collapse:separate;border-spacing:0;margin-top:24px;overflow:hidden;border:1px solid #dfc9ae;border-radius:12px;background:rgba(255,255,255,.86)}
        th,td{padding:10px 9px;border-bottom:1px solid #eadcca;text-align:right;font-size:12px}th{background:#f2dfc4;color:#4c2d1b;font-weight:700}tbody tr:last-child td{border-bottom:0}tbody tr:nth-child(even){background:rgba(250,241,226,.7)}
        .summary{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding:16px 18px;border-radius:14px;background:#4c2d1b;color:#fff}.summary-label{font-size:14px}.total{font-size:25px;font-weight:800}
        .details{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}.bank,.notes{padding:15px;border:1px solid #dfc9ae;border-radius:12px;background:rgba(255,250,241,.9);font-size:13px;line-height:1.8}.notes{white-space:pre-wrap}.details strong{color:#70401f}
        footer{margin-top:24px;padding-top:12px;border-top:1px solid #dfc9ae;color:#806854;font-size:11px;text-align:center}
    </style></head><body><main><header><div><div class="brand">SCHOLARLY</div><h1 class="title">דרישת תשלום</h1></div><div class="number">מס׳ ${escapeHtml(input.requestNumber)}</div></header><div class="meta"><strong>${escapeHtml(input.teacherName)}</strong> · עבור ${escapeHtml(input.studentName)} · ${periodLabel}</div><div class="stats"><div><strong>תאריך הפקה</strong>${escapeHtml(generatedAt)}</div><div><strong>מספר תלמידות</strong>1</div><div><strong>מספר שיעורים</strong>${lessonCount}</div></div><table><thead><tr><th>מועד</th><th>פירוט</th><th>משך</th><th>סוג</th><th>סכום</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><span class="summary-label">סה״כ לתשלום</span><span class="total">${input.total.toFixed(2)} ₪</span></div><div class="details"><div class="bank"><strong>פרטי העברה בנקאית</strong><br>בנק: ${escapeHtml(input.bank.bankName)}<br>סניף: ${escapeHtml(input.bank.branchNumber)}<br>חשבון: ${escapeHtml(input.bank.accountNumber)}</div>${notes || '<div class="notes"><strong>הערות</strong><br>—</div>'}</div><footer>מסמך זה הוא דרישת תשלום ואינו חשבונית מס או קבלה.</footer></main></body></html>`;
    return renderPdf(html);
}

export async function generateLessonMessagePdf(input: {
    teacherName: string;
    teacherEmail: string;
    teacherPhone?: string;
    bank?: { bankName: string; branchNumber: string; accountNumber: string };
    studentName: string;
    studentEmail: string;
    studentPhone?: string;
    subject: string;
    message: string;
    lessons: Array<{
        subject: string;
        startTime: Date;
        durationMinutes: number;
        price: number;
        status: 'available' | 'scheduled' | 'completed' | 'cancelled';
    }>;
}): Promise<Buffer> {
    const gregorianDate = (date: Date) =>
        new Intl.DateTimeFormat('he-IL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(date);
    const hebrewDate = (date: Date) => new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { dateStyle: 'long', timeZone: 'Asia/Jerusalem' }).format(date);
    const rows = input.lessons
        .map(
            (lesson) =>
                `<tr><td>${escapeHtml(gregorianDate(lesson.startTime))}<br><span class="hebrew-date">${escapeHtml(hebrewDate(lesson.startTime))}</span></td><td>${escapeHtml(lesson.subject)}</td><td>${lesson.durationMinutes} דק׳</td><td>${lesson.price.toFixed(2)} ₪</td><td>${lesson.status === 'cancelled' ? 'בוטל' : lesson.status === 'completed' ? 'התקיים' : 'נקבע'}</td></tr>`,
        )
        .join('');
    const total = input.lessons.reduce((sum, lesson) => sum + lesson.price, 0);
    const teacherPhone = input.teacherPhone ? ` · ${escapeHtml(input.teacherPhone)}` : '';
    const studentPhone = input.studentPhone ? ` · ${escapeHtml(input.studentPhone)}` : '';
    const bank = input.bank
        ? `<div class="bank"><strong>פרטי העברה בנקאית</strong><br>בנק: ${escapeHtml(input.bank.bankName)}<br>סניף: ${escapeHtml(input.bank.branchNumber)}<br>חשבון: ${escapeHtml(input.bank.accountNumber)}</div>`
        : '';
    const background = paymentBackground();
    const backgroundStyle = background
        ? `background-image:linear-gradient(180deg,rgba(255,255,255,.97) 0%,rgba(255,252,245,.94) 48%,rgba(255,248,234,.68) 100%),url('${background}');`
        : '';
    const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><style>
        @page{size:A4;margin:14mm}
        *{box-sizing:border-box}
        body{margin:0;font-family:Arial,"Noto Sans Hebrew",sans-serif;color:#2b1a12;background:#f8f0df}
        main{min-height:269mm;padding:12mm;border:1px solid rgba(120,75,38,.28);border-radius:18px;${backgroundStyle}background-color:#fffdf8;background-position:center;background-size:cover;background-repeat:no-repeat;box-shadow:0 8px 30px rgba(73,42,23,.12)}
        header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;border-bottom:3px solid #a45f2a;padding-bottom:16px}
        .brand{font-size:13px;font-weight:700;letter-spacing:2px;color:#9a5a2a}.title{margin:4px 0 0;font-size:31px;color:#4c2d1b}.date{border:1px solid #d6b48d;border-radius:999px;padding:8px 14px;background:#fff8ed;font-size:13px;font-weight:700;white-space:nowrap}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;color:#6b4a36;font-size:13px}.meta>div{padding:12px;border:1px solid #eadcca;border-radius:10px;background:rgba(255,255,255,.82)}.meta strong{color:#3c2418}.message{margin-top:20px;padding:16px;border:1px solid #dfc9ae;border-radius:12px;background:rgba(255,250,241,.9);font-size:14px;line-height:1.8;white-space:pre-wrap}.message h2{margin:0 0 8px;color:#4c2d1b}.hebrew-date{color:#806854;font-size:11px}
        table{width:100%;border-collapse:separate;border-spacing:0;margin-top:24px;overflow:hidden;border:1px solid #dfc9ae;border-radius:12px;background:rgba(255,255,255,.86)}
        th,td{padding:10px 9px;border-bottom:1px solid #eadcca;text-align:right;font-size:12px}th{background:#f2dfc4;color:#4c2d1b;font-weight:700}tbody tr:last-child td{border-bottom:0}tbody tr:nth-child(even){background:rgba(250,241,226,.7)}
        .summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.summary>div,.bank{padding:14px;border:1px solid #dfc9ae;border-radius:12px;background:rgba(255,250,241,.9);font-size:13px;line-height:1.8}.summary strong,.bank strong{color:#70401f}.bank{margin-top:14px}
        footer{margin-top:24px;padding-top:12px;border-top:1px solid #dfc9ae;color:#806854;font-size:11px;text-align:center}
    </style></head><body><main><header><div><div class="brand">SCHOLARLY</div><h1 class="title">סיכום שיעורים</h1></div><div class="date">הופק: ${escapeHtml(gregorianDate(new Date()))}</div></header><div class="meta"><div><strong>מאת</strong><br>${escapeHtml(input.teacherName)}<br>${escapeHtml(input.teacherEmail)}${teacherPhone}</div><div><strong>עבור</strong><br>${escapeHtml(input.studentName)}<br>${escapeHtml(input.studentEmail)}${studentPhone}</div></div><div class="message"><h2>${escapeHtml(input.subject)}</h2>${escapeHtml(input.message)}</div><table><thead><tr><th>מועד לועזי ועברי</th><th>נושא</th><th>משך</th><th>מחיר</th><th>סטטוס</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div><strong>מספר שיעורים</strong><br>${input.lessons.length}</div><div><strong>סה״כ שווי השיעורים</strong><br>${total.toFixed(2)} ₪</div></div>${bank}<footer>המסמך מרכז את גוף ההודעה ואת מלוא פרטי השיעורים שנבחרו ונשלח באמצעות Scholarly.</footer></main></body></html>`;
    return renderPdf(html);
}

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const supportedLanguages = ["he", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const LANGUAGE_STORAGE_KEY = "scholarly.language";

const resources = {
  he: {
    translation: {
      common: {
        brand: "Scholarly",
        login: "התחברות",
        register: "הרשמה",
        logout: "התנתקות",
        loading: "בטעינה",
        retry: "ניסיון נוסף",
        notAvailable: "לא זמין",
        none: "אין",
        language: "שפה",
        switchToEnglish: "Switch to English",
      },
      auth: {
        loginTitle: "ברוכים השבים",
        loginDescription: "גישה ללוח הלימודים ולשיעורים שלך.",
        email: "אימייל",
        password: "סיסמה",
        emailPlaceholder: "you@example.com",
        passwordPlaceholder: "••••••••",
        signingIn: "מתחבר...",
        loginFailed: "ההתחברות נכשלה.",
        needAccount: "אין לך חשבון?",
        createAccount: "יצירת חשבון",
        registerTitle: "יצירת חשבון",
        registerDescription: "הרשמה כמורה או כתלמיד",
        role: "תפקיד",
        student: "תלמיד",
        teacher: "מורה",
        firstName: "שם פרטי",
        lastName: "שם משפחה",
        phone: "מספר טלפון",
        firstNamePlaceholder: "ישראל",
        lastNamePlaceholder: "ישראלי",
        passwordRequirement: "לפחות 8 תווים",
        whatsappConsent: "אני מאשר/ת קבלת הודעות ב־WhatsApp",
        smsConsent: "אני מאשר/ת קבלת הודעות SMS",
        bankDetails: "פרטי חשבון בנק (למורים)",
        bankName: "שם הבנק",
        branchNumber: "מספר סניף",
        accountNumber: "מספר חשבון",
        creatingAccount: "יוצר חשבון...",
        registerFailed: "ההרשמה נכשלה.",
        haveAccount: "כבר יש לך חשבון?",
      },
      dashboard: {
        studentLabel: "לוח תלמיד",
        studentTitle: "הלמידה שלי",
        teacherLabel: "לוח מורה",
        teacherTitle: "סקירה כללית",
        subjects: "נושאי לימוד",
        subjectsDescription: "נושאים משיעורים שלא בוטלו",
        scheduledLessons: "שיעורים קרובים",
        scheduledDescription: "שיעורים מתוכננים מהיום והלאה",
        students: "תלמידים",
        studentsDescription: "תלמידים ייחודיים בשיעורים",
        nextLesson: "השיעור הבא",
        noUpcomingLesson: "אין שיעור עתידי",
        nextLessonWithSubject: "{{subject}} · {{date}}",
        loadErrorTitle: "לא הצלחנו לטעון את נתוני השיעורים",
        loadErrorDescription: "בדקו ששירות השיעורים וה־gateway פועלים ונסו שוב.",
        bankPromptTitle: "השלמת פרטי חשבון הבנק",
        bankPromptDescription: "יש להוסיף חשבון בנק כדי לקבל תשלומים כמורה.",
        bankName: "שם הבנק",
        branchNumber: "מספר סניף",
        accountNumber: "מספר חשבון",
        saveBankDetails: "שמירת פרטי הבנק",
        savingBankDetails: "שומר...",
        bankSaveFailed: "שמירת פרטי הבנק נכשלה. נסו שוב.",
      },
      error: {
        title: "משהו השתבש",
        description: "אפשר לרענן את הדף או לנסות שוב מאוחר יותר.",
        refresh: "רענון",
      },
      contacts: {
        title: "אנשי קשר",
        empty: "לא נמצאו אנשי קשר.",
        loadError: "טעינת אנשי הקשר נכשלה.",
        add: "הוספת איש קשר",
      },
      validation: {
        email: "נא להזין כתובת אימייל תקינה.",
        passwordRequired: "חובה להזין סיסמה.",
        passwordTooLong: "הסיסמה ארוכה מדי.",
        phone: "מספר הטלפון אינו תקין.",
        firstNameRequired: "חובה להזין שם פרטי.",
        lastNameRequired: "חובה להזין שם משפחה.",
        passwordMinLength: "הסיסמה חייבת להכיל לפחות 8 תווים.",
        bankNameRequired: "חובה להזין שם בנק.",
        branchNumberRequired: "חובה להזין מספר סניף.",
        accountNumberRequired: "חובה להזין מספר חשבון.",
      },
    },
  },
  en: {
    translation: {
      common: {
        brand: "Scholarly",
        login: "Login",
        register: "Register",
        logout: "Logout",
        loading: "Loading",
        retry: "Try again",
        notAvailable: "Not available",
        none: "None",
        language: "Language",
        switchToEnglish: "עברית",
      },
      auth: {
        loginTitle: "Welcome back",
        loginDescription: "Access your learning dashboard and lessons.",
        email: "Email",
        password: "Password",
        emailPlaceholder: "you@example.com",
        passwordPlaceholder: "••••••••",
        signingIn: "Signing in...",
        loginFailed: "Login failed.",
        needAccount: "Need an account?",
        createAccount: "Create one",
        registerTitle: "Create an account",
        registerDescription: "Register as a teacher or student",
        role: "Role",
        student: "Student",
        teacher: "Teacher",
        firstName: "First name",
        lastName: "Last name",
        phone: "Phone number",
        firstNamePlaceholder: "Jane",
        lastNamePlaceholder: "Doe",
        passwordRequirement: "At least 8 characters",
        whatsappConsent: "I agree to receive WhatsApp messages",
        smsConsent: "I agree to receive SMS messages",
        bankDetails: "Bank account details (teachers)",
        bankName: "Bank name",
        branchNumber: "Branch number",
        accountNumber: "Account number",
        creatingAccount: "Creating account...",
        registerFailed: "Registration failed.",
        haveAccount: "Already have an account?",
      },
      dashboard: {
        studentLabel: "Student dashboard",
        studentTitle: "My learning",
        teacherLabel: "Teacher dashboard",
        teacherTitle: "Overview",
        subjects: "Subjects",
        subjectsDescription: "Subjects from non-cancelled lessons",
        scheduledLessons: "Upcoming lessons",
        scheduledDescription: "Scheduled lessons from today onward",
        students: "Students",
        studentsDescription: "Unique students across lessons",
        nextLesson: "Next lesson",
        noUpcomingLesson: "No upcoming lesson",
        nextLessonWithSubject: "{{subject}} · {{date}}",
        loadErrorTitle: "We couldn't load lesson data",
        loadErrorDescription:
          "Check that the lessons service and gateway are running, then try again.",
        bankPromptTitle: "Complete your bank details",
        bankPromptDescription: "Add your bank account to receive teacher payouts.",
        bankName: "Bank name",
        branchNumber: "Branch number",
        accountNumber: "Account number",
        saveBankDetails: "Save bank details",
        savingBankDetails: "Saving...",
        bankSaveFailed: "Couldn't save the bank details. Please try again.",
      },
      error: {
        title: "Something went wrong",
        description: "Please refresh the page or try again later.",
        refresh: "Refresh",
      },
      contacts: {
        title: "Contacts",
        empty: "No contacts found.",
        loadError: "Couldn't load contacts.",
        add: "Add contact",
      },
      validation: {
        email: "Please enter a valid email address.",
        passwordRequired: "Password is required.",
        passwordTooLong: "Password is too long.",
        phone: "Please enter a valid phone number.",
        firstNameRequired: "First name is required.",
        lastNameRequired: "Last name is required.",
        passwordMinLength: "Password must be at least 8 characters long.",
        bankNameRequired: "Bank name is required.",
        branchNumberRequired: "Branch number is required.",
        accountNumberRequired: "Account number is required.",
      },
    },
  },
} as const;

function readInitialLanguage(): SupportedLanguage {
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "en" || savedLanguage === "he" ? savedLanguage : "he";
}

function syncDocumentLanguage(language: string) {
  const normalizedLanguage: SupportedLanguage = language.startsWith("en") ? "en" : "he";
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = normalizedLanguage === "he" ? "rtl" : "ltr";
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: readInitialLanguage(),
  fallbackLng: "he",
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
  initAsync: false,
});

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;

/* ==========================================================================
   MAX SYSTEM — الإعدادات المركزية / Central settings
   عدّل هذا الملف فقط لإضافة أرقام التواصل والسوشيال. أي حقل فارغ يظل مخفيًا في الموقع.
   Edit only this file to add contacts & social links. Empty fields stay hidden.
   ========================================================================== */
window.MAXSYSTEM = {
  contact: {
    // أرقام واتساب — اكتبها بالصيغة الدولية بدون + أو مسافات. مثال: '9665XXXXXXXX' و '201XXXXXXXXX'
    // WhatsApp numbers in international format, digits only.
    whatsapp: [
      { id: 'sa', label: { ar: 'السعودية', en: 'Saudi Arabia' }, number: '' },
      { id: 'eg', label: { ar: 'مصر', en: 'Egypt' }, number: '' }
    ],
    // أرقام الاتصال (يمكن كتابتها بأي تنسيق) / Call numbers (any format)
    phone: [
      { id: 'sa', label: { ar: 'السعودية', en: 'Saudi Arabia' }, number: '' },
      { id: 'eg', label: { ar: 'مصر', en: 'Egypt' }, number: '' }
    ],
    email: '',
    address: { ar: '', en: '' },
    hours: { ar: '', en: '' },
    whatsappMessage: {
      ar: 'مرحبًا ماكس سيستم، أريد الاستفسار عن خدماتكم.',
      en: 'Hello MAX SYSTEM, I would like to ask about your services.'
    }
  },

  // روابط كاملة تبدأ بـ https:// / full URLs
  social: { facebook: '', instagram: '', linkedin: '', x: '', youtube: '', tiktok: '', snapchat: '' },

  form: {
    // خدمة استقبال النماذج (Formspree / Web3Forms / ...). اتركه فارغًا ليتحول النموذج لواتساب.
    // Form endpoint. Leave empty to fall back to WhatsApp.
    endpoint: '',
    accessKey: '',   // لـ Web3Forms فقط / Web3Forms only
    minFillMs: 3000
  },

  // معرّفات التحليلات — لا تُحمَّل إلا بعد موافقة الزائر / loaded only after consent
  analytics: { gtmId: '', ga4Id: '', metaPixelId: '' }
};

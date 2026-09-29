/* ==========================================================================
   ai.js — واجهة ميزات الذكاء الاصطناعي في المتصفح
   --------------------------------------------------------------------------
   كل التحليل يتم في Edge Function "ai" على الخادم (المفتاح لا يصل للمتصفح أبداً).
   هنا فقط: تجهيز الصورة، التعرف على الصوت من المتصفح، واستدعاء الخادم.
   كشف التكرار حساب جغرافي في قاعدة البيانات (بدون ذكاء اصطناعي).
   أي فشل هنا لا يوقف النظام: المواطن يستطيع دائماً إكمال البلاغ يدوياً.
   ========================================================================== */

const AI = {
  // استدعاء Edge Function وتحويل أخطائها لرسالة عربية
  async call(action, payload = {}) {
    let res
    try {
      res = await sb.functions.invoke('ai', { body: { action, ...payload } })
    } catch (e) {
      throw new AppError('تعذر الاتصال بخدمة الذكاء الاصطناعي.', { kind: 'network', original: e })
    }
    if (res.error) {
      let msg = ''
      try {
        msg = (await res.error.context.json()).error
      } catch {
        /* رد غير JSON */
      }
      if (!msg && /Failed to send|fetch/i.test(res.error.message || '')) msg = 'خدمة الذكاء الاصطناعي غير متاحة حالياً (لم يتم نشرها بعد).'
      throw new AppError(msg || 'تعذر تحليل البلاغ بالذكاء الاصطناعي. يمكنك إكماله يدوياً.', { kind: 'server', original: res.error })
    }
    return res.data
  },

  // تصغير الصورة قبل الإرسال (أسرع وأقل استهلاكاً، ويبقى أقل من حد 5MB)
  async compressImage(file, maxSide = 1600, quality = 0.82) {
    const bmp = await createImageBitmap(file).catch(() => null)
    if (!bmp) return file
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (!blob) return file
    return new File([blob], (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  },

  toBase64: (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result).split(',')[1])
      r.onerror = reject
      r.readAsDataURL(file)
    }),

  async analyzeImage(file, hint = '') {
    return AI.call('analyze_image', { image: await AI.toBase64(file), mime_type: file.type, hint })
  },
  analyzeText: (text) => AI.call('analyze_text', { text }),

  /* ---------- كشف البلاغات المكررة (قاعدة البيانات) ---------- */
  nearby: (lat, lng, categoryId) => run(sb.rpc('find_nearby_complaints', { p_lat: lat, p_lng: lng, p_category: categoryId || null })),
  confirmDuplicate: (complaintId, lat, lng, comment) => run(sb.rpc('confirm_duplicate', { p_complaint: complaintId, p_lat: lat, p_lng: lng, p_comment: comment || null })),
  linkAnalysis: (analysisId, complaintId) => run(sb.rpc('link_ai_analysis', { p_analysis: analysisId, p_complaint: complaintId })),

  /* ---------- الإدخال الصوتي (من المتصفح — مجاني وبدون مفتاح) ---------- */
  speechSupported: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),

  // يبدأ الاستماع ويعيد دالة الإيقاف. onText تُستدعى بالنص المتراكم.
  listen({ onText, onEnd, onError }) {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new Rec()
    rec.lang = 'ar-JO'
    rec.interimResults = true
    rec.continuous = true
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      onText((finalText + interim).trim())
    }
    rec.onerror = (e) => {
      const map = { 'not-allowed': 'لم يتم السماح باستخدام الميكروفون.', 'no-speech': 'لم يتم التقاط أي كلام، حاول مجدداً.', network: 'التعرف على الصوت يحتاج اتصالاً بالإنترنت.' }
      onError?.(map[e.error] || 'تعذر التعرف على الصوت. يمكنك الكتابة بدلاً من ذلك.')
    }
    rec.onend = () => onEnd?.()
    rec.start()
    return () => rec.stop()
  },
}

const URGENCY_LABELS = { low: 'منخفضة', medium: 'متوسطة', high: 'مرتفعة', urgent: 'عاجلة' }

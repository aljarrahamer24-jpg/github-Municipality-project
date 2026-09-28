/* ==========================================================================
   app.js — تشغيل الصفحة: التحقق من الجلسة والدور، بناء التخطيط، الإشعارات
   --------------------------------------------------------------------------
   كل صفحة تستدعي:
     App.page({ roles: ['citizen'] }, async ({ profile }) => { ... })
   roles:     الأدوار المسموح لها بالصفحة (بدونها = صفحة عامة)
   guestOnly: للصفحات مثل تسجيل الدخول (يُحوَّل المستخدم المسجل للوحته)
   ملاحظة: إخفاء الصفحات هنا لتجربة المستخدم فقط — الحماية الحقيقية في RLS.
   ========================================================================== */

const HOME_BY_ROLE = { citizen: 'citizen/index.html', employee: 'employee/index.html', admin: 'admin/index.html' }

const App = {
  user: null,
  profile: null,
  _leaving: false,

  homeUrl: (role) => url(HOME_BY_ROLE[role] || 'index.html'),

  go(path) {
    this._leaving = true
    location.href = path
  },

  sessionExpired() {
    if (this._leaving || !document.body.dataset.roles) return
    this.go(url('auth/login.html?reason=expired'))
  },

  async signOut() {
    this._leaving = true
    try {
      await sb.auth.signOut()
    } catch {
      /* تجاهل — نحذف الجلسة المحلية على أي حال */
    }
    location.href = url('auth/login.html?reason=logout')
  },

  async loadProfile(userId) {
    return run(sb.from('profiles').select('*, department:departments(id, name)').eq('id', userId).maybeSingle())
  },

  async page({ roles = null, guestOnly = false } = {}, init = async () => {}) {
    if (document.readyState === 'loading') await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }))
    const content = $('#content')
    const layout = document.body.dataset.layout

    if (!sb) return this.renderConfigError()

    try {
      const { data } = await sb.auth.getSession()
      const session = data.session
      this.user = session?.user || null

      if (roles) {
        document.body.dataset.roles = roles.join(',')
        if (!session) return this.go(url('auth/login.html?reason=login'))
        this.profile = await this.loadProfile(session.user.id)
        if (!this.profile) throw new AppError('تعذر العثور على ملف المستخدم. تواصل مع إدارة النظام.', { kind: 'permission' })
        if (!this.profile.is_active) {
          await sb.auth.signOut()
          return this.go(url('auth/login.html?reason=inactive'))
        }
        if (!roles.includes(this.profile.role)) return this.go(this.homeUrl(this.profile.role) + '?reason=forbidden')
      } else if (session) {
        this.profile = await this.loadProfile(session.user.id).catch(() => null)
        if (guestOnly && this.profile?.is_active) return this.go(this.homeUrl(this.profile.role))
      }
    } catch (err) {
      Layout.mount(layout, content, null)
      document.body.classList.add('app-ready')
      showError(content, err, () => location.reload())
      return
    }

    // حدود رفع الصور من إعدادات النظام (إن وُجدت)
    if (this.profile) {
      const cfg = await API.settings().catch(() => null)
      if (cfg?.complaints) {
        APP_CONFIG.MAX_IMAGES = Number(cfg.complaints.max_images) || APP_CONFIG.MAX_IMAGES
        APP_CONFIG.MAX_IMAGE_MB = Math.min(5, Number(cfg.complaints.max_image_mb) || APP_CONFIG.MAX_IMAGE_MB)
      }
    }

    Layout.mount(layout, content, this.profile)
    renderIcons()
    initPasswordToggles()
    initUploads()
    initTabs()
    document.body.classList.add('app-ready')
    this.showReason()

    if (this.profile) {
      Notifications.start(this.profile)
      // إذا انتهت الجلسة أو سُجّل الخروج من تبويب آخر
      sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT' && roles && !this._leaving) this.sessionExpired()
      })
    }

    try {
      await init({ profile: this.profile, user: this.user })
      renderIcons()
    } catch (err) {
      console.error(err)
      showError(content, err, () => location.reload())
    }
  },

  // رسائل عند التحويل (?reason=...)
  showReason() {
    const reason = getParam('reason')
    const messages = {
      forbidden: ['ليس لديك صلاحية للوصول إلى تلك الصفحة، تم تحويلك إلى لوحتك.', 'error'],
      expired: ['انتهت الجلسة، يرجى تسجيل الدخول من جديد.', 'error'],
      login: ['يرجى تسجيل الدخول للمتابعة.', 'info'],
      inactive: ['تم إيقاف هذا الحساب. تواصل مع إدارة البلدية.', 'error'],
      logout: ['تم تسجيل الخروج بنجاح.', 'success'],
    }
    if (messages[reason]) {
      toast(...messages[reason])
      history.replaceState(null, '', location.pathname + location.hash)
    }
  },

  renderConfigError() {
    document.body.classList.add('app-ready')
    $('#content').outerHTML = `<main id="content" class="container section">
      <div class="card" style="max-width:640px;margin:40px auto"><div class="card-body stack text-center">
        <span class="icon-box lg round box-warning" style="margin-inline:auto">${icon('settings')}</span>
        <h1 class="text-xl fw-700">لم يتم إعداد الاتصال بقاعدة البيانات</h1>
        <p class="c-2 leading-loose">افتح الملف <b class="ltr">assets/js/config.js</b> وضع فيه
        <b class="ltr">SUPABASE_URL</b> و <b class="ltr">SUPABASE_ANON_KEY</b> الخاصة بمشروعك في Supabase،
        ثم أعد تحميل الصفحة. التفاصيل الكاملة في ملف README.</p>
      </div></div></main>`
  },
}

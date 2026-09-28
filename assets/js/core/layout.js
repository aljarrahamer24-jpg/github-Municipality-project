/* ==========================================================================
   layout.js — بناء الهيدر والقوائم والفوتر حول محتوى الصفحة
   كل صفحة تحدد نوعها في <body data-layout="public|auth|citizen|employee|admin">
   ========================================================================== */

const Layout = (() => {
  const LOGO_SVG = `<svg class="brand-logo" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0b5d51"/><path d="M10 30V18l10-7.5L30 18v12h-6.5v-7h-7v7z" fill="#fff"/><circle cx="20" cy="16.5" r="2" fill="#c8963e"/></svg>`
  const brand = (href, light = false) =>
    `<a class="brand ${light ? 'light' : ''}" href="${href}">${LOGO_SVG}<span><span class="brand-name">بلدية المدينة</span><span class="brand-sub">منصة الشكاوى والخدمات</span></span></a>`

  const ACTIVE = document.body.dataset.active || ''
  const isActive = (key) => (key === ACTIVE ? 'active' : '')

  function roleLabel(p) {
    if (p.role === 'employee') return `موظف${p.department?.name ? ' — ' + p.department.name : ''}`
    return p.role === 'admin' ? 'مدير النظام' : 'مواطن'
  }

  function userMenu(p) {
    const name = p.full_name || p.email
    return `<div class="dropdown">
      <button class="user-btn" data-menu-btn aria-haspopup="true">${avatar(name, 'sm')}<span class="who"><b>${esc(name)}</b><small>${esc(roleLabel(p))}</small></span>${icon('chevron-down')}</button>
      <div class="menu" hidden>
        <div class="menu-sec"><p class="fw-600 text-sm">${esc(name)}</p><p class="text-xs c-3 ltr" style="text-align:right">${esc(p.email || '')}</p></div>
        <div class="menu-sec">
          <a href="${App.homeUrl(p.role)}">${icon('layout-dashboard')}لوحة التحكم</a>
          ${p.role === 'citizen' ? `<a href="${url('citizen/profile.html')}">${icon('user-cog')}حسابي</a>` : ''}
          <a href="${url('index.html')}">${icon('house')}الصفحة الرئيسية</a>
        </div>
        <div class="menu-sec"><a class="danger" href="#" data-logout>${icon('log-out')}تسجيل الخروج</a></div>
      </div></div>`
  }

  const drawer = (inner, dark = false) =>
    `<div class="drawer ${dark ? 'dark' : ''}" data-drawer><div class="drawer-backdrop" data-drawer-close></div><div class="drawer-panel">${inner}</div></div>`

  const footer = () => `<footer class="site-footer">
    <div class="container footer-grid">
      <div class="stack">${brand(url('index.html'), true)}<p class="text-sm leading-loose">منصة رقمية رسمية لاستقبال شكاوى وطلبات المواطنين ومتابعتها بشفافية حتى إغلاقها.</p></div>
      <div><h4>روابط سريعة</h4><ul><li><a href="${url('citizen/new.html')}">تقديم بلاغ</a></li><li><a href="${url('track.html')}">متابعة بلاغ</a></li><li><a href="${url('index.html#services')}">الخدمات البلدية</a></li><li><a href="${url('auth/register.html')}">إنشاء حساب</a></li></ul></div>
      <div><h4>الدعم</h4><ul><li>الأسئلة الشائعة</li><li>سياسة الخصوصية</li><li>شروط الاستخدام</li><li>إمكانية الوصول</li></ul></div>
      <div><h4>تواصل معنا</h4><ul class="contact"><li>${icon('phone')}<span class="ltr">1800-000-000</span></li><li>${icon('mail')}info@municipality.example</li><li>${icon('map-pin')}مبنى البلدية — وسط البلد</li></ul></div>
    </div>
    <div class="footer-bottom"><div class="container"><p>© ${new Date().getFullYear()} بلدية المدينة — جميع الحقوق محفوظة</p><p>منصة إدارة شكاوى وطلبات خدمات البلدية</p></div></div>
  </footer>`

  function publicLayout(content, p) {
    const links = [['index.html', 'الرئيسية', 'home'], ['index.html#services', 'الخدمات', ''], ['index.html#how', 'كيف تعمل المنصة', ''], ['track.html', 'متابعة بلاغ', 'track']]
    const actions = p
      ? `<a class="btn btn-primary desktop-only" href="${App.homeUrl(p.role)}">${icon('layout-dashboard')}لوحتي</a>`
      : `<a class="btn btn-ghost desktop-only" href="${url('auth/login.html')}">تسجيل الدخول</a><a class="btn btn-primary desktop-only" href="${url('auth/register.html')}">إنشاء حساب</a>`
    const drawerActions = p
      ? `<a class="btn btn-primary btn-block" href="${App.homeUrl(p.role)}">لوحتي</a>`
      : `<a class="btn btn-outline btn-block" href="${url('auth/login.html')}">تسجيل الدخول</a><a class="btn btn-primary btn-block" href="${url('auth/register.html')}">إنشاء حساب</a>`
    document.body.classList.add('public')
    document.body.innerHTML = `
      <header class="site-header"><div class="container">
        ${brand(url('index.html'))}
        <nav class="main-nav public-nav">${links.map(([h, l, k]) => `<a href="${url(h)}" class="${k ? isActive(k) : ''}">${l}</a>`).join('')}</nav>
        <div class="header-actions">${actions}<button class="icon-btn menu-toggle" data-drawer-open aria-label="القائمة">${icon('menu')}</button></div>
      </div></header>
      ${drawer(`<div class="drawer-head">${brand(url('index.html'))}<button class="icon-btn" data-drawer-close aria-label="إغلاق">${icon('x')}</button></div>
        <nav class="drawer-nav">${links.map(([h, l]) => `<a href="${url(h)}" data-drawer-close>${l}</a>`).join('')}</nav>
        <div class="drawer-foot">${drawerActions}</div>`)}
      <main id="content"></main>
      ${footer()}`
    $('#content').replaceWith(content)
  }

  function authLayout(content) {
    document.body.innerHTML = `<div class="auth">
      <div class="auth-main">
        ${brand(url('index.html'))}
        <div class="auth-center"><div class="auth-box" id="auth-slot"></div></div>
        <p class="text-center text-xs c-3">© ${new Date().getFullYear()} بلدية المدينة</p>
      </div>
      <aside class="auth-aside">
        <div class="pattern"></div>
        <div class="blob" style="top:-96px;inset-inline-start:-96px;width:384px;height:384px;background:rgb(40 145 127 / .4)"></div>
        <div class="blob" style="bottom:-128px;inset-inline-end:-40px;width:384px;height:384px;background:rgb(200 150 62 / .2)"></div>
        <div class="content stack-lg">
          <span class="chip-soft">الخدمات البلدية الإلكترونية</span>
          <h2>بلّغ عن المشكلة في دقيقة، وتابعها حتى تُحل.</h2>
          <ul>${['تقديم البلاغ مع الصور والموقع الدقيق', 'متابعة حالة البلاغ لحظة بلحظة', 'تقييم الخدمة بعد الإغلاق'].map((t) => `<li>${icon('circle-check')}${t}</li>`).join('')}</ul>
        </div>
      </aside></div>`
    $('#auth-slot').appendChild(content)
    content.removeAttribute('id')
    content.id = 'content'
  }

  function citizenLayout(content, p) {
    const nav = [
      ['citizen/index.html', 'لوحتي', 'layout-dashboard', 'dashboard'],
      ['citizen/complaints.html', 'بلاغاتي', 'file-text', 'complaints'],
      ['citizen/notifications.html', 'الإشعارات', 'bell', 'notifications'],
      ['citizen/profile.html', 'حسابي', 'user', 'profile'],
    ]
    const tab = ([h, l, ic, k]) => `<a href="${url(h)}" class="${isActive(k)}">${icon(ic)}${l}${k === 'notifications' ? '<span class="count-pill hidden" data-unread-count></span>' : ''}</a>`
    document.body.classList.add('citizen')
    document.body.innerHTML = `
      <header class="site-header"><div class="container">
        ${brand(url('index.html'))}
        <nav class="main-nav citizen-nav">${nav.map(tab).join('')}</nav>
        <div class="header-actions">
          <a class="btn btn-primary desktop-only" href="${url('citizen/new.html')}">${icon('plus')}بلاغ جديد</a>
          <a class="icon-btn mobile-only" href="${url('citizen/notifications.html')}" aria-label="الإشعارات">${icon('bell')}<span class="ping hidden" data-unread-dot></span></a>
          ${userMenu(p)}
        </div>
      </div></header>
      <main id="content"></main>
      <div class="hidden md-show">${footer()}</div>
      <nav class="bottom-nav no-print">
        ${nav.slice(0, 2).map(tab).join('')}
        <div class="fab-wrap"><a class="fab" href="${url('citizen/new.html')}" aria-label="بلاغ جديد">${icon('plus')}</a></div>
        ${nav.slice(2).map(tab).join('')}
      </nav>`
    content.classList.add('container', 'citizen-main')
    $('#content').replaceWith(content)
  }

  function dashboardLayout(content, p) {
    const role = p.role
    const groups =
      role === 'admin'
        ? [
            { items: [['admin/index.html', 'الرئيسية', 'layout-dashboard', 'dashboard'], ['admin/complaints.html', 'جميع البلاغات', 'clipboard-list', 'complaints', 'new']] },
            {
              title: 'التحليل والإحصاءات',
              items: [
                ['admin/map.html', 'خريطة البلاغات', 'map', 'map'],
                ['admin/recurring.html', 'المشاكل المتكررة', 'repeat', 'recurring'],
                ['admin/weather.html', 'الاستعداد للحالات الجوية', 'cloud-rain-wind', 'weather'],
                ['admin/reports.html', 'التقارير الشهرية', 'file-chart-column', 'reports'],
                ['admin/satisfaction.html', 'رضا المواطنين', 'face-slightly-smiling', 'satisfaction'],
              ],
            },
            {
              title: 'إدارة النظام',
              items: [
                ['admin/users.html', 'المستخدمون', 'users', 'users'],
                ['admin/employees.html', 'الموظفون', 'briefcase', 'employees'],
                ['admin/departments.html', 'الأقسام', 'layers', 'departments'],
                ['admin/categories.html', 'أنواع المشاكل', 'tags', 'categories'],
                ['admin/districts.html', 'المناطق', 'map-pinned', 'districts'],
                ['admin/keywords.html', 'الكلمات المفتاحية', 'key-round', 'keywords'],
                ['admin/settings.html', 'إعدادات النظام', 'settings', 'settings'],
              ],
            },
          ]
        : [
            {
              items: [
                ['employee/index.html', 'لوحة التحكم', 'layout-dashboard', 'dashboard'],
                ['employee/complaints.html', 'البلاغات', 'clipboard-list', 'complaints', 'open'],
                ['employee/map.html', 'خريطة البلاغات', 'map', 'map'],
              ],
            },
          ]

    const home = App.homeUrl(role)
    const tag = role === 'admin' ? 'لوحة مدير البلدية' : `بوابة موظف البلدية${p.department?.name ? ' — ' + p.department.name : ''}`
    const sidebar = (closeBtn) => `<div class="sidebar">
      <div class="sidebar-head">${brand(home, true)}${closeBtn ? `<button class="icon-btn" data-drawer-close aria-label="إغلاق">${icon('x')}</button>` : ''}</div>
      <div class="sidebar-tag">${esc(tag)}</div>
      <nav class="sidebar-nav">${groups
        .map(
          (g) => `<div class="nav-group">${g.title ? `<p class="nav-group-title">${g.title}</p>` : ''}${g.items
            .map(([h, l, ic, k, badgeKey]) => `<a class="nav-link ${isActive(k)}" href="${url(h)}">${icon(ic)}<span class="label-txt">${l}</span>${badgeKey ? `<span class="nav-badge hidden" data-nav-badge="${badgeKey}"></span>` : ''}</a>`)
            .join('')}</div>`,
        )
        .join('')}</nav>
      <div class="sidebar-foot">منصة شكاوى البلدية — الإصدار 1.0</div></div>`

    document.body.innerHTML = `<div class="app">
      <aside class="sidebar-desktop">${sidebar(false)}</aside>
      ${drawer(sidebar(true), true)}
      <div class="col" style="min-width:0">
        <header class="topbar">
          <button class="icon-btn menu-toggle" data-drawer-open aria-label="القائمة">${icon('menu')}</button>
          <form class="search" data-quick-search role="search">${icon('search')}<input class="input" name="q" placeholder="بحث سريع برقم البلاغ أو العنوان..."></form>
          <div class="topbar-actions">
            <a class="icon-btn search-trigger" href="${url(role + '/complaints.html')}" aria-label="بحث">${icon('search')}</a>
            <div class="dropdown">
              <button class="icon-btn" data-bell aria-label="الإشعارات" aria-haspopup="true">${icon('bell')}<span class="ping hidden" data-unread-dot></span></button>
              <div class="menu notif-menu" hidden data-bell-menu></div>
            </div>
            ${userMenu(p)}
          </div>
        </header>
        <main id="content"></main>
      </div></div>`
    content.classList.add('app-main')
    $('#content').replaceWith(content)

    // البحث السريع ينقل إلى صفحة البلاغات مع كلمة البحث
    $('[data-quick-search]').addEventListener('submit', (e) => {
      e.preventDefault()
      const q = e.target.q.value.trim()
      location.href = url(`${role}/complaints.html`) + (q ? `?q=${encodeURIComponent(q)}` : '')
    })

    // أرقام القائمة الجانبية (بلاغات جديدة/مفتوحة)
    API.stats()
      .then((s) => {
        $$('[data-nav-badge]').forEach((b) => {
          const n = s[b.dataset.navBadge] || 0
          b.textContent = n
          b.classList.toggle('hidden', !n)
        })
      })
      .catch(() => {})
  }

  function bindShell() {
    document.addEventListener('click', (e) => {
      const dr = $('[data-drawer]')
      if (e.target.closest('[data-drawer-open]')) dr?.classList.add('open')
      else if (e.target.closest('[data-drawer-close]')) dr?.classList.remove('open')

      if (e.target.closest('[data-logout]')) {
        e.preventDefault()
        App.signOut()
      }

      const btn = e.target.closest('[data-menu-btn], [data-bell]')
      $$('.menu').forEach((m) => {
        if (btn && m.previousElementSibling === btn) {
          m.hidden = !m.hidden
          if (!m.hidden && btn.hasAttribute('data-bell')) Notifications.renderMenu(m)
        } else if (!e.target.closest('.menu')) m.hidden = true
      })
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $('[data-drawer]')?.classList.remove('open')
        $$('.menu').forEach((m) => (m.hidden = true))
      }
    })
    // أزرار عامة: data-toast="رسالة" و data-print
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-toast]')
      if (t) toast(t.dataset.toast)
      if (e.target.closest('[data-print]')) window.print()
    })
  }

  function mount(layout, content, profile) {
    if (layout === 'public') publicLayout(content, profile)
    else if (layout === 'auth') authLayout(content)
    else if (layout === 'citizen' && profile) citizenLayout(content, profile)
    else if ((layout === 'employee' || layout === 'admin') && profile) dashboardLayout(content, profile)
    bindShell()
  }

  return { mount, brand }
})()

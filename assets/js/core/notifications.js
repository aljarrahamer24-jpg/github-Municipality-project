/* ==========================================================================
   notifications.js — عدّاد الإشعارات + القائمة المنسدلة + التحديث اللحظي (Realtime)
   ========================================================================== */

const NOTIF_ICONS = { status: 'refresh-cw', comment: 'message-square', rating: 'star', weather: 'cloud-rain', new: 'file-text', assignment: 'user-cog', info: 'bell' }

const Notifications = {
  unread: 0,
  profile: null,
  channel: null,

  // رابط البلاغ المرتبط بالإشعار حسب دور المستخدم
  link(n) {
    // طلب صلاحيات موظف جديد → صفحة الموظفين عند المدير
    if (!n.complaint_id && this.profile.role === 'admin' && n.title?.startsWith('طلب صلاحيات')) return url('admin/employees.html')
    if (!n.complaint_id) return this.profile.role === 'citizen' ? url('citizen/notifications.html') : null
    return url(`${this.profile.role}/complaint.html?id=${n.complaint_id}`)
  },

  async start(profile) {
    this.profile = profile
    try {
      this.setUnread(await API.unreadCount())
    } catch {
      /* العدّاد غير ضروري لعمل الصفحة */
    }
    // Realtime: RLS تضمن أن المستخدم يستلم إشعاراته فقط
    this.channel = sb
      .channel(`notifications-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, (payload) => {
        this.setUnread(this.unread + 1)
        toast(payload.new.title + (payload.new.body ? ' — ' + payload.new.body : ''), 'info')
        document.dispatchEvent(new CustomEvent('notification', { detail: payload.new }))
      })
      .subscribe((status) => {
        // تفعيل الاشتراك يستغرق لحظات بعد فتح الصفحة؛ نعيد قراءة العدّاد حتى لا يضيع إشعار وصل خلالها
        if (status === 'SUBSCRIBED') API.unreadCount().then((n) => this.setUnread(n)).catch(() => {})
      })
  },

  setUnread(n) {
    this.unread = Math.max(0, n)
    $$('[data-unread-count]').forEach((el) => {
      el.textContent = this.unread > 99 ? '99+' : this.unread
      el.classList.toggle('hidden', !this.unread)
    })
    $$('[data-unread-dot]').forEach((el) => el.classList.toggle('hidden', !this.unread))
  },

  item(n) {
    const href = this.link(n)
    const inner = `<span class="icon-box sm round ${n.type === 'weather' ? 'box-warning' : ''}">${icon(NOTIF_ICONS[n.type] || 'bell')}</span>
      <span class="flex-1" style="min-width:0"><b class="text-sm">${esc(n.title)}</b>${n.body ? `<small class="notif-body">${esc(n.body)}</small>` : ''}<small class="c-3">${timeAgo(n.created_at)}</small></span>
      ${n.is_read ? '' : '<span class="unread-dot"></span>'}`
    return href ? `<a class="notif-item ${n.is_read ? '' : 'unread'}" href="${href}" data-notif="${n.id}">${inner}</a>` : `<div class="notif-item ${n.is_read ? '' : 'unread'}" data-notif="${n.id}">${inner}</div>`
  },

  // القائمة المنسدلة في لوحات الموظف والمدير
  async renderMenu(menu) {
    menu.innerHTML = loadingBlock()
    try {
      const list = await API.notifications(10)
      menu.innerHTML = `<div class="notif-head"><b>الإشعارات</b>${this.unread ? `<button class="link" data-read-all>تعليم الكل كمقروء</button>` : ''}</div>
        ${list.length ? list.map((n) => this.item(n)).join('') : `<p class="text-sm c-3 text-center" style="padding:24px">لا توجد إشعارات</p>`}`
      $('[data-read-all]', menu)?.addEventListener('click', async (e) => {
        e.stopPropagation()
        await API.markAllRead()
        this.setUnread(0)
        this.renderMenu(menu)
      })
    } catch (err) {
      showError(menu, err)
    }
  },
}

// تعليم الإشعار كمقروء عند الضغط عليه
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-notif]')
  if (el && el.classList.contains('unread')) {
    el.classList.remove('unread')
    Notifications.setUnread(Notifications.unread - 1)
    API.markRead(el.dataset.notif).catch(() => {})
  }
})

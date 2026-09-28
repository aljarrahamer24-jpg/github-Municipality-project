/* إشعارات المواطن (تتحدث لحظياً عبر Realtime) */
App.page({ roles: ['citizen'] }, async () => {
  const list = $('#notifications')
  async function render() {
    const rows = await API.notifications(50)
    list.innerHTML = rows.length ? rows.map((n) => Notifications.item(n)).join('') : empty('bell', 'لا توجد إشعارات', 'ستصلك هنا تحديثات بلاغاتك.')
  }
  await load(list, render)
  $('#mark-all').addEventListener('click', async () => {
    try {
      await API.markAllRead()
      Notifications.setUnread(0)
      await render()
      toast('تم تعليم جميع الإشعارات كمقروءة')
    } catch (err) {
      toast(toAppError(err).message, 'error')
    }
  })
  document.addEventListener('notification', () => render().catch(() => {}))
})

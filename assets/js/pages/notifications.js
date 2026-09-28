/* الإشعارات */
;(() => {
  const ICON = { status: 'refresh-cw', comment: 'message-square', rating: 'star', weather: 'cloud-rain' }
  const list = $('#notifications')
  const render = () =>
    (list.innerHTML = notifications
      .map(
        (n) => `<div class="notif ${n.read ? '' : 'unread'}">
        <span class="icon-box round ${n.type === 'weather' ? 'box-warning' : ''}">${icon(ICON[n.type])}</span>
        <div class="flex-1"><div class="flex justify-between items-start gap-2"><p class="fw-600">${esc(n.title)}</p><span class="text-xs c-3 nowrap">${n.at}</span></div>
        <p class="text-sm c-2 mt-1">${esc(n.body)}</p></div>
        ${n.read ? '' : '<span class="unread-dot"></span>'}
      </div>`,
      )
      .join(''))
  $('#mark-all').addEventListener('click', () => {
    notifications.forEach((n) => (n.read = true))
    render()
    toast('تم تعليم جميع الإشعارات كمقروءة')
  })
  render()
})()

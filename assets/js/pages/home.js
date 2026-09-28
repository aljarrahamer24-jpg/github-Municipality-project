/* الصفحة الرئيسية: بطاقات أنواع الخدمات من البيانات */
;(() => {
  $('#services-grid').innerHTML = categories
    .filter((c) => c.active)
    .map(
      (c) => `<a class="service" href="citizen/new.html?cat=${c.id}">
        <span class="icon-box">${icon(c.icon)}</span>
        <h3>${esc(c.name)}</h3>
        <p>المدة المتوقعة: ${c.slaDays} أيام</p>
      </a>`,
    )
    .join('')
})()

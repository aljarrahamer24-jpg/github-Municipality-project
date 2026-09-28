/* إعدادات النظام: تمييز القسم الحالي في القائمة الجانبية */
;(() => {
  const links = $$('.settings-nav a')
  const sections = links.map((a) => $(a.getAttribute('href')))
  const setActive = (id) => links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id))
  const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-30% 0px -60% 0px' })
  sections.forEach((s) => s && io.observe(s))
})()

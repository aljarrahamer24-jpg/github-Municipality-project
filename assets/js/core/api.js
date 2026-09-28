/* ==========================================================================
   api.js — طبقة الوصول للبيانات (كل استعلامات Supabase في مكان واحد)
   --------------------------------------------------------------------------
   كل دالة ترجع البيانات مباشرة أو ترمي AppError برسالة عربية.
   الصلاحيات الفعلية تُطبّق في قاعدة البيانات عبر RLS — وليس هنا.
   ========================================================================== */

const BUCKET = 'complaint-images'
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))

// الحقول المستخدمة في قوائم البلاغات
const COMPLAINT_LIST_FIELDS = `id, complaint_number, title, status, priority, created_at, updated_at, due_at, address, latitude, longitude,
  category_id, area_id, department_id, assigned_employee_id, citizen_id,
  category:problem_categories(name, icon, color), area:areas(name), department:departments(name),
  assignee:profiles!complaints_assigned_employee_id_fkey(full_name)`

const API = {
  /* ---------- البيانات المرجعية ---------- */
  categories: ({ activeOnly = true } = {}) => {
    let q = sb.from('problem_categories').select('*, department:departments(id, name)').order('name')
    if (activeOnly) q = q.eq('is_active', true)
    return run(q)
  },
  areas: () => run(sb.from('areas').select('*').order('name')),
  departments: ({ activeOnly = false } = {}) => {
    let q = sb.from('departments').select('*').order('name')
    if (activeOnly) q = q.eq('is_active', true)
    return run(q)
  },
  // الموظفون (يرى الموظف زملاءه والمدير الجميع حسب RLS)
  staff: ({ departmentId, activeOnly = true } = {}) => {
    let q = sb.from('profiles').select('id, full_name, role, department_id, is_active').in('role', ['employee', 'admin']).order('full_name')
    if (departmentId) q = q.eq('department_id', departmentId)
    if (activeOnly) q = q.eq('is_active', true)
    return run(q)
  },

  /* ---------- البلاغات ---------- */
  // استعلام قائمة البلاغات مع الفلاتر والترتيب والترقيم (من الخادم)
  async complaints({ status, statuses, overdue, categoryId, areaId, departmentId, priority, assigneeId, citizenId, ids, search, from, to, sort = 'created_at', asc = false, page = 1, pageSize = 10, fields = COMPLAINT_LIST_FIELDS } = {}) {
    let q = sb.from('complaints').select(fields, { count: 'exact' })
    if (status) q = q.eq('status', status)
    if (statuses) q = q.in('status', statuses)
    if (overdue) q = q.in('status', OPEN_STATUSES).lt('due_at', new Date().toISOString())
    if (categoryId) q = q.eq('category_id', categoryId)
    if (areaId) q = q.eq('area_id', areaId)
    if (departmentId) q = q.eq('department_id', departmentId)
    if (priority) q = q.eq('priority', priority)
    if (assigneeId) q = q.eq('assigned_employee_id', assigneeId)
    if (citizenId) q = q.eq('citizen_id', citizenId)
    if (ids) q = q.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lt('created_at', to)
    const s = cleanSearch(search)
    if (s) q = q.or(`complaint_number.ilike.%${s}%,title.ilike.%${s}%,address.ilike.%${s}%`)
    q = q.order(sort, { ascending: asc })
    if (sort !== 'created_at') q = q.order('created_at', { ascending: false })
    if (pageSize) q = q.range((page - 1) * pageSize, page * pageSize - 1)
    let res
    try {
      res = await q
    } catch (e) {
      throw toAppError(e)
    }
    if (res.error) throw toAppError(res.error)
    return { rows: res.data, count: res.count ?? res.data.length }
  },

  complaint: (id) =>
    run(
      sb
        .from('complaints')
        .select(
          `*, category:problem_categories(id, name, icon, sla_days), area:areas(id, name), department:departments(id, name),
           assignee:profiles!complaints_assigned_employee_id_fkey(id, full_name),
           citizen:profiles!complaints_citizen_id_fkey(id, full_name, phone, email)`,
        )
        .eq('id', id)
        .maybeSingle(),
    ).then((c) => {
      if (!c) throw new AppError('البلاغ غير موجود أو لا تملك صلاحية عرضه.', { kind: 'notfound' })
      return c
    }),

  history: (id) => run(sb.from('complaint_status_history').select('*').eq('complaint_id', id).order('created_at')),
  comments: (id) => run(sb.from('complaint_comments').select('*').eq('complaint_id', id).order('created_at')),
  notes: (id) => run(sb.from('internal_notes').select('*').eq('complaint_id', id).order('created_at')),
  rating: (id) => run(sb.from('complaint_ratings').select('*').eq('complaint_id', id).maybeSingle()),

  // الصور مع روابط موقّعة (الـ Bucket خاص — لا توجد روابط عامة)
  async images(id) {
    const rows = await run(sb.from('complaint_images').select('*').eq('complaint_id', id).order('created_at'))
    if (!rows.length) return []
    const signed = await run(sb.storage.from(BUCKET).createSignedUrls(rows.map((r) => r.storage_path), 3600))
    return rows.map((r, i) => ({ ...r, url: signed[i]?.signedUrl || '' }))
  },

  // رفع صور إلى Storage ثم تسجيلها في complaint_images
  async uploadImages(complaintId, kind, files) {
    const failed = []
    for (const file of files) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const path = `${complaintId}/${kind}/${uid()}.${ext}`
      try {
        await run(sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false }))
        try {
          await run(sb.from('complaint_images').insert({ complaint_id: complaintId, kind, storage_path: path }))
        } catch (e) {
          await sb.storage.from(BUCKET).remove([path]).catch(() => {}) // لا نترك ملفات يتيمة
          throw e
        }
      } catch (e) {
        failed.push({ file: file.name, error: toAppError(e).message })
      }
    }
    return failed
  },

  // إنشاء بلاغ: القيم الحساسة (الرقم، الحالة، القسم...) يحددها الخادم
  async createComplaint({ categoryId, title, description, latitude, longitude, areaId, address }, files = []) {
    const user = App.user
    const row = await run(
      sb
        .from('complaints')
        .insert({ citizen_id: user.id, category_id: categoryId, title, description, latitude, longitude, area_id: areaId || null, address: address || null })
        .select('id, complaint_number')
        .single(),
    )
    const failed = files.length ? await API.uploadImages(row.id, 'citizen', files) : []
    return { ...row, failedUploads: failed }
  },

  updateComplaint: ({ id, status, priority, departmentId, assigneeId, clearAssignee = false, note }) =>
    run(
      sb.rpc('update_complaint', {
        p_id: id,
        p_status: status || null,
        p_priority: priority || null,
        p_department: departmentId || null,
        p_assignee: assigneeId || null,
        p_clear_assignee: clearAssignee,
        p_note: note || null,
      }),
    ),

  addComment: (complaintId, body) => run(sb.from('complaint_comments').insert({ complaint_id: complaintId, author_id: App.user.id, body }).select().single()),
  addNote: (complaintId, body) => run(sb.from('internal_notes').insert({ complaint_id: complaintId, author_id: App.user.id, body }).select().single()),
  rate: (complaintId, rating, comment, tags) =>
    run(sb.from('complaint_ratings').insert({ complaint_id: complaintId, citizen_id: App.user.id, rating, comment: comment || null, tags }).select().single()),

  /* ---------- الإشعارات ---------- */
  notifications: (limit = 30) => run(sb.from('notifications').select('*').eq('user_id', App.user.id).order('created_at', { ascending: false }).limit(limit)),
  async unreadCount() {
    const res = await sb.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', App.user.id).eq('is_read', false)
    if (res.error) throw toAppError(res.error)
    return res.count || 0
  },
  markRead: (id) => run(sb.from('notifications').update({ is_read: true }).eq('id', id)),
  markAllRead: () => run(sb.rpc('mark_all_notifications_read')),

  /* ---------- الإحصائيات والتحليلات (كلها SQL — بدون ذكاء اصطناعي) ---------- */
  stats: () => run(sb.rpc('dashboard_stats')),
  publicStats: () => run(sb.rpc('public_stats')),
  trend: (months = 6) => run(sb.rpc('monthly_trend', { p_months: months })),
  breakdown: (from = null, to = null) => run(sb.rpc('analytics_breakdown', { p_from: from, p_to: to })),
  hotspots: ({ days = null, categoryId = null, status = null } = {}) => run(sb.rpc('hotspot_areas', { p_days: days, p_category: categoryId, p_status: status })),
  recurring: (opts = {}) => run(sb.rpc('recurring_problems', { p_radius_m: opts.radius || null, p_months: opts.months || null, p_min_count: opts.minCount || null })),
  weatherAreas: (eventId = null) => run(sb.rpc('weather_risk_areas', { p_event_id: eventId })),
  notifyStaffWeather: (eventId) => run(sb.rpc('notify_staff_weather', { p_event_id: eventId })),
  satisfaction: (from = null, to = null) => run(sb.rpc('satisfaction_summary', { p_from: from, p_to: to })),
  monthlyReport: (month) => run(sb.rpc('monthly_report', { p_month: month })),
  track: (number) => run(sb.rpc('track_complaint', { p_number: number })),

  /* ---------- إدارة عامة (للمدير — محمية بـ RLS) ---------- */
  list: (table, { select = '*', order = 'created_at', asc = false, filters = {} } = {}) => {
    let q = sb.from(table).select(select).order(order, { ascending: asc })
    for (const [k, v] of Object.entries(filters)) if (v !== '' && v !== undefined && v !== null) q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v)
    return run(q)
  },
  insert: (table, row) => run(sb.from(table).insert(row).select().single()),
  update: (table, id, patch, key = 'id') =>
    run(sb.from(table).update(patch).eq(key, id).select()).then((rows) => {
      if (!rows.length) throw new AppError('لم يتم الحفظ — العنصر غير موجود أو لا تملك صلاحية تعديله.', { kind: 'permission' })
      return rows[0]
    }),
  remove: (table, id, key = 'id') =>
    run(sb.from(table).delete().eq(key, id).select()).then((rows) => {
      if (!rows.length) throw new AppError('لم يتم الحذف — لا تملك صلاحية أو العنصر غير موجود.', { kind: 'permission' })
    }),

  // الإعدادات (app_settings) كقاموس { key: value }
  async settings() {
    const rows = await run(sb.from('app_settings').select('key, value'))
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  },
  saveSettings: (entries) => run(sb.from('app_settings').upsert(Object.entries(entries).map(([key, value]) => ({ key, value })))),

  // إنشاء حساب موظف جديد: التسجيل عبر جلسة منفصلة (لا تؤثر على جلسة المدير)
  // ثم يرقّي المدير الحساب إلى موظف — الترقية محمية في قاعدة البيانات للمدير فقط
  async createStaffAccount({ email, password, fullName, phone, role, departmentId }) {
    const temp = supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'staff-signup' },
    })
    const data = await run(temp.auth.signUp({ email, password, options: { data: { full_name: fullName, phone } } }))
    const id = data.user?.id
    if (!id || (data.user.identities && data.user.identities.length === 0)) {
      throw new AppError('هذا البريد مسجل مسبقاً. يمكنك ترقية الحساب الموجود من صفحة "المستخدمون".', { kind: 'validation' })
    }
    await temp.auth.signOut().catch(() => {})
    await API.update('profiles', id, { role, department_id: departmentId || null, full_name: fullName, phone })
    return { id, needsConfirmation: !data.session }
  },
}

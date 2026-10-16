'use strict';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => ymd(new Date());
const parseYmd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const MOODS = ['😄', '🙂', '😐', '😔', '😣'];

function fmtDate(s) {
  if (!s) return '';
  if (s === today()) return '今天';
  if (s === addDays(today(), 1)) return '明天';
  if (s === addDays(today(), -1)) return '昨天';
  const d = parseYmd(s);
  const diff = Math.round((parseYmd(today()) - d) / 86400000);
  if (diff > 1 && diff < 7) return '周' + WEEK[d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const fmtTime = ts => { const d = new Date(ts); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return '刚刚';
  if (d < 3600000) return Math.floor(d / 60000) + ' 分钟前';
  if (d < 86400000) return Math.floor(d / 3600000) + ' 小时前';
  if (d < 172800000) return '昨天';
  const x = new Date(ts);
  return `${x.getMonth() + 1}月${x.getDate()}日`;
}

const AV_COLORS = ['#4f6ef7', '#7c5cff', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

function avColor(id) {
  let h = 0;
  for (const c of String(id || '?')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

function avatar(id, name, size = 34, emoji = '') {
  const face = emoji || String(name || '?').slice(0, 1).toUpperCase();
  return `<span class="avatar" style="background:${avColor(id)};width:${size}px;height:${size}px;font-size:${Math.round(size * (emoji ? 0.5 : 0.44))}px">${esc(face)}</span>`;
}

function fmtClock(sec) {
  return `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;
}

function fmtDateTime(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
const shiftYM = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; };

function greet() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 9) return '早上好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  if (h < 23) return '晚上好';
  return '夜深了';
}

const IC = (p, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

const P = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chart: '<path d="M8 17v-5M13 17V7M18 17v-9"/><path d="M3 20h18"/>',
  gear: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
  more: '<path d="M12 12h.01M19 12h.01M5 12h.01" stroke-width="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  pencil: '<path d="M17 3l4 4L8 20l-5 1 1-5L17 3z"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevR: '<path d="M9 18l6-6-6-6"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 21h14"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.8-.35-4-1L3 20.5l1.5-5.1A8.5 8.5 0 1 1 21 11.5z"/>',
  feed: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13.5 13.5 0 0 1 0 18"/><path d="M12 3a13.5 13.5 0 0 0 0 18"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>'
};

const S = {
  data: { todos: [], habits: [], notes: [], projects: [], focus: [], settings: {} },
  ui: { qTodos: '', qNotes: '', mood: null, tfilter: 'all', project: 'all', cal: null, calDay: null, authTab: 'login', openComments: {}, lastRoute: null, classTab: 'home', pollSel: {}, draw: { count: 1, fair: true, animating: false, result: null }, adminTab: 'overview', adminRoom: null, adminMsgs: [], socialTab: 'chat', chatActive: false, feedActive: false, contactsActive: false },
  drafts: {},
  user: null,
  info: null,
  social: { rooms: [], messages: [], posts: [], unread: 0, activeRoom: null, poll: null },
  classData: { class: null, students: [], collections: [], polls: [], draws: [], drawCounts: {} },
  adminData: { stats: {}, users: [], posts: [], rooms: [], classes: [] },
  friends: { list: [], requests: [], unreadTotal: 0, open: null, messages: [], poll: null },
  pomo: { minutes: 25, total: 1500, remain: 1500, running: false, endAt: 0, timer: null }
};

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    let msg = '请求失败';
    try { const j = await res.json(); if (j && j.error) msg = j.error; } catch (e) {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function post(col, obj) {
  const item = await api('POST', '/api/' + col, obj);
  S.data[col].push(item);
  render();
  return item;
}

async function put(col, id, patch) {
  const item = await api('PUT', `/api/${col}/${id}`, patch);
  const local = S.data[col].find(x => x.id === id);
  if (local) Object.assign(local, item);
  render();
  return item;
}

async function removeItem(col, id) {
  await api('DELETE', `/api/${col}/${id}`);
  S.data[col] = S.data[col].filter(x => x.id !== id);
  render();
}

function toast(msg) {
  const box = $('#toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  }, 2200);
}

function applyTheme() {
  const th = (S.data.settings && S.data.settings.theme) || 'light';
  const dark = th === 'dark' || (th === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#1d1619' : '#ef8171';
  const btn = $('#theme-btn');
  if (btn) btn.innerHTML = dark ? IC(P.sun, 18) : IC(P.moon, 18);
}

function applyAccent() {
  const c = (S.data.settings && S.data.settings.accent) || '#e4574c';
  document.documentElement.style.setProperty('--accent', c);
  document.documentElement.style.setProperty('--accent-soft', c + '1f');
}

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const name = (h.split('?')[0] || 'today');
  return { name };
}

function pendingToday() {
  return S.data.todos.filter(t => !t.done && t.due && t.due <= today()).length;
}

function pendingAll() {
  return S.data.todos.filter(t => !t.done).length;
}

const NAV = [
  { r: 'today', label: '今日', icon: 'sun', badge: pendingToday },
  { r: 'contacts', label: '联系人', icon: 'users', badge: () => (S.friends.unreadTotal || 0) + (S.friends.requests || []).length },
  { r: 'social', label: '社区', icon: 'feed', badge: () => S.social.unread },
  { r: 'me', label: '我的', icon: 'user' }
];

function activeTab(name) {
  if (name === 'todos') return 'today';
  if (name === 'chat' || name === 'feed') return 'social';
  if (['habits', 'notes', 'class', 'calendar', 'stats', 'settings', 'admin', 'me'].includes(name)) return 'me';
  return name;
}

const TAB_IDS = ['today', 'todos', 'chat', 'feed'];

function renderNav() {
  const cur = activeTab(route().name);
  const badgeHtml = n => n > 0 ? `<span class="badge">${n > 99 ? '99+' : n}</span>` : '';
  const nav = $('#nav');
  if (nav) {
    nav.innerHTML = NAV.map(n =>
      `<a class="nav-item ${cur === n.r ? 'active' : ''}" href="#/${n.r}">${IC(P[n.icon])}<span>${n.label}</span>${n.badge ? badgeHtml(n.badge()) : ''}</a>`
    ).join('');
  }
  const tabbar = $('#tabbar');
  if (tabbar) {
    tabbar.innerHTML = NAV.map(n =>
      `<a class="tab ${cur === n.r ? 'active' : ''}" href="#/${n.r}">${IC(P[n.icon], 21)}<span>${n.label}</span>${n.badge ? badgeHtml(n.badge()) : ''}</a>`
    ).join('');
  }
}

function updateChrome(name) {
  const titles = { today: '今日', todos: '待办', habits: '习惯', notes: '记录', class: '班级', chat: '聊天', feed: '社区', social: '社区', contacts: '联系人', me: '我的', calendar: '日历', stats: '统计', settings: '设置', admin: '管理' };
  const t = $('#page-title');
  const sub = $('#page-sub');
  if (t) t.textContent = titles[name] || 'Tdaily';
  let s = '';
  if (name === 'today') s = `${new Date().getMonth() + 1}月${new Date().getDate()}日 周${WEEK[new Date().getDay()]}`;
  else if (name === 'todos') s = `${pendingAll()} 项进行中`;
  else if (name === 'notes') s = `共 ${S.data.notes.length} 条记录`;
  else if (name === 'habits') s = `${S.data.habits.length} 个习惯`;
  else if (name === 'chat') s = `${(S.social.rooms || []).length} 个聊天室`;
  else if (name === 'feed') s = `${(S.social.posts || []).length} 条动态`;
  else if (name === 'class') s = (S.classData.class ? S.classData.class.name : '创建或加入班级');
  else if (name === 'admin') s = '站长后台';
  else if (name === 'contacts') s = `${(S.friends.list || []).length} 位好友${(S.friends.requests || []).length ? ' · ' + S.friends.requests.length + ' 条申请' : ''}`;
  else if (name === 'social') s = `${(S.social.rooms || []).length} 个聊天室 · ${(S.social.posts || []).length} 条动态`;
  else if (name === 'me') s = `${S.user.name} 的空间`;
  else if (name === 'calendar') { const ym = S.ui.cal || today().slice(0, 7); const [yy, mm] = ym.split('-'); s = `${yy}年${Number(mm)}月`; }
  else if (name === 'stats') s = '数据总览';
  else if (name === 'settings') s = '个性化与数据';
  if (sub) sub.textContent = s;
  const sd = $('#side-date');
  if (sd) sd.textContent = `${new Date().getMonth() + 1}月${new Date().getDate()}日 周${WEEK[new Date().getDay()]}`;
  const su = $('#side-user');
  if (su) su.textContent = S.user ? `${S.user.name} 的空间 · 多账号独立` : '数据保存在本机';
}

function ringSvg(pct) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return `<svg viewBox="0 0 76 76" class="ring-svg">
    <circle cx="38" cy="38" r="${r}" class="ring-bg"/>
    <circle cx="38" cy="38" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 38 38)"/>
  </svg>`;
}

function sortTodos(a, b) {
  return (b.priority || 0) - (a.priority || 0)
    || String(a.due || '9999').localeCompare(String(b.due || '9999'))
    || (a.createdAt || 0) - (b.createdAt || 0);
}

function todoItem(t, opts = {}) {
  const proj = S.data.projects.find(p => p.id === t.projectId);
  const overdue = !t.done && t.due && t.due < today();
  const metas = [];
  if (t.due) metas.push(`<span class="meta ${overdue ? 'red' : t.due === today() ? 'accent' : ''}">${IC(P.clock, 13)}${fmtDate(t.due)}</span>`);
  if (t.priority) metas.push(`<span class="meta pri-${t.priority}">${IC(P.flag, 13)}${['', '低', '中', '高'][t.priority]}</span>`);
  if (proj) metas.push(`<span class="meta">${proj.icon} ${esc(proj.name)}</span>`);
  if ((t.checklist || []).length) metas.push(`<span class="meta">${IC(P.list, 13)}${t.checklist.filter(s => s.done).length}/${t.checklist.length}</span>`);
  for (const g of (t.tags || [])) metas.push(`<span class="tag">#${esc(g)}</span>`);
  if (t.repeat && t.repeat !== 'none') metas.push(`<span class="meta">${IC(P.repeat, 13)}</span>`);
  if (opts.showDoneDate && t.completedAt) metas.push(`<span class="meta">${IC(P.check, 13)}${fmtDate(ymd(new Date(t.completedAt)))}完成</span>`);
  let tg = 0;
  for (const ch of String(t.id)) tg = (tg + ch.charCodeAt(0)) % 5;
  return `<div class="todo ${t.done ? 'done' : ''} tg${tg}" data-act="todo:open" data-id="${t.id}">
    <button class="ck ${t.done ? 'on' : ''}" data-act="todo:toggle" data-id="${t.id}" aria-label="完成">${IC(P.check, 12)}</button>
    <div class="todo-main">
      <div class="todo-title">${esc(t.title)}</div>
      ${metas.length ? `<div class="todo-meta">${metas.join('')}</div>` : ''}
    </div>
    <button class="icon-btn del" data-act="todo:del" data-id="${t.id}" aria-label="删除">${IC(P.trash, 15)}</button>
  </div>`;
}

function hChip(h, date) {
  const on = !!(h.records && h.records[date]);
  return `<button class="hchip ${on ? 'on' : ''}" style="--c:${h.color}" data-act="habit:toggle" data-id="${h.id}" data-date="${date}">
    <span class="hchip-ic">${h.icon}</span><span>${esc(h.name)}</span><span class="hchip-ck">${IC(P.check, 13)}</span>
  </button>`;
}

function habitStreak(h) {
  let d = today();
  if (!(h.records && h.records[d])) d = addDays(d, -1);
  let n = 0;
  while (h.records && h.records[d]) { n++; d = addDays(d, -1); }
  return n;
}

function habitRate(h, n) {
  let c = 0;
  for (let i = 0; i < n; i++) if (h.records && h.records[addDays(today(), -i)]) c++;
  return Math.round(c / n * 100);
}

function last30() {
  const a = [];
  for (let i = 29; i >= 0; i--) a.push(addDays(today(), -i));
  return a;
}

function dayInfo(date) {
  return {
    todos: S.data.todos.filter(t => t.due === date),
    habits: S.data.habits.filter(h => h.records && h.records[date]),
    notes: S.data.notes.filter(n => n.createdAt && ymd(new Date(n.createdAt)) === date)
  };
}

function recentNotes(n) {
  return S.data.notes.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, n).map(x => {
    const content = x.content || '';
    return `<div class="mini-note"><span>${fmtTime(x.createdAt)}</span><div>${esc(content.slice(0, 80))}${content.length > 80 ? '…' : ''}</div></div>`;
  }).join('');
}

function viewToday() {
  const td = today();
  const open = S.data.todos.filter(t => !t.done && t.due && t.due <= td).sort(sortTodos);
  const done = S.data.todos.filter(t => t.done && (t.due === td || (t.completedAt && ymd(new Date(t.completedAt)) === td))).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  const total = open.length + done.length;
  const pct = total ? Math.round(done.length / total * 100) : 0;
  const habits = S.data.habits;
  const hdone = habits.filter(h => h.records && h.records[td]).length;
  return `
  <section class="hero card">
    <div class="hero-left">
      <div class="greet">${greet()}${total && pct === 100 ? ' · 今天全部完成 🎉' : ''}</div>
      <div class="hero-date">${new Date().getMonth() + 1}月${new Date().getDate()}日 · 周${WEEK[new Date().getDay()]}</div>
      <div class="hero-sub">待办 ${done.length}/${total}${habits.length ? ` · 习惯打卡 ${hdone}/${habits.length}` : ''}</div>
    </div>
    <div class="ring">${ringSvg(pct)}<div class="ring-num">${pct}<span>%</span></div></div>
  </section>

  <div class="section-title" style="margin:2px 0 0">待办清单</div>
  ${todoManagerHTML()}

  <section class="card">
    <div class="card-head"><h2>今日习惯</h2><button class="btn ghost small" data-act="habit:new">+ 添加</button></div>
    ${habits.length ? `<div class="hchips">${habits.map(h => hChip(h, td)).join('')}</div>` : `<div class="empty small">还没有习惯，点击添加开始培养</div>`}
  </section>

  <section class="card">
    <div class="card-head"><h2>专注番茄钟</h2><span class="count" id="pomo-today">今日 ${pomoTodayMinutes()} 分钟</span></div>
    <div class="pomo">
      <div class="pomo-time" id="pomo-time">${fmtClock(S.pomo.remain)}</div>
      <div class="pomo-modes">${[15, 25, 45, 60].map(m => `<button class="chip ${S.pomo.minutes === m ? 'on' : ''}" data-act="pomo:set" data-v="${m}">${m}分</button>`).join('')}</div>
      <div class="pomo-actions">
        <button class="btn primary" id="pomo-btn" data-act="pomo:startpause">${S.pomo.running ? '暂停' : S.pomo.remain < S.pomo.total ? '继续' : '开始'}</button>
        <button class="btn ghost" data-act="pomo:reset">重置</button>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><h2>快速记录</h2><button class="btn ghost small" data-act="goto" data-to="notes">全部记录</button></div>
    <form class="quick-note" data-form="note:add">
      <textarea id="note-draft" name="content" data-draft="note" rows="3" placeholder="记录此刻的想法，Ctrl + Enter 保存">${esc(S.drafts.note || '')}</textarea>
      <div class="row-end"><button class="btn primary small" type="submit">记录</button></div>
    </form>
    ${S.data.notes.length ? `<div class="note-mini">${recentNotes(3)}</div>` : ''}
  </section>`;
}

function todoManagerHTML() {
  const f = S.ui.tfilter || 'all';
  const preds = {
    all: () => true,
    today: t => !t.done ? (t.due && t.due <= today()) : (t.due === today() || (t.completedAt && ymd(new Date(t.completedAt)) === today())),
    upcoming: t => !t.done && t.due && t.due > today(),
    overdue: t => !t.done && t.due && t.due < today(),
    done: t => t.done
  };
  let list = S.data.todos.filter(t => (preds[f] || preds.all)(t));
  if (S.ui.project && S.ui.project !== 'all') list = list.filter(t => (t.projectId || '') === S.ui.project);
  const q = (S.ui.qTodos || '').trim().toLowerCase();
  if (q) list = list.filter(t => (t.title || '').toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q) || (t.tags || []).some(g => g.toLowerCase().includes(q)));
  const open = list.filter(t => !t.done).sort(sortTodos);
  const done = list.filter(t => t.done).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  const g = { overdue: [], today: [], tomorrow: [], later: [], nodate: [] };
  for (const t of open) {
    if (!t.due) g.nodate.push(t);
    else if (t.due < today()) g.overdue.push(t);
    else if (t.due === today()) g.today.push(t);
    else if (t.due === addDays(today(), 1)) g.tomorrow.push(t);
    else g.later.push(t);
  }
  const sections = [['已逾期', g.overdue], ['今天', g.today], ['明天', g.tomorrow], ['未来', g.later], ['收集箱', g.nodate]]
    .filter(x => x[1].length)
    .map(([label, items]) => `<div class="section-title">${label} · ${items.length}</div><div class="todo-list">${items.map(t => todoItem(t)).join('')}</div>`)
    .join('');
  const filters = [['all', '全部'], ['today', '今天'], ['overdue', '已逾期'], ['upcoming', '未来'], ['done', '已完成']];
  const projChips = [`<button class="chip ${!S.ui.project || S.ui.project === 'all' ? 'on' : ''}" data-act="project" data-id="all">全部清单</button>`]
    .concat(S.data.projects.map(p => `<button class="chip ${S.ui.project === p.id ? 'on' : ''}" data-act="project" data-id="${p.id}">${p.icon} ${esc(p.name)}</button>`))
    .join('');
  return `
  <div class="list-tools">
    <div class="searchbox">${IC(P.search, 16)}<input id="todo-search" placeholder="搜索待办…" value="${esc(S.ui.qTodos || '')}"></div>
  </div>
  <div class="chips">${filters.map(([v, l]) => `<button class="chip ${f === v ? 'on' : ''}" data-act="filter" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="chips">${projChips}</div>
  <section class="card">
    <form class="quick-add" data-form="todo:quick">
      ${IC(P.plus, 18)}
      <input name="title" id="quick-input" data-draft="quick" placeholder="添加任务，回车即可（试试：周五 !! 交报告 #工作）" value="${esc(S.drafts.quick || '')}" autocomplete="off">
    </form>
    ${sections || `<div class="empty">${q ? '没有找到匹配的待办' : f === 'done' ? '还没有已完成的任务' : '太棒了，没有待办事项'}</div>`}
    ${f !== 'done' && done.length ? `<div class="section-title">已完成 · ${done.length}</div><div class="todo-list">${done.map(t => todoItem(t)).join('')}</div>` : ''}
    ${f === 'done' && done.length ? `<div class="todo-list">${done.map(t => todoItem(t, { showDoneDate: true })).join('')}</div>` : ''}
  </section>`;
}

function viewTodos() { return todoManagerHTML(); }

function viewHabits() {
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(today(), -i));
  const cards = S.data.habits.map(h => {
    const streak = habitStreak(h);
    const rate = habitRate(h, 30);
    return `<div class="card habit-card">
      <div class="habit-head">
        <div class="habit-ic" style="background:${h.color}1f;color:${h.color}">${h.icon}</div>
        <div class="habit-info">
          <div class="habit-name">${esc(h.name)}</div>
          <div class="habit-sub">连续 ${streak} 天 · 近30天 ${rate}%</div>
        </div>
        <button class="icon-btn" data-act="habit:edit" data-id="${h.id}" aria-label="编辑">${IC(P.pencil, 16)}</button>
      </div>
      <div class="habit-days">
        ${days.map(d => {
          const on = !!(h.records && h.records[d]);
          return `<button class="hday ${on ? 'on' : ''} ${d === today() ? 'is-today' : ''}" style="--c:${h.color}" data-act="habit:toggle" data-id="${h.id}" data-date="${d}">
            <span class="hday-w">周${WEEK[parseYmd(d).getDay()]}</span><span class="hday-d">${parseYmd(d).getDate()}</span><span class="hday-dot"></span>
          </button>`;
        }).join('')}
      </div>
      <div class="heat-row">${last30().map(d => `<span class="heat-cell ${h.records && h.records[d] ? 'on' : ''}" style="--c:${h.color}" title="${d}"></span>`).join('')}</div>
    </div>`;
  }).join('');
  return `
  <div class="card head-card">
    <div><h2 style="margin:0;font-size:15.5px">我的习惯</h2><p class="hint" style="margin:4px 0 0">每天进步一点点</p></div>
    <button class="btn primary" data-act="habit:new">+ 新建习惯</button>
  </div>
  ${cards || '<div class="card empty">🌱 还没有习惯，点击「新建习惯」开始培养</div>'}`;
}

function noteItem(n) {
  return `<div class="card note-item" data-act="note:edit" data-id="${n.id}">
    <div class="note-head">
      <span class="note-time">${fmtTime(n.createdAt)}</span>
      ${n.mood ? `<span class="note-mood">${MOODS[n.mood - 1] || ''}</span>` : ''}
      <span class="spacer"></span>
      <button class="icon-btn" data-act="note:del" data-id="${n.id}" aria-label="删除">${IC(P.trash, 15)}</button>
    </div>
    <div class="note-content">${esc(n.content || '').replace(/\n/g, '<br>')}</div>
    ${(n.tags || []).length ? `<div class="note-tags">${n.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
  </div>`;
}

function viewNotes() {
  const q = (S.ui.qNotes || '').trim().toLowerCase();
  let list = S.data.notes.slice().sort((a, b) => b.createdAt - a.createdAt);
  if (q) list = list.filter(n => (n.content || '').toLowerCase().includes(q) || (n.tags || []).some(t => t.toLowerCase().includes(q)));
  const groups = [];
  let cur = null;
  for (const n of list) {
    const d = ymd(new Date(n.createdAt));
    if (!cur || cur.d !== d) { cur = { d, items: [] }; groups.push(cur); }
    cur.items.push(n);
  }
  return `
  <form class="card composer" data-form="note:add">
    <textarea id="note-draft" name="content" data-draft="note" rows="3" placeholder="记录此刻的想法、心情、灵感…">${esc(S.drafts.note || '')}</textarea>
    <div class="composer-bar">
      <div class="moods">${MOODS.map((m, i) => `<button type="button" class="mood-chip ${S.ui.mood === i + 1 ? 'on' : ''}" data-act="mood:set" data-v="${i + 1}">${m}</button>`).join('')}</div>
      <input class="tag-input" name="tags" data-draft="noteTags" placeholder="#标签" value="${esc(S.drafts.noteTags || '')}">
      <button class="btn primary" type="submit">记录</button>
    </div>
  </form>
  <div class="list-tools">
    <div class="searchbox">${IC(P.search, 16)}<input id="note-search" placeholder="搜索记录…" value="${esc(S.ui.qNotes || '')}"></div>
    <span class="count">${list.length} 条</span>
  </div>
  ${groups.length ? groups.map(g => `<div class="note-group"><div class="note-day-h">${fmtDate(g.d)} <span>${g.d}</span></div>${g.items.map(noteItem).join('')}</div>`).join('')
    : `<div class="card empty">🍃 ${q ? '没有找到相关记录' : '还没有记录，写下第一条吧'}</div>`}`;
}

function viewCalendar() {
  const ym = S.ui.cal || today().slice(0, 7);
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const dim = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push({ d: ymd(new Date(y, m - 1, i - offset + 1)), out: true });
  for (let i = 1; i <= dim; i++) cells.push({ d: `${y}-${pad2(m)}-${pad2(i)}`, out: false });
  let k = 1;
  while (cells.length % 7 !== 0) cells.push({ d: ymd(new Date(y, m, k++)), out: true });
  const sel = S.ui.calDay || today();
  const day = dayInfo(sel);
  return `
  <div class="card">
    <div class="cal-head">
      <button class="icon-btn" data-act="cal:prev" aria-label="上个月">${IC(P.chevL, 18)}</button>
      <div class="cal-title">${y}年${m}月</div>
      <button class="icon-btn" data-act="cal:next" aria-label="下个月">${IC(P.chevR, 18)}</button>
      <button class="btn ghost small" data-act="cal:today">今天</button>
    </div>
    <div class="cal-week">${['一', '二', '三', '四', '五', '六', '日'].map(w => `<span>${w}</span>`).join('')}</div>
    <div class="cal-grid">
      ${cells.map(c => {
        const info = dayInfo(c.d);
        const dots = [];
        if (info.todos.some(t => !t.done)) dots.push('accent');
        if (info.todos.some(t => t.done)) dots.push('green');
        if (info.habits.length) dots.push('orange');
        if (info.notes.length) dots.push('gray');
        const cls = [c.out ? 'out' : '', c.d === today() ? 'is-today' : '', c.d === sel ? 'is-sel' : ''].join(' ');
        return `<button class="cal-cell ${cls}" data-act="cal:day" data-date="${c.d}">
          <span class="cal-d">${parseYmd(c.d).getDate()}</span>
          <span class="cal-dots">${dots.map(x => `<i class="dot ${x}"></i>`).join('')}</span>
        </button>`;
      }).join('')}
    </div>
  </div>
  <div class="card day-panel">
    <div class="card-head"><h2>${fmtDate(sel)} <span class="hint" style="font-weight:400">${sel}</span></h2></div>
    ${day.todos.length ? `<div class="todo-list">${day.todos.map(t => todoItem(t)).join('')}</div>` : ''}
    ${day.habits.length ? `<div class="section-title">习惯打卡</div><div class="hchips">${day.habits.map(h => hChip(h, sel)).join('')}</div>` : ''}
    ${day.notes.length ? `<div class="section-title">记录</div><div class="mini-notes">${day.notes.map(n => `<div class="mini-note"><span>${fmtTime(n.createdAt)}</span><div>${esc((n.content || '').slice(0, 120))}</div></div>`).join('')}</div>` : ''}
    ${!day.todos.length && !day.habits.length && !day.notes.length ? '<div class="empty small">这一天还没有内容</div>' : ''}
  </div>`;
}

function viewStats() {
  const td = today();
  const doneToday = S.data.todos.filter(t => t.done && t.completedAt && ymd(new Date(t.completedAt)) === td).length;
  let done7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(td, -i);
    done7 += S.data.todos.filter(t => t.done && t.completedAt && ymd(new Date(t.completedAt)) === d).length;
  }
  const checkins = S.data.habits.reduce((s, h) => s + Object.keys(h.records || {}).length, 0);
  const days14 = [];
  for (let i = 13; i >= 0; i--) days14.push(addDays(td, -i));
  const counts = days14.map(d => S.data.todos.filter(t => t.done && t.completedAt && ymd(new Date(t.completedAt)) === d).length);
  const max = Math.max(1, ...counts);
  let focus7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(td, -i);
    focus7 += (S.data.focus || []).filter(f => f.endedAt && ymd(new Date(f.endedAt)) === d).reduce((s, f) => s + (f.minutes || 0), 0);
  }
  const projStats = S.data.projects.map(p => ({ name: p.icon + ' ' + p.name, n: S.data.todos.filter(t => !t.done && t.projectId === p.id).length }));
  projStats.push({ name: '📥 收集箱', n: S.data.todos.filter(t => !t.done && !t.projectId).length });
  const pmax = Math.max(1, ...projStats.map(p => p.n));
  const days7 = [];
  for (let i = 0; i < 7; i++) days7.push(addDays(td, -i));
  const focusTodayList = (S.data.focus || []).filter(f => f.endedAt && ymd(new Date(f.endedAt)) === td);
  const statBig = (label, num, unit) => `<div class="stat-big"><div class="stat-lab">${label}</div><div class="stat-num-xl">${num}${unit ? `<span>${unit}</span>` : ''}</div></div>`;
  return `
  <section class="card">
    <div class="card-head"><h2>专注统计</h2><span class="stat-ic">${IC(P.clock, 18)}</span></div>
    <div class="stat-row">
      ${statBig('今日次数', focusTodayList.length, '次')}
      ${statBig('今日时长', pomoTodayMinutes(), '分钟')}
      ${statBig('近7天专注', focus7, '分钟')}
    </div>
  </section>
  <section class="card">
    <div class="card-head"><h2>任务与习惯</h2><span class="stat-ic">${IC(P.list, 18)}</span></div>
    <div class="stat-row">
      ${statBig('今日完成', doneToday, '个')}
      ${statBig('近7天完成', done7, '个')}
      ${statBig('习惯打卡', checkins, '次')}
      ${statBig('随手记录', S.data.notes.length, '条')}
    </div>
  </section>
  <div class="card">
    <div class="card-head"><h2>完成趋势</h2><span class="pill-chip">近 14 天</span></div>
    ${counts.some(c => c > 0) ? `<div class="bars">
      ${days14.map((d, i) => `<div class="bar-col">
        <span class="bar-val">${counts[i] || ''}</span>
        <div class="bar" style="height:${counts[i] ? Math.max(6, Math.round(counts[i] / max * 100)) : 2}%"></div>
        <span class="bar-lab">${d.slice(5).replace('-', '/')}</span>
      </div>`).join('')}
    </div>` : '<div class="empty">暂无完成数据，完成任务后这里会显示趋势</div>'}
  </div>
  <div class="card">
    <div class="card-head"><h2>习惯热力图</h2><span class="pill-chip">近 30 天</span></div>
    ${S.data.habits.length ? S.data.habits.map(h => `<div class="heat-line">
      <span class="heat-name">${h.icon} ${esc(h.name)}</span>
      <span class="heat-cells">${last30().map(d => `<i class="heat-cell ${h.records && h.records[d] ? 'on' : ''}" style="--c:${h.color}" title="${d}"></i>`).join('')}</span>
    </div>`).join('') : '<div class="empty small">还没有习惯</div>'}
  </div>
  <div class="card">
    <div class="card-head"><h2>未完成任务分布</h2><span class="stat-ic">${IC(P.chart, 18)}</span></div>
    ${projStats.map(p => `<div class="dist"><span class="dist-name">${p.name}</span><div class="dist-bar"><i style="width:${Math.round(p.n / pmax * 100)}%"></i></div><span class="dist-n">${p.n}</span></div>`).join('')}
  </div>`;
}

function viewSettings() {
  const st = S.data.settings || {};
  const themeOpts = [['light', '浅色'], ['dark', '深色'], ['auto', '跟随系统']];
  const accents = ['#e4574c', '#f59e0b', '#10b981', '#4f6ef7', '#ec4899', '#8b5cf6', '#06b6d4'];
  return `
  <div class="card">
    <div class="card-head"><h2>账号</h2></div>
    <div class="setting-row">
      <span class="setting-label profile-line">${avatar(S.user.id, S.user.name, 36, S.user.avatar)} <b>${esc(S.user.name)}</b>${isAdmin() ? ' <span class="tag">管理员</span>' : ''}</span>
      <div class="btn-row">
        <button class="btn" data-act="profile:edit">编辑资料</button>
        <button class="btn danger ghost" data-act="auth:logout">退出登录</button>
      </div>
    </div>
    <p class="hint">昵称和头像会显示在聊天与社区中；每个账号的数据相互独立，换个设备登录同一账号即可看到相同内容。</p>
  </div>
  <div class="card">
    <div class="card-head"><h2>外观</h2></div>
    <div class="setting-row">
      <span class="setting-label">主题</span>
      <div class="seg">${themeOpts.map(([v, l]) => `<button class="seg-btn ${(st.theme || 'light') === v ? 'on' : ''}" data-act="settings:theme" data-v="${v}">${l}</button>`).join('')}</div>
    </div>
    <div class="setting-row">
      <span class="setting-label">强调色</span>
      <div class="swatches">${accents.map(c => `<button class="swatch ${(st.accent || '#4f6ef7') === c ? 'on' : ''}" style="--c:${c}" data-act="settings:accent" data-v="${c}" aria-label="${c}"></button>`).join('')}</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><h2>数据管理</h2></div>
    <div class="setting-row">
      <span class="setting-label">备份与恢复</span>
      <div class="btn-row">
        <button class="btn" data-act="settings:export">${IC(P.download, 16)} 导出备份</button>
        <button class="btn" data-act="settings:import">${IC(P.upload, 16)} 导入备份</button>
        <input type="file" id="import-file" accept=".json,application/json" hidden>
      </div>
    </div>
    <div class="setting-row">
      <span class="setting-label">危险操作</span>
      <button class="btn danger ghost" data-act="settings:clear">清除所有数据</button>
    </div>
    <p class="hint">数据保存在电脑本地 <code>D:\\Tdaily\\data\\db.json</code>，不会上传到互联网。</p>
  </div>
  <div class="card">
    <div class="card-head"><h2>双端访问</h2></div>
    <div class="kv"><span>本机地址</span><code>${location.origin}</code></div>
    <div class="kv" id="lan-box"><span>局域网地址</span><code>检测中…</code></div>
    <p class="hint">手机与电脑连接同一 WiFi 后，用手机浏览器打开局域网地址即可使用；在浏览器菜单中选择「添加到主屏幕」，就能像 App 一样打开 Tdaily。</p>
  </div>
  <div class="card about-card">
    <div class="logo big">T</div>
    <div>
      <div class="about-name">Tdaily</div>
      <div class="hint" style="margin-top:2px">v1.7 · 真实姓名 · Excel 导入导出 · 好友私信 · 班务管理</div>
    </div>
  </div>`;
}

function stepRow(s) {
  return `<div class="step-row" data-done="${s.done ? 1 : 0}">
    <button type="button" class="ck mini ${s.done ? 'on' : ''}" data-act="step:toggle" aria-label="完成步骤">${IC(P.check, 10)}</button>
    <input class="input step-input" type="text" value="${esc(s.text || '')}" placeholder="步骤内容" maxlength="100">
    <button type="button" class="icon-btn tiny" data-act="step:del" aria-label="删除步骤">${IC(P.x, 13)}</button>
  </div>`;
}

function handleApiError(e, fallback) {
  if (e && e.status === 401) { location.reload(); return; }
  toast((e && e.message) || fallback || '操作失败');
}

function isAdmin() {
  return !!(S.user && S.user.role === 'admin');
}

function chatNowActive() {
  const n = route().name;
  return n === 'chat' || (n === 'social' && (S.ui.socialTab || 'chat') === 'chat');
}

function feedNowActive() {
  const n = route().name;
  return n === 'feed' || (n === 'social' && S.ui.socialTab === 'feed');
}

function copyText(text) {
  const done = () => toast('已复制到剪贴板');
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      ta.remove();
      done();
    } catch (e) { toast('复制失败，请手动选择复制'); }
  };
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

function syncUnread() {
  S.social.unread = (S.social.rooms || []).reduce((s, r) => s + (r.unread || 0), 0);
}

function roomItem(r) {
  const active = S.social.activeRoom === r.id;
  return `<button class="room ${active ? 'active' : ''}" data-act="chat:room" data-id="${r.id}">
    <span class="room-ic">${r.icon || '💬'}</span>
    <span class="room-info">
      <span class="room-name">${esc(r.name)}${r.unread ? '<i class="rdot"></i>' : ''}</span>
      <span class="room-last">${r.last ? esc(r.last.userName) + '：' + esc(String(r.last.content).slice(0, 16)) : '暂无消息'}</span>
    </span>
  </button>`;
}

function msgItem(m, prev) {
  const mine = m.userId === S.user.id;
  const tight = prev && prev.userId === m.userId && m.createdAt - prev.createdAt < 300000;
  return `<div class="msg ${mine ? 'mine' : ''} ${tight ? 'tight' : ''}" data-msg="${m.id}">
    ${tight ? '<span class="avatar ghost" style="width:34px;height:34px"></span>' : avatar(m.userId, m.userName, 34, m.av)}
    <div class="msg-body">
      <div class="msg-head">
        <span class="msg-name">${esc(m.userName)}</span>
        <span class="msg-time">${fmtTime(m.createdAt)}</span>
        ${(mine || isAdmin()) ? `<button class="icon-btn tiny msg-del" data-act="chat:delMsg" data-id="${m.id}" aria-label="撤回">${IC(P.x, 12)}</button>` : ''}
      </div>
      <div class="msg-bubble">${esc(m.content).replace(/\n/g, '<br>')}</div>
    </div>
  </div>`;
}

function viewChat() {
  const rooms = S.social.rooms || [];
  const active = S.social.activeRoom;
  const activeRoom = rooms.find(r => r.id === active);
  const msgs = S.social.messages || [];
  return `
  <div class="chat-layout">
    <aside class="card chat-rooms">
      <div class="card-head"><h2>聊天室</h2><button class="icon-btn" data-act="chat:newRoom" aria-label="新建聊天室">${IC(P.plus, 18)}</button></div>
      <div class="room-list" id="room-list">${rooms.length ? rooms.map(roomItem).join('') : '<div class="empty small">还没有聊天室</div>'}</div>
    </aside>
    <section class="card chat-main">
      <div class="chat-head">
        <div>
          <div class="chat-title">${activeRoom ? esc(activeRoom.icon + ' ' + activeRoom.name) : '未选择聊天室'}</div>
          <div class="hint" style="margin:0">${activeRoom ? '所有人可见的公共聊天室' : '从列表中选择一个聊天室'}</div>
        </div>
        <span class="spacer"></span>
        ${activeRoom && activeRoom.creatorId === S.user.id ? `<button class="icon-btn" data-act="chat:delRoom" data-id="${activeRoom.id}" aria-label="删除聊天室">${IC(P.trash, 16)}</button>` : ''}
      </div>
      <div class="chat-msgs" id="chat-msgs">${activeRoom ? (msgs.length ? msgs.map((m, i) => msgItem(m, i > 0 ? msgs[i - 1] : null)).join('') : '<div class="empty small">还没有消息，来说第一句吧</div>') : '<div class="empty small">先选择一个聊天室</div>'}</div>
      <form class="chat-input" data-form="chat:send">
        <input name="content" id="chat-input" data-draft="chat" value="${esc(S.drafts.chat || '')}" placeholder="${activeRoom ? '说点什么…' : '请先选择聊天室'}" autocomplete="off" ${activeRoom ? '' : 'disabled'}>
        <button class="btn primary" type="submit" ${activeRoom ? '' : 'disabled'}>发送</button>
      </form>
    </section>
  </div>`;
}

function postItem(p) {
  const mine = p.userId === S.user.id;
  const open = !!S.ui.openComments[p.id];
  const comments = p.comments || [];
  return `<div class="card post" data-post="${p.id}">
    <div class="post-head">
      ${avatar(p.userId, p.userName, 38, p.av)}
      <div class="post-who">
        <div class="post-name">${esc(p.userName)}${mine ? ' <span class="me-tag">我</span>' : ''}</div>
        <div class="post-time">${timeAgo(p.createdAt)}</div>
      </div>
      <span class="spacer"></span>
      ${(mine || isAdmin()) ? `<button class="icon-btn" data-act="post:del" data-id="${p.id}" aria-label="删除">${IC(P.trash, 15)}</button>` : ''}
    </div>
    <div class="post-content">${esc(p.content).replace(/\n/g, '<br>')}</div>
    <div class="post-actions">
      <button class="pa ${p.liked ? 'liked' : ''}" data-act="post:like" data-id="${p.id}">${IC(P.heart, 16)}<span>${p.likeCount ? p.likeCount : ''}</span></button>
      <button class="pa ${open ? 'on' : ''}" data-act="post:comments" data-id="${p.id}">${IC(P.chat, 16)}<span>${comments.length ? comments.length : ''}</span></button>
    </div>
    ${open ? `<div class="comments">
      ${comments.length ? comments.map(c => `<div class="comment">
        ${avatar(c.userId, c.userName, 26, c.av)}
        <div class="comment-body">
          <div class="comment-head">
            <span class="comment-name">${esc(c.userName)}</span>
            <span class="comment-time">${timeAgo(c.createdAt)}</span>
            <span class="spacer"></span>
            ${(c.userId === S.user.id || isAdmin()) ? `<button class="icon-btn tiny" data-act="comment:del" data-pid="${p.id}" data-id="${c.id}" aria-label="删除评论">${IC(P.x, 13)}</button>` : ''}
          </div>
          <div class="comment-text">${esc(c.content).replace(/\n/g, '<br>')}</div>
        </div>
      </div>`).join('') : '<div class="hint" style="margin:0">还没有评论，来抢沙发</div>'}
      <form class="comment-form" data-form="post:comment" data-id="${p.id}">
        <input class="input" name="content" id="cmt-${p.id}" data-draft="c${p.id}" value="${esc(S.drafts['c' + p.id] || '')}" placeholder="写评论…" autocomplete="off">
        <button class="btn primary small" type="submit">发送</button>
      </form>
    </div>` : ''}
  </div>`;
}

function viewFeed() {
  const posts = S.social.posts || [];
  return `
  <form class="card composer" data-form="post:add">
    <textarea id="post-draft" name="content" data-draft="post" rows="3" placeholder="分享点什么…（所有人可见）">${esc(S.drafts.post || '')}</textarea>
    <div class="composer-bar">
      <span class="hint" style="margin:0">友善发言，共建社区</span>
      <span class="spacer"></span>
      <button class="btn primary" type="submit">发布</button>
    </div>
  </form>
  <div class="list-tools">
    <span class="count">${posts.length} 条动态</span>
    <span class="spacer"></span>
    <button class="btn ghost small" data-act="feed:refresh">${IC(P.refresh, 15)} 刷新</button>
  </div>
  ${posts.length ? posts.map(postItem).join('') : '<div class="card empty">📣 还没有动态，发布第一条吧</div>'}`;
}

async function loadRooms() {
  try {
    const d = await api('GET', '/api/social/rooms');
    S.social.rooms = d.rooms || [];
    syncUnread();
  } catch (e) { handleApiError(e); }
}

async function loadMessages() {
  const id = S.social.activeRoom;
  if (!id) { S.social.messages = []; return; }
  try {
    const d = await api('GET', `/api/social/rooms/${id}/messages`);
    S.social.messages = d.messages || [];
    const r = (S.social.rooms || []).find(x => x.id === id);
    if (r) r.unread = 0;
    syncUnread();
    await api('POST', `/api/social/rooms/${id}/read`);
  } catch (e) { handleApiError(e); }
}

async function openRoom(id) {
  if (!id) return;
  S.social.activeRoom = id;
  const r = (S.social.rooms || []).find(x => x.id === id);
  if (r) r.unread = 0;
  syncUnread();
  await loadMessages();
  render();
  scrollChatBottom();
}

async function chatEnter() {
  await loadRooms();
  if (!S.social.activeRoom && (S.social.rooms || []).length) S.social.activeRoom = S.social.rooms[0].id;
  await loadMessages();
  if (chatNowActive()) render();
  scrollChatBottom();
  startChatPoll();
}

function startChatPoll() {
  stopChatPoll();
  S.social.poll = setInterval(chatPoll, 3000);
}

function stopChatPoll() {
  if (S.social.poll) { clearInterval(S.social.poll); S.social.poll = null; }
}

async function chatPoll() {
  if (!chatNowActive()) { stopChatPoll(); return; }
  try {
    await loadRooms();
    const id = S.social.activeRoom;
    if (id) {
      const msgs = S.social.messages || [];
      const after = msgs.length ? msgs[msgs.length - 1].createdAt : 0;
      const d = await api('GET', `/api/social/rooms/${id}/messages?after=${after}`);
      const fresh = d.messages || [];
      if (fresh.length) {
        S.social.messages = msgs.concat(fresh);
        appendMsgsDom(fresh);
        const r = (S.social.rooms || []).find(x => x.id === id);
        if (r) r.unread = 0;
        syncUnread();
        api('POST', `/api/social/rooms/${id}/read`).catch(() => {});
      }
    }
    updateRoomListDom();
    renderNav();
  } catch (e) { handleApiError(e); }
}

function appendMsgsDom(list) {
  const box = document.getElementById('chat-msgs');
  if (!box) return;
  const all = S.social.messages || [];
  const start = all.length - list.length;
  let html = '';
  list.forEach((m, i) => {
    const prev = (start + i) > 0 ? all[start + i - 1] : null;
    html += msgItem(m, prev);
  });
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
  if (box.querySelector('.empty')) box.innerHTML = html;
  else box.insertAdjacentHTML('beforeend', html);
  if (near) box.scrollTop = box.scrollHeight;
}

function updateRoomListDom() {
  const box = document.getElementById('room-list');
  if (!box) return;
  const rooms = S.social.rooms || [];
  box.innerHTML = rooms.length ? rooms.map(roomItem).join('') : '<div class="empty small">还没有聊天室</div>';
}

function scrollChatBottom() {
  const box = document.getElementById('chat-msgs');
  if (box) box.scrollTop = box.scrollHeight;
}

async function feedEnter() {
  try {
    const d = await api('GET', '/api/social/posts');
    S.social.posts = d.posts || [];
  } catch (e) { handleApiError(e); }
  if (feedNowActive()) render();
}

function updatePostDom(p) {
  const node = document.querySelector('[data-post="' + p.id + '"]');
  if (!node || !p) return;
  const ae = document.activeElement;
  const fid = ae && ae.id ? ae.id : null;
  node.outerHTML = postItem(p);
  if (fid) {
    const el = document.getElementById(fid);
    if (el && el.focus) el.focus();
  }
}

function openRoomModal() {
  const EMOJIS = ['💬', '🎮', '📚', '🎵', '⚽', '🍜', '💼', '🌍', '🎬', '🐱', '🧠', '☕'];
  openModal(`<form data-form="chat:newRoom">
    <div class="modal-head"><h3>新建聊天室</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">名称<input class="input" name="name" id="room-name" placeholder="例如：摸鱼群、学习小组" maxlength="12" required></label>
      <div class="field">图标<div class="emoji-grid">${EMOJIS.map((e, i) => `<button type="button" class="emoji-opt ${i === 0 ? 'on' : ''}" data-act="pick:roomIcon" data-v="${e}">${e}</button>`).join('')}</div></div>
      <input type="hidden" name="icon" id="room-icon" value="💬">
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">创建</button></div>
  </form>`);
  setTimeout(() => { const el = $('#room-name'); if (el) el.focus(); }, 40);
}

function openProfileModal() {
  const EMOJIS = ['😀', '😎', '🐱', '🐶', '🦊', '🐼', '🐸', '🦁', '🐹', '🐧', '🦉', '🐢', '🌟', '🍀', '🔥', '🚀', '🎈', '🎧', '🍑', '🥑', '🌈', '⭐'];
  openModal(`<form data-form="profile:save">
    <div class="modal-head"><h3>编辑资料</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">昵称<input class="input" name="name" id="pf-name" value="${esc(S.user.name)}" maxlength="20" required></label>
      <label class="field">邮箱<input class="input" type="email" name="email" value="${esc(S.user.email || '')}" placeholder="邮箱（可选）"></label>
      <div class="field">头像<div class="emoji-grid">${['', ...EMOJIS].map(e => `<button type="button" class="emoji-opt ${(S.user.avatar || '') === e ? 'on' : ''}" data-act="pick:avatar" data-v="${e}">${e || '<span class="hint" style="font-size:11px">无</span>'}</button>`).join('')}</div></div>
      <input type="hidden" name="avatar" id="pf-avatar" value="${esc(S.user.avatar || '')}">
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">保存</button></div>
  </form>`);
  setTimeout(() => { const el = $('#pf-name'); if (el) el.focus(); }, 40);
}

function pomoTodayMinutes() {
  const td = today();
  return (S.data.focus || []).filter(f => f.endedAt && ymd(new Date(f.endedAt)) === td).reduce((s, f) => s + (f.minutes || 0), 0);
}

function updatePomoDom() {
  const el = document.getElementById('pomo-time');
  if (el) el.textContent = fmtClock(S.pomo.remain);
  const btn = document.getElementById('pomo-btn');
  if (btn) btn.textContent = S.pomo.running ? '暂停' : (S.pomo.remain < S.pomo.total ? '继续' : '开始');
  const t = document.getElementById('pomo-today');
  if (t) t.textContent = `今日 ${pomoTodayMinutes()} 分钟`;
  $$('.pomo-modes .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.v) === S.pomo.minutes));
}

function pomoSave() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('td_pomo', JSON.stringify({ minutes: S.pomo.minutes, remain: S.pomo.remain, endAt: S.pomo.running ? S.pomo.endAt : 0 }));
  } catch (e) {}
}

function pomoStart() {
  if (S.pomo.remain <= 0) S.pomo.remain = S.pomo.total;
  S.pomo.running = true;
  S.pomo.endAt = Date.now() + S.pomo.remain * 1000;
  clearInterval(S.pomo.timer);
  S.pomo.timer = setInterval(pomoTick, 250);
  pomoSave();
  updatePomoDom();
}

function pomoPause() {
  S.pomo.running = false;
  clearInterval(S.pomo.timer);
  S.pomo.timer = null;
  pomoSave();
  updatePomoDom();
}

function pomoTick() {
  if (!S.pomo.running) return;
  S.pomo.remain = Math.max(0, Math.ceil((S.pomo.endAt - Date.now()) / 1000));
  if (S.pomo.remain <= 0) { pomoFinish(); return; }
  updatePomoDom();
}

async function pomoFinish() {
  S.pomo.running = false;
  clearInterval(S.pomo.timer);
  S.pomo.timer = null;
  const minutes = S.pomo.minutes;
  S.pomo.remain = S.pomo.total;
  updatePomoDom();
  try { await post('focus', { minutes, endedAt: Date.now() }); } catch (e) {}
  toast(`专注完成 🍅 已记录 ${minutes} 分钟`);
}

function pomoRestore() {
  try {
    if (typeof localStorage === 'undefined') return;
    const j = JSON.parse(localStorage.getItem('td_pomo') || 'null');
    if (!j) return;
    S.pomo.minutes = j.minutes || 25;
    S.pomo.total = S.pomo.minutes * 60;
    if (j.endAt && j.endAt > Date.now()) {
      S.pomo.remain = Math.ceil((j.endAt - Date.now()) / 1000);
      pomoStart();
    } else {
      S.pomo.remain = Math.min(j.remain || S.pomo.total, S.pomo.total);
    }
  } catch (e) {}
}

async function loadClassData() {
  try {
    S.classData = await api('GET', '/api/class');
  } catch (e) { handleApiError(e); }
  if (route().name === 'class') render();
}

function classLanding() {
  return `
  <div class="card head-card">
    <div><h2 style="margin:0;font-size:15.5px">班务管理</h2><p class="hint" style="margin:4px 0 0">班长创建班级，同学凭班级码 + 学号加入，支持收集资料、投票、抽人、统计</p></div>
  </div>
  <div class="class-landing">
    <div class="card class-opt">
      <div class="opt-ic">🏫</div>
      <h3>创建班级</h3>
      <p class="hint">粘贴学号名单，生成班级码发到班级群</p>
      <button class="btn primary" data-act="class:create">创建班级</button>
    </div>
    <div class="card class-opt">
      <div class="opt-ic">🙋</div>
      <h3>加入班级</h3>
      <p class="hint">输入班长发的班级码和你的学号</p>
      <button class="btn" data-act="class:join">加入班级</button>
    </div>
  </div>`;
}

function classHome(C) {
  const data = S.classData;
  const cols = data.collections || [];
  const polls = data.polls || [];
  const draws = data.draws || [];
  const rate = C.total ? Math.round(C.joined / C.total * 100) : 0;
  const statCard = (label, num) => `<div class="stat-card"><div class="stat-num">${num}</div><div class="stat-lab">${label}</div></div>`;
  const latestDraw = draws[0];
  return `
  <div class="stat-cards">
    ${statCard('学生总数', C.total)}
    ${statCard('已加入', C.joined + ' 人 · ' + rate + '%')}
    ${statCard('收集任务', cols.filter(c => !c.closed).length + ' 进行中')}
    ${statCard('投票', polls.filter(p => !p.closed).length + ' 进行中')}
  </div>
  <div class="card">
    <div class="card-head"><h2>资料收集进度</h2></div>
    ${cols.length ? cols.slice(0, 5).map(c => `<div class="dist"><span class="dist-name">${esc(c.title)}</span><div class="dist-bar"><i style="width:${C.joined ? Math.round((c.subCount || 0) / C.joined * 100) : 0}%"></i></div><span class="dist-n">${c.subCount || 0}/${C.joined}</span></div>`).join('') : '<div class="empty small">暂无收集任务</div>'}
  </div>
  <div class="card">
    <div class="card-head"><h2>最近抽人</h2></div>
    ${latestDraw ? `<div class="hint" style="margin:0 0 8px">${fmtDateTime(latestDraw.at)} · ${esc(latestDraw.by)}${latestDraw.fair ? ' · 公平模式' : ''}</div><div class="hchips">${latestDraw.picks.map(p => `<span class="tag">${esc(p.name || '—')} ${esc(p.sid)}</span>`).join('')}</div>` : '<div class="empty small">还没有抽过</div>'}
  </div>`;
}

function collectCard(c, C) {
  const pct = C.joined ? Math.round((c.subCount || 0) / C.joined * 100) : 0;
  const mine = c.mine;
  return `<div class="card collect-card">
    <div class="collect-head">
      <div><b>${esc(c.title)}</b><div class="hint" style="margin:2px 0 0">${c.fields.length} 项 · ${c.closed ? '已结束' : '进行中'}</div></div>
      <span class="spacer"></span>
      <span class="tag">${c.closed ? '已结束' : '进行中'}</span>
    </div>
    <div class="dist"><div class="dist-bar"><i style="width:${pct}%"></i></div><span class="dist-n">${c.subCount || 0}/${C.joined}</span></div>
    <div class="collect-acts">
      ${(!c.closed || mine) ? `<button class="btn small ${mine ? '' : 'primary'}" data-act="collect:fill" data-id="${c.id}">${c.closed ? '查看我的提交' : mine ? '修改提交' : '去填写'}</button>` : ''}
      ${C.isOwner ? `<button class="btn small ghost" data-act="collect:view" data-id="${c.id}">查看结果</button>` : ''}
      ${C.isOwner ? `<button class="btn small ghost" data-act="collect:export" data-id="${c.id}">导出</button>` : ''}
      ${C.isOwner && !c.closed ? `<button class="btn small ghost" data-act="collect:close" data-id="${c.id}">结束</button>` : ''}
      ${C.isOwner ? `<button class="btn small danger ghost" data-act="collect:delete" data-id="${c.id}">删除</button>` : ''}
    </div>
  </div>`;
}

function classCollect(C) {
  const cols = S.classData.collections || [];
  return `
  <div class="card head-card">
    <div><h2 style="margin:0;font-size:15.5px">资料收集</h2><p class="hint" style="margin:4px 0 0">发布任务 · 同学填写 · 一眼看清谁没交</p></div>
    ${C.isOwner ? '<button class="btn primary" data-act="collect:new">+ 新建收集</button>' : ''}
  </div>
  ${cols.length ? cols.map(c => collectCard(c, C)).join('') : '<div class="card empty">还没有收集任务</div>'}`;
}

function pollCard(p, C) {
  const sel = S.ui.pollSel[p.id] || p.myVotes || [];
  const total = p.tally.reduce((a, b) => a + b, 0);
  const changed = JSON.stringify(sel.slice().sort((a, b) => a - b)) !== JSON.stringify((p.myVotes || []).slice().sort((a, b) => a - b));
  const rows = p.options.map((o, i) => {
    const n = p.tally[i] || 0;
    const pct = total ? Math.round(n / total * 100) : 0;
    const on = sel.includes(i);
    const names = (!p.anonymous && p.voters && p.voters[i] && p.voters[i].length) ? '投票：' + p.voters[i].join('、') : '';
    const inner = `<i class="opt-fill" style="width:${pct}%"></i><span class="opt-txt">${esc(o)}</span><span class="opt-n">${n}${total ? ' · ' + pct + '%' : ''}</span>`;
    return p.closed
      ? `<div class="opt-row done" title="${esc(names)}">${inner}</div>`
      : `<button class="opt-row ${on ? 'on' : ''}" data-act="poll:pick" data-id="${p.id}" data-i="${i}" title="${esc(names)}">${inner}</button>`;
  }).join('');
  return `<div class="card collect-card">
    <div class="collect-head">
      <div><b>${esc(p.title)}</b><div class="hint" style="margin:2px 0 0">${p.multi ? '多选' : '单选'} · ${p.anonymous ? '匿名' : '实名'} · ${p.voteCount} 人已投</div></div>
      <span class="spacer"></span>
      <span class="tag">${p.closed ? '已结束' : '进行中'}</span>
    </div>
    ${rows}
    ${(!p.closed && C) ? `<div class="collect-acts">
      ${changed ? `<button class="btn small primary" data-act="poll:submit" data-id="${p.id}">提交投票</button>` : ((p.myVotes && p.myVotes.length) ? '<span class="hint" style="margin:0">你已投票，可随时改票</span>' : '<span class="hint" style="margin:0">点击选项进行投票</span>')}
      ${C.isOwner ? `<span class="spacer"></span><button class="btn small ghost" data-act="poll:export" data-id="${p.id}">导出</button><button class="btn small ghost" data-act="poll:close" data-id="${p.id}">结束</button>` : ''}
    </div>` : ''}
    ${(p.closed && C && C.isOwner) ? `<div class="collect-acts"><span class="spacer"></span><button class="btn small ghost" data-act="poll:export" data-id="${p.id}">导出</button><button class="btn small danger ghost" data-act="poll:delete" data-id="${p.id}">删除</button></div>` : ''}
    ${(C.isOwner && !p.closed && p.notVoted && p.notVoted.length) ? `<div class="section-title" style="margin-top:10px">未投票 · ${p.notVoted.length}</div><div class="hchips">${p.notVoted.map(n => `<span class="tag">${esc(n)}</span>`).join('')}</div>` : ''}
  </div>`;
}

function classPoll(C) {
  const polls = S.classData.polls || [];
  return `
  <div class="card head-card">
    <div><h2 style="margin:0;font-size:15.5px">班级投票</h2><p class="hint" style="margin:4px 0 0">单选 / 多选 / 匿名，票数实时可见</p></div>
    ${C.isOwner ? '<button class="btn primary" data-act="poll:new">+ 新建投票</button>' : ''}
  </div>
  ${polls.length ? polls.map(p => pollCard(p, C)).join('') : '<div class="card empty">还没有投票</div>'}`;
}

function classDrawStats() {
  const data = S.classData;
  const counts = data.drawCounts || {};
  const rows = (data.students || []).filter(s => s.sid).map(s => Object.assign({}, s, { n: counts[s.sid] || 0 }))
    .sort((a, b) => b.n - a.n || String(a.sid).localeCompare(String(b.sid)));
  const max = Math.max(1, ...rows.map(r => r.n));
  return `<div class="card">
    <div class="card-head"><h2>被抽次数统计</h2></div>
    ${rows.length ? rows.map(s => `<div class="dist"><span class="dist-name">${esc(s.name || '—')} <span class="hint">${esc(s.sid)}</span></span><div class="dist-bar"><i style="width:${Math.round(s.n / max * 100)}%"></i></div><span class="dist-n">${s.n}</span></div>`).join('') : '<div class="empty small">暂无学生</div>'}
  </div>`;
}

function classDrawView(C) {
  const draws = S.classData.draws || [];
  const history = `<div class="card">
    <div class="card-head"><h2>抽人记录</h2><button class="btn small ghost" data-act="draw:export">导出记录</button></div>
    ${draws.length ? draws.map(d => `<div class="draw-row"><span class="hint">${fmtDateTime(d.at)} · ${esc(d.by)}${d.fair ? ' · 公平' : ''}</span><span>${d.picks.map(p => esc(p.name || p.sid)).join('、')}</span></div>`).join('') : '<div class="empty small">还没有记录</div>'}
  </div>`;
  if (!C.isOwner) {
    return `<div class="card empty small">抽人由班长发起，这里是记录与统计</div>${history}${classDrawStats()}`;
  }
  const result = S.ui.draw.result;
  return `
  <div class="card">
    <div class="card-head"><h2>随机抽人</h2><label class="fair-toggle"><input type="checkbox" id="draw-fair" ${S.ui.draw.fair ? 'checked' : ''}> 公平模式</label></div>
    <div class="draw-controls">
      <span class="setting-label">人数</span>
      <div class="chips">${[1, 2, 3, 5].map(n => `<button class="chip ${S.ui.draw.count === n ? 'on' : ''}" data-act="draw:count" data-v="${n}">${n} 人</button>`).join('')}</div>
    </div>
    <div class="draw-stage" id="draw-stage">${result ? result.map(r => `<div class="draw-pick"><div class="draw-name">${esc(r.name || '—')}</div><div class="draw-sid">${esc(r.sid)}</div><div class="hint">已抽 ${r.count} 次</div></div>`).join('') : '<div class="empty small">点下面的按钮开始抽人<br><span class="hint">公平模式会优先抽被抽次数少的同学</span></div>'}</div>
    <div class="row-end"><button class="btn primary" id="draw-btn" data-act="draw:go">🎲 抽！</button></div>
  </div>
  ${history}
  ${classDrawStats()}`;
}

function classManage(C) {
  const data = S.classData;
  const students = data.students || [];
  return `
  <div class="card">
    <div class="card-head"><h2>班级码</h2></div>
    <div class="setting-row">
      <span class="class-code-big">${C.code}</span>
      <div class="btn-row">
        <button class="btn" data-act="class:copyCode">复制班级码</button>
        ${C.isOwner ? '<button class="btn ghost" data-act="class:resetCode">重置</button>' : ''}
      </div>
    </div>
    <p class="hint">把班级码发到班级群：同学注册 Tdaily 后，进入「班级 → 加入班级」，输入班级码 + 自己的学号即可加入。</p>
  </div>
  <div class="card">
    <div class="card-head"><h2>学生名单（${C.joined}/${C.total} 已加入）</h2><div class="btn-row"><button class="btn small ghost" data-act="class:exportRoster">导出名单</button>${C.isOwner ? '<button class="btn small" data-act="class:addStudents">+ 添加学号</button>' : ''}</div></div>
    ${students.length ? students.map(s => `<div class="student-row">
      <span class="stu-name">${esc(s.name || '—')}</span>
      <span class="stu-sid">${esc(s.sid)}</span>
      <span class="tag ${s.joined ? 'green-tag' : ''}">${s.joined ? '已加入' : '未加入'}</span>
      <span class="spacer"></span>
      ${C.isOwner ? `<button class="icon-btn tiny" data-act="class:renameStudent" data-sid="${esc(s.sid)}" data-name="${esc(s.name || '')}" aria-label="修改姓名">${IC(P.pencil, 13)}</button>` : ''}
      ${C.isOwner ? `<button class="icon-btn tiny" data-act="class:removeStudent" data-sid="${esc(s.sid)}" aria-label="移除">${IC(P.x, 13)}</button>` : ''}
    </div>`).join('') : '<div class="empty small">名单为空，点击「添加学号」导入</div>'}
  </div>
  <div class="card">
    <div class="card-head"><h2>我的信息</h2></div>
    <div class="setting-row"><span class="setting-label">班级内姓名</span><b>${esc(C.my.name || S.user.name)}</b></div>
    <div class="setting-row"><span class="setting-label">账号昵称</span><b>${esc(S.user.name)}</b></div>
    <div class="setting-row"><span class="setting-label">学号</span><b>${esc(C.my.sid || '—')}</b></div>
    ${C.isOwner
      ? '<div class="setting-row"><span class="setting-label">身份</span><b>班长 / 管理员</b></div><div class="row-end"><button class="btn danger ghost" data-act="class:dissolve">解散班级</button></div>'
      : '<div class="setting-row"><span class="setting-label">退出</span><button class="btn danger ghost" data-act="class:leave">退出班级</button></div>'}
  </div>`;
}

function viewClass() {
  const C = S.classData.class;
  if (!C) return classLanding();
  const tabs = [['home', '概览'], ['collect', '资料收集'], ['poll', '投票'], ['draw', '抽人'], ['manage', C.isOwner ? '班级管理' : '成员信息']];
  const t = S.ui.classTab || 'home';
  const body = t === 'collect' ? classCollect(C)
    : t === 'poll' ? classPoll(C)
    : t === 'draw' ? classDrawView(C)
    : t === 'manage' ? classManage(C)
    : classHome(C);
  return `
  <div class="card class-head">
    ${avatar(S.user.id, S.user.name, 40, S.user.avatar)}
    <div class="class-title-wrap">
      <div class="class-name">${esc(C.name)}</div>
      <div class="hint" style="margin:2px 0 0">${C.total} 名学生 · ${C.joined} 人已加入 · 我的学号 ${esc(C.my.sid || '—')}</div>
    </div>
    <span class="spacer"></span>
    ${C.isOwner ? '<span class="tag">班长</span>' : ''}
  </div>
  <div class="chips">${tabs.map(([v, l]) => `<button class="chip ${t === v ? 'on' : ''}" data-act="class:tab" data-v="${v}">${l}</button>`).join('')}</div>
  ${body}`;
}

async function classDrawRun() {
  const C = S.classData.class;
  if (!C || !C.isOwner || S.ui.draw.animating) return;
  const pool = (S.classData.students || []).filter(s => s.sid);
  if (!pool.length) { toast('班级里还没有学生'); return; }
  S.ui.draw.animating = true;
  const stage = document.getElementById('draw-stage');
  const btn = document.getElementById('draw-btn');
  if (btn) btn.disabled = true;
  const n = Math.min(S.ui.draw.count, pool.length);
  let frames = 0;
  const timer = setInterval(async () => {
    frames++;
    if (stage) {
      const sample = pool.slice().sort(() => Math.random() - 0.5).slice(0, n);
      stage.innerHTML = sample.map(s => `<div class="draw-pick rolling"><div class="draw-name">${esc(s.name || '—')}</div><div class="draw-sid">${esc(s.sid)}</div></div>`).join('');
    }
    if (frames >= 15) {
      clearInterval(timer);
      try {
        const r = await api('POST', '/api/class/draw', { count: S.ui.draw.count, fair: S.ui.draw.fair });
        S.ui.draw.result = r.draw.picks;
        S.classData.drawCounts = r.drawCounts;
        S.classData.draws = [r.draw].concat(S.classData.draws || []).slice(0, 20);
        render();
        toast('抽人完成 🎲');
      } catch (e) { handleApiError(e, '抽人失败'); }
      S.ui.draw.animating = false;
    }
  }, 80);
}

function openClassCreateModal() {
  openModal(`<form data-form="class:create">
    <div class="modal-head"><h3>创建班级</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">班级名称<input class="input" name="name" id="cl-name" placeholder="例如：高一(3)班" maxlength="20" required></label>
      <label class="field">我的学号<input class="input" name="mySid" placeholder="例如：20250301" maxlength="30" required></label>
      <label class="field">学生学号名单<textarea class="input" name="roster" id="roster-input" rows="6" placeholder="一行一个学号（或「学号 姓名」），可直接从 Excel 粘贴，或点下方按钮导入表格"></textarea></label>
      <button type="button" class="btn ghost small" data-act="file:importRoster" data-target="create">📄 导入 Excel / CSV 文件</button>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">创建</button></div>
  </form>`);
  setTimeout(() => { const el = $('#cl-name'); if (el) el.focus(); }, 40);
}

function openClassJoinModal() {
  openModal(`<form data-form="class:lookup">
    <div class="modal-head"><h3>加入班级</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">班级码<input class="input" name="code" id="cj-code" placeholder="班长发的 6 位班级码" maxlength="6" required></label>
      <label class="field">我的学号<input class="input" name="sid" placeholder="必须与班长名单中的学号一致" maxlength="30" required></label>
      <p class="hint">点击「查询」，系统会根据学号找到你的姓名。</p>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">查询</button></div>
  </form>`);
  setTimeout(() => { const el = $('#cj-code'); if (el) el.focus(); }, 40);
}

function openJoinConfirm(info, code, sid) {
  const suggested = info.name || S.user.name;
  openModal(`<form data-form="class:join">
    <div class="modal-head"><h3>确认信息</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <div class="kv"><span>班级</span><b>${esc(info.className)}</b></div>
      <div class="kv"><span>学号</span><b>${esc(sid)}</b></div>
      <label class="field">你的真实姓名<input class="input" name="name" id="cj-name" value="${esc(suggested)}" maxlength="20" required></label>
      <p class="hint">${info.name ? '姓名来自班长导入的名单，请确认无误；如有错别字可直接修改。' : '名单中还没有你的姓名，请填写真实姓名（将在班级内显示）。'}</p>
      <input type="hidden" name="code" value="${esc(code)}">
      <input type="hidden" name="sid" value="${esc(sid)}">
    </div>
    <div class="modal-foot"><button type="button" class="btn ghost" data-act="join:back">返回</button><span class="spacer"></span><button class="btn primary" type="submit">确认加入</button></div>
  </form>`);
  setTimeout(() => { const el = $('#cj-name'); if (el) { el.focus(); el.select(); } }, 40);
}

function openCollectNewModal() {
  openModal(`<form data-form="collect:new">
    <div class="modal-head"><h3>新建收集</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">标题<input class="input" name="title" id="cc-title" placeholder="例如：收集大家的联系电话和家庭住址" maxlength="50" required></label>
      <label class="field">需要填写的字段<textarea class="input" name="fields" rows="5" placeholder="一行一个字段名，例如：&#10;联系电话&#10;家庭住址&#10;家长姓名" required></textarea></label>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">发布</button></div>
  </form>`);
  setTimeout(() => { const el = $('#cc-title'); if (el) el.focus(); }, 40);
}

function openCollectFillModal(id) {
  const c = (S.classData.collections || []).find(x => x.id === id);
  if (!c) return;
  const vals = (c.mine && c.mine.values) || [];
  const rows = c.fields.map((f, i) => `<label class="field">${esc(f)}<input class="input" name="f${i}" value="${esc(vals[i] || '')}" ${c.closed ? 'disabled' : ''}></label>`).join('');
  openModal(`<form data-form="collect:submit" data-id="${id}">
    <div class="modal-head"><h3>${esc(c.title)}</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">${rows}${c.closed ? '<p class="hint">该收集已结束，无法修改</p>' : ''}</div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">${c.closed ? '关闭' : '取消'}</button>${c.closed ? '' : '<button class="btn primary" type="submit">提交</button>'}</div>
  </form>`);
}

function openCollectViewModal(id) {
  const c = (S.classData.collections || []).find(x => x.id === id);
  const C = S.classData.class;
  if (!c || !C || !C.isOwner) return;
  const subs = c.subs || [];
  const missing = (S.classData.students || []).filter(s => s.joined && !subs.some(x => x.sid === s.sid));
  const head = ['学号', '姓名'].concat(c.fields).concat(['提交时间']);
  const body = subs.map(s => `<tr><td>${esc(s.sid)}</td><td>${esc(s.name)}</td>${c.fields.map((_, i) => `<td>${esc((s.values || [])[i] || '')}</td>`).join('')}<td class="hint">${fmtDateTime(s.at)}</td></tr>`).join('');
  openModal(`<div>
    <div class="modal-head"><h3>${esc(c.title)} · 提交结果</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      ${subs.length ? `<div class="table-wrap"><table class="data-table"><thead><tr>${head.map(h2 => `<th>${esc(h2)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>` : '<div class="empty small">还没有人提交</div>'}
      <div class="section-title">未提交 · ${missing.length}</div>
      <div class="hchips">${missing.length ? missing.map(s => `<span class="tag">${esc(s.name || '')} ${esc(s.sid)}</span>`).join('') : '<span class="hint">都交齐了 🎉</span>'}</div>
    </div>
    <div class="modal-foot"><button type="button" class="btn" data-act="collect:copy" data-id="${id}">复制为表格</button><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">关闭</button></div>
  </div>`);
}

function openPollNewModal() {
  openModal(`<form data-form="poll:new">
    <div class="modal-head"><h3>新建投票</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">投票主题<input class="input" name="title" id="cp-title" placeholder="例如：春游去哪里？" maxlength="50" required></label>
      <label class="field">选项<textarea class="input" name="options" rows="5" placeholder="一行一个选项，例如：&#10;动物园&#10;科技馆&#10;植物园" required></textarea></label>
      <label class="check-line"><input type="checkbox" name="multi" value="1"> 允许多选</label>
      <label class="check-line"><input type="checkbox" name="anonymous" value="1"> 匿名投票（不显示谁投的）</label>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">发布</button></div>
  </form>`);
  setTimeout(() => { const el = $('#cp-title'); if (el) el.focus(); }, 40);
}

function openRenameStudentModal(sid, name) {
  openModal(`<form data-form="class:renameStudent" data-sid="${esc(sid)}">
    <div class="modal-head"><h3>修改姓名</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">姓名（班级内显示）<input class="input" name="name" id="rs-name" value="${esc(name)}" maxlength="20" required></label>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">保存</button></div>
  </form>`);
  setTimeout(() => { const el = $('#rs-name'); if (el) { el.focus(); el.select(); } }, 40);
}

function openAddStudentsModal() {  openModal(`<form data-form="class:addStudents">
    <div class="modal-head"><h3>添加学号</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">学号列表<textarea class="input" name="list" id="as-list" rows="6" placeholder="一行一个学号（或「学号 姓名」），可粘贴或导入表格"></textarea></label>
      <button type="button" class="btn ghost small" data-act="file:importRoster" data-target="add">📄 导入 Excel / CSV 文件</button>
    </div>
    <div class="modal-foot"><span class="spacer"></span><button type="button" class="btn ghost" data-act="modal:close">取消</button><button class="btn primary" type="submit">添加</button></div>
  </form>`);
  setTimeout(() => { const el = $('#as-list'); if (el) el.focus(); }, 40);
}

function copyCollect(id) {
  const c = (S.classData.collections || []).find(x => x.id === id);
  if (!c || !c.subs) return;
  const head = ['学号', '姓名'].concat(c.fields).join('\t');
  const lines = c.subs.map(s => [s.sid, s.name].concat(s.values || []).join('\t'));
  copyText([head].concat(lines).join('\n'));
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function downloadCSV(filename, rows) {
  const text = '\ufeff' + rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
  if (typeof window !== 'undefined' && window.TdailyAndroid && window.TdailyAndroid.saveFile) {
    try {
      const b64 = btoa(unescape(encodeURIComponent(text)));
      window.TdailyAndroid.saveFile(filename, b64);
      return;
    } catch (e) {}
  }
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportRoster() {
  const C = S.classData.class;
  if (!C) return;
  const counts = S.classData.drawCounts || {};
  const rows = [['学号', '姓名', '是否已加入', '被抽次数']];
  (S.classData.students || []).forEach(s => rows.push([s.sid, s.name || '', s.joined ? '已加入' : '未加入', counts[s.sid] || 0]));
  downloadCSV(`${C.name}-学生名单-${today()}.csv`, rows);
  toast('名单已导出，可用 Excel 打开');
}

function exportCollect(id) {
  const C = S.classData.class;
  const c = (S.classData.collections || []).find(x => x.id === id);
  if (!c || !c.subs) return;
  const rows = [['学号', '姓名'].concat(c.fields).concat(['提交时间'])];
  c.subs.forEach(s => rows.push([s.sid, s.name].concat(s.values || []).concat([fmtDateTime(s.at)])));
  const missing = (S.classData.students || []).filter(s => s.joined && !c.subs.some(x => x.sid === s.sid));
  rows.push([]);
  rows.push(['未提交', missing.map(s => (s.name ? s.name + ' ' : '') + s.sid).join('、')]);
  downloadCSV(`${(C ? C.name : '班级')}-${c.title}-收集结果-${today()}.csv`, rows);
  toast('收集结果已导出');
}

function exportPoll(id) {
  const C = S.classData.class;
  const p = (S.classData.polls || []).find(x => x.id === id);
  if (!p) return;
  const total = p.tally.reduce((a, b) => a + b, 0);
  const header = ['选项', '票数', '占比'];
  if (!p.anonymous) header.push('投票人');
  const rows = [[p.title], header];
  p.options.forEach((o, i) => {
    const row = [o, p.tally[i] || 0, total ? Math.round((p.tally[i] || 0) / total * 100) + '%' : '0%'];
    if (!p.anonymous) row.push(p.voters && p.voters[i] ? p.voters[i].join('、') : '');
    rows.push(row);
  });
  rows.push([]);
  rows.push(['已投票人数', p.voteCount]);
  if (p.notVoted && p.notVoted.length) rows.push(['未投票', p.notVoted.join('、')]);
  downloadCSV(`${(C ? C.name : '班级')}-${p.title}-投票结果-${today()}.csv`, rows);
  toast('投票结果已导出');
}

function exportDraws() {
  const C = S.classData.class;
  if (!C) return;
  const rows = [['时间', '发起人', '公平模式', '抽中名单']];
  (S.classData.draws || []).forEach(d => rows.push([fmtDateTime(d.at), d.by || '', d.fair ? '是' : '否', d.picks.map(p => (p.name ? p.name + ' ' : '') + p.sid).join('、')]));
  const counts = S.classData.drawCounts || {};
  rows.push([]);
  rows.push(['被抽次数统计']);
  (S.classData.students || []).forEach(s => rows.push([s.sid, s.name || '', counts[s.sid] || 0]));
  downloadCSV(`${C.name}-抽人记录-${today()}.csv`, rows);
  toast('抽人记录已导出');
}

function parseCsv(text) {
  const firstLine = String(text).split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delim = firstLine.includes('\t') ? '\t' : (semiCount > commaCount ? ';' : ',');
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === delim) {
      row.push(field); field = '';
    } else if (ch === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.map(r => r.map(c => String(c).trim()));
}

function rosterLines(rows) {
  const clean = (rows || []).filter(r => Array.isArray(r) && r.some(c => String(c || '').trim() !== ''));
  if (!clean.length) return [];
  const cols = Math.max(...clean.map(r => r.length));
  const sidRe = /^[0-9A-Za-z][0-9A-Za-z_-]{2,}$/;
  const cjkRe = /[\u4e00-\u9fa5]/;
  let sidCol = -1;
  let best = 0;
  for (let c = 0; c < cols; c++) {
    let score = 0;
    for (const r of clean) {
      const v = String(r[c] || '').trim();
      if (!v) continue;
      if (sidRe.test(v) && !cjkRe.test(v)) score += 2;
      if (/^\d{4,}$/.test(v)) score += 1;
    }
    if (score > best) { best = score; sidCol = c; }
  }
  if (sidCol < 0) sidCol = 0;
  let nameCol = -1;
  let bestCjk = 0;
  for (let c = 0; c < cols; c++) {
    if (c === sidCol) continue;
    let n = 0;
    for (const r of clean) if (cjkRe.test(String(r[c] || ''))) n++;
    if (n > bestCjk) { bestCjk = n; nameCol = c; }
  }
  const lines = [];
  const seen = new Set();
  for (const r of clean) {
    const sid = String(r[sidCol] || '').trim();
    if (!sid || !sidRe.test(sid) || cjkRe.test(sid)) continue;
    if (seen.has(sid)) continue;
    seen.add(sid);
    const nm = nameCol >= 0 ? String(r[nameCol] || '').trim() : '';
    lines.push(nm ? `${sid} ${nm}` : sid);
  }
  return lines;
}

async function parseRosterFile(file) {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return parseCsv(await file.text());
  }
  if (name.endsWith('.xlsx')) {
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error('读取文件失败'));
      fr.readAsDataURL(file);
    });
    const b64 = String(dataUrl).split(',')[1] || '';
    const r = await api('POST', '/api/class/xlsx-rows', { file: b64 });
    return r.rows || [];
  }
  throw new Error('仅支持 .xlsx / .csv；老版 .xls 请在 Excel 里另存为 .xlsx 或 .csv');
}

function importRoster(target) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.csv,.txt';
  input.onchange = async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('文件太大（限 4MB）'); return; }
    try {
      const rows = await parseRosterFile(file);
      const lines = rosterLines(rows);
      if (!lines.length) { toast('没有识别到学号，请检查表格内容'); return; }
      const box = document.getElementById(target === 'create' ? 'roster-input' : 'as-list');
      if (box) box.value = lines.join('\n');
      toast(`识别到 ${lines.length} 名学生，请核对后提交`);
    } catch (e) {
      toast(e.message || '文件解析失败');
    }
  };
  input.click();
}

async function loadAdmin() {
  try {
    S.adminData = await api('GET', '/api/admin/overview');
    const rooms = S.adminData.rooms || [];
    if (rooms.length && !S.ui.adminRoom) S.ui.adminRoom = rooms[0].id;
    if (S.ui.adminRoom) {
      const dm = await api('GET', '/api/admin/messages?room=' + encodeURIComponent(S.ui.adminRoom));
      S.ui.adminMsgs = dm.messages || [];
    } else {
      S.ui.adminMsgs = [];
    }
  } catch (e) { handleApiError(e); }
  if (route().name === 'admin') render();
}

function adminOverview() {
  const d = S.adminData;
  const s = d.stats || {};
  const statCard = (label, num) => `<div class="stat-card"><div class="stat-num">${num}</div><div class="stat-lab">${label}</div></div>`;
  return `
  <div class="stat-cards">
    ${statCard('用户', s.users || 0)}
    ${statCard('已封禁', s.banned || 0)}
    ${statCard('帖子', s.posts || 0)}
    ${statCard('评论', s.comments || 0)}
    ${statCard('聊天消息', s.messages || 0)}
    ${statCard('班级', s.classes || 0)}
  </div>
  <div class="card">
    <div class="card-head"><h2>班级列表</h2></div>
    ${(d.classes || []).length ? d.classes.map(c => `<div class="student-row"><span class="stu-name">${esc(c.name)}</span><span class="hint">班长 ${esc(c.ownerName || '')} · ${c.joined}/${c.total} 人</span><span class="spacer"></span><button class="btn small danger ghost" data-act="admin:classdel" data-id="${c.id}">解散</button></div>`).join('') : '<div class="empty small">暂无班级</div>'}
  </div>`;
}

function adminUsers() {
  const d = S.adminData;
  return `<div class="card">
    <div class="card-head"><h2>用户（${(d.users || []).length}）</h2></div>
    ${(d.users || []).map(u => `<div class="admin-user">
      ${avatar(u.id, u.name, 34, '')}
      <div class="admin-user-info">
        <div class="admin-user-name">${esc(u.name)} ${u.role === 'admin' ? '<span class="tag">管理员</span>' : ''} ${u.banned ? '<span class="tag red-tag">已封禁</span>' : ''}</div>
        <div class="hint" style="margin:0">${esc(u.email || '无邮箱')} · ${fmtDateTime(u.createdAt)}${u.clazz ? ' · ' + esc(u.clazz) : ''}</div>
      </div>
      <div class="btn-row">
        ${(u.role !== 'admin' && u.id !== S.user.id) ? `<button class="btn small ghost" data-act="admin:role" data-id="${u.id}" data-v="admin">设为管理员</button>` : ''}
        ${(u.role === 'admin' && u.id !== S.user.id) ? `<button class="btn small ghost" data-act="admin:role" data-id="${u.id}" data-v="user">取消管理员</button>` : ''}
        ${u.id !== S.user.id ? `<button class="btn small ghost" data-act="admin:ban" data-id="${u.id}" data-v="${u.banned ? 0 : 1}">${u.banned ? '解封' : '封禁'}</button>` : ''}
        ${(u.id !== S.user.id && u.role !== 'admin') ? `<button class="btn small danger ghost" data-act="admin:userdel" data-id="${u.id}">删除</button>` : ''}
      </div>
    </div>`).join('')}
  </div>`;
}

function adminPosts() {
  const d = S.adminData;
  return `<div class="card">
    <div class="card-head"><h2>社区帖子（最新 100 条）</h2><button class="btn small danger ghost" data-act="admin:postclear">清空全部</button></div>
    ${(d.posts || []).length ? d.posts.map(p => `<div class="admin-post">
      <div class="admin-post-head">${avatar(p.id, p.userName, 26, p.av)}<b>${esc(p.userName)}</b><span class="hint">${fmtDateTime(p.createdAt)} · ${p.likeCount} 赞 · ${p.commentCount} 评论</span><span class="spacer"></span><button class="btn small danger ghost" data-act="admin:postdel" data-id="${p.id}">删除</button></div>
      <div class="admin-post-content">${esc((p.content || '').slice(0, 300))}</div>
    </div>`).join('') : '<div class="empty small">暂无帖子</div>'}
  </div>`;
}

function adminChat() {
  const d = S.adminData;
  const rooms = d.rooms || [];
  const sel = S.ui.adminRoom || (rooms[0] && rooms[0].id) || '';
  const msgs = S.ui.adminMsgs || [];
  return `<div class="card">
    <div class="card-head"><h2>聊天管理</h2>${sel ? `<button class="btn small danger ghost" data-act="admin:msgclear" data-id="${sel}">清空该聊天室</button>` : ''}</div>
    <div class="chips">${rooms.map(r => `<button class="chip ${sel === r.id ? 'on' : ''}" data-act="admin:room" data-id="${r.id}">${r.icon || '💬'} ${esc(r.name)} · ${r.messageCount}</button>`).join('')}</div>
    <div style="margin-top:12px">
      ${sel ? (msgs.length ? msgs.map(m => `<div class="admin-msg"><span class="hint">${fmtDateTime(m.createdAt)}</span><b>${esc(m.userName)}</b><span class="admin-msg-content">${esc((m.content || '').slice(0, 200))}</span><span class="spacer"></span><button class="btn small danger ghost" data-act="admin:msgdel" data-id="${m.id}">删除</button></div>`).join('') : '<div class="empty small">这个聊天室暂无消息</div>') : '<div class="empty small">暂无聊天室</div>'}
    </div>
  </div>`;
}

function viewAdmin() {
  if (!isAdmin()) return '<div class="card empty">需要管理员权限</div>';
  const t = S.ui.adminTab || 'overview';
  const tabs = [['overview', '概览'], ['users', '用户'], ['posts', '社区内容'], ['chat', '聊天管理']];
  const body = t === 'users' ? adminUsers() : t === 'posts' ? adminPosts() : t === 'chat' ? adminChat() : adminOverview();
  return `
  <div class="card head-card">
    <div><h2 style="margin:0;font-size:15.5px">管理后台</h2><p class="hint" style="margin:4px 0 0">站长专属：删帖 / 删评论 / 删消息 / 封禁用户 / 全站数据</p></div>
    <button class="btn ghost small" data-act="admin:refresh">刷新</button>
  </div>
  <div class="chips">${tabs.map(([v, l]) => `<button class="chip ${t === v ? 'on' : ''}" data-act="admin:tab" data-v="${v}">${l}</button>`).join('')}</div>
  ${body}`;
}

function viewSocial() {
  const t = S.ui.socialTab || 'chat';
  return `
  <div class="chips">
    <button class="chip ${t === 'chat' ? 'on' : ''}" data-act="social:tab" data-v="chat">聊天室</button>
    <button class="chip ${t === 'feed' ? 'on' : ''}" data-act="social:tab" data-v="feed">动态</button>
  </div>
  ${t === 'feed' ? viewFeed() : viewChat()}`;
}

async function loadFriends(silent) {
  try {
    const d = await api('GET', '/api/friends');
    S.friends.list = d.friends || [];
    S.friends.requests = d.requests || [];
    S.friends.unreadTotal = d.unreadTotal || 0;
  } catch (e) { if (!silent) handleApiError(e); }
  if (!silent && route().name === 'contacts') render();
  else renderNav();
}

async function contactsEnter() {
  await loadFriends(true);
  if (route().name === 'contacts') render();
  if (S.friends.open) startDmPoll();
}

function startDmPoll() {
  stopDmPoll();
  S.friends.poll = setInterval(dmPoll, 3000);
}

function stopDmPoll() {
  if (S.friends.poll) { clearInterval(S.friends.poll); S.friends.poll = null; }
}

async function dmPoll() {
  const fid = S.friends.open;
  if (route().name !== 'contacts' || !fid) { stopDmPoll(); return; }
  try {
    const msgs = S.friends.messages || [];
    const after = msgs.length ? msgs[msgs.length - 1].createdAt : 0;
    const d = await api('GET', `/api/dm/${fid}?after=${after}`);
    const fresh = d.messages || [];
    if (fresh.length) {
      S.friends.messages = msgs.concat(fresh);
      appendDmDom(fresh);
    }
  } catch (e) { handleApiError(e); }
}

async function openDm(id) {
  S.friends.open = id;
  S.friends.messages = [];
  render();
  startDmPoll();
  try {
    const d = await api('GET', `/api/dm/${id}`);
    S.friends.messages = d.messages || [];
    const f = (S.friends.list || []).find(x => x.id === id);
    if (f) f.unread = 0;
    S.friends.unreadTotal = (S.friends.list || []).reduce((s, x) => s + (x.unread || 0), 0);
    if (route().name === 'contacts' && S.friends.open === id) render();
    scrollDmBottom();
  } catch (e) { handleApiError(e); }
}

function dmItem(m, prev) {
  const mine = m.from === S.user.id;
  const tight = prev && prev.from === m.from && m.createdAt - prev.createdAt < 300000;
  const name = m.fromName || (mine ? S.user.name : (((S.friends.list || []).find(x => x.id === m.from) || {}).name || '好友'));
  return `<div class="msg ${mine ? 'mine' : ''} ${tight ? 'tight' : ''}">
    ${tight ? '<span class="avatar ghost" style="width:34px;height:34px"></span>' : avatar(m.from, name, 34, m.av)}
    <div class="msg-body">
      <div class="msg-head"><span class="msg-name">${esc(name)}</span><span class="msg-time">${fmtTime(m.createdAt)}</span></div>
      <div class="msg-bubble">${esc(m.content).replace(/\n/g, '<br>')}</div>
    </div>
  </div>`;
}

function appendDmDom(list) {
  const box = document.getElementById('dm-msgs');
  if (!box) return;
  const all = S.friends.messages || [];
  const start = all.length - list.length;
  let html = '';
  list.forEach((m, i) => {
    const prev = (start + i) > 0 ? all[start + i - 1] : null;
    html += dmItem(m, prev);
  });
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
  if (box.querySelector('.empty')) box.innerHTML = html;
  else box.insertAdjacentHTML('beforeend', html);
  if (near) box.scrollTop = box.scrollHeight;
}

function scrollDmBottom() {
  const box = document.getElementById('dm-msgs');
  if (box) box.scrollTop = box.scrollHeight;
}

function viewContacts() {
  const F = S.friends;
  if (F.open) {
    const f = (F.list || []).find(x => x.id === F.open);
    const msgs = F.messages || [];
    return `<div class="card chat-main" style="height:calc(100vh - 200px)">
      <div class="chat-head">
        <button class="icon-btn" data-act="friend:back" aria-label="返回">${IC(P.chevL, 18)}</button>
        ${f ? avatar(f.id, f.name, 32, f.avatar) : ''}
        <div><div class="chat-title">${f ? esc(f.name) : '私信'}</div><div class="hint" style="margin:0">好友私信</div></div>
        <span class="spacer"></span>
        ${f ? `<button class="icon-btn" data-act="friend:remove" data-id="${f.id}" aria-label="删除好友">${IC(P.trash, 16)}</button>` : ''}
      </div>
      <div class="chat-msgs" id="dm-msgs">${msgs.length ? msgs.map((m, i) => dmItem(m, i > 0 ? msgs[i - 1] : null)).join('') : '<div class="empty small">还没有消息，打个招呼吧</div>'}</div>
      <form class="chat-input" data-form="dm:send">
        <input name="content" id="dm-input" data-draft="dm" value="${esc(S.drafts.dm || '')}" placeholder="发消息…" autocomplete="off">
        <button class="btn primary" type="submit">发送</button>
      </form>
    </div>`;
  }
  const friends = F.list || [];
  const reqs = F.requests || [];
  return `
  <div class="card head-card">
    <div><h2 style="margin:0;font-size:15.5px">联系人</h2><p class="hint" style="margin:4px 0 0">添加好友后可以互相私信</p></div>
  </div>
  ${reqs.length ? `<div class="card"><div class="card-head"><h2>好友申请 · ${reqs.length}</h2></div>${reqs.map(r => `<div class="friend-row">
    ${avatar(r.fromId, r.fromName, 34, '')}
    <div class="friend-info"><div class="friend-name">${esc(r.fromName)}</div><div class="hint" style="margin:0">${timeAgo(r.at)} 请求加你为好友</div></div>
    <div class="btn-row"><button class="btn small primary" data-act="friend:accept" data-id="${r.id}">同意</button><button class="btn small ghost" data-act="friend:reject" data-id="${r.id}">拒绝</button></div>
  </div>`).join('')}</div>` : ''}
  <div class="card">
    <div class="card-head"><h2>添加好友</h2></div>
    <form class="quick-add" data-form="friend:add">
      ${IC(P.plus, 18)}
      <input name="name" data-draft="friendName" value="${esc(S.drafts.friendName || '')}" placeholder="输入对方昵称，回车发送好友申请" autocomplete="off">
    </form>
    <p class="hint">对方同意后，你们就可以互相私信了。</p>
  </div>
  <div class="card">
    <div class="card-head"><h2>好友（${friends.length}）</h2></div>
    ${friends.length ? friends.map(f => `<button class="friend-row as-button" data-act="friend:open" data-id="${f.id}">
      ${avatar(f.id, f.name, 38, f.avatar)}
      <div class="friend-info">
        <div class="friend-name">${esc(f.name)}${f.unread ? ` <span class="badge">${f.unread}</span>` : ''}</div>
        <div class="hint" style="margin:0">${f.last ? (f.last.mine ? '我：' : '') + esc(String(f.last.content).slice(0, 20)) : '开始聊天吧'}</div>
      </div>
    </button>`).join('') : '<div class="empty small">还没有好友，输入昵称添加吧</div>'}
  </div>`;
}

function viewMe() {
  const C = S.classData.class;
  const tiles = [
    ['habits', '习惯', '打卡与热力图', P.repeat],
    ['notes', '记录', '随手写下想法', P.book],
    ['class', '班级', C ? C.name : '创建或加入班级', P.users],
    ['calendar', '日历', '月视图概览', P.calendar],
    ['stats', '统计', '趋势与专注数据', P.chart],
    ['settings', '设置', '外观与数据管理', P.gear]
  ];
  if (isAdmin()) tiles.push(['admin', '管理后台', '内容与用户管理', P.shield]);
  return `
  <div class="card me-profile">
    ${avatar(S.user.id, S.user.name, 54, S.user.avatar)}
    <div class="me-info">
      <div class="me-name">${esc(S.user.name)}${isAdmin() ? ' <span class="tag">管理员</span>' : ''}</div>
      <div class="hint" style="margin:2px 0 0">${esc(S.user.email || '未设置邮箱')}</div>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn small" data-act="profile:edit">编辑资料</button>
        <button class="btn small danger ghost" data-act="auth:logout">退出登录</button>
      </div>
    </div>
  </div>
  <div class="me-grid">
    ${tiles.map(([r, label, sub, icon]) => `<button class="card me-tile" data-act="goto" data-to="${r}">
      <span class="me-tile-ic">${IC(icon, 22)}</span>
      <span class="me-tile-label">${label}</span>
      <span class="me-tile-sub">${esc(sub)}</span>
    </button>`).join('')}
  </div>`;
}

const VIEWS = {
  today: viewToday,
  todos: viewTodos,
  habits: viewHabits,
  notes: viewNotes,
  class: viewClass,
  chat: viewChat,
  feed: viewFeed,
  social: viewSocial,
  contacts: viewContacts,
  me: viewMe,
  calendar: viewCalendar,
  stats: viewStats,
  settings: viewSettings,
  admin: viewAdmin
};

async function fillLan() {
  try {
    const info = await api('GET', '/api/info');
    const box = document.getElementById('lan-box');
    if (!box) return;
    const ips = (info.lan || []).map(ip => `<code>http://${ip}:${info.port}</code>`).join(' ');
    box.innerHTML = `<span>局域网地址</span>${ips || '<code>未检测到</code>'}`;
  } catch (e) {}
}

function render() {
  const ae = document.activeElement;
  const fid = ae && ae.id ? ae.id : null;
  const ss = ae && typeof ae.selectionStart === 'number' ? ae.selectionStart : null;
  const se = ae && typeof ae.selectionEnd === 'number' ? ae.selectionEnd : null;
  const name = route().name;
  const fn = VIEWS[name] || viewToday;
  const view = $('#view');
  if (!view) return;
  const prevName = S.ui.lastRoute;
  const keepScroll = prevName === name ? view.scrollTop : 0;
  view.innerHTML = fn();
  S.ui.lastRoute = name;
  updateChrome(name);
  renderNav();
  if (keepScroll) view.scrollTop = keepScroll;
  if (fid) {
    const el = document.getElementById(fid);
    if (el && el.focus) {
      el.focus();
      if (ss !== null && el.setSelectionRange) {
        try { el.setSelectionRange(ss, se); } catch (e) {}
      }
    }
  }
  const chatNow = chatNowActive();
  if (chatNow) {
    if (!S.ui.chatActive) { S.ui.chatActive = true; chatEnter(); }
  } else {
    S.ui.chatActive = false;
    stopChatPoll();
  }
  const feedNow = feedNowActive();
  if (feedNow) {
    if (!S.ui.feedActive) { S.ui.feedActive = true; feedEnter(); }
  } else {
    S.ui.feedActive = false;
  }
  if (name === 'contacts') {
    if (!S.ui.contactsActive) { S.ui.contactsActive = true; contactsEnter(); }
  } else if (S.ui.contactsActive) {
    S.ui.contactsActive = false;
    stopDmPoll();
  }
  if (name === 'class' && prevName !== 'class') loadClassData();
  if (name === 'admin' && prevName !== 'admin') loadAdmin();
  if (name === 'today') updatePomoDom();
  if (name === 'settings') fillLan();
}

function openModal(html) {
  const wrap = $('#modal-wrap');
  $('#modal').innerHTML = html;
  wrap.classList.add('open');
  document.body.classList.add('locked');
}

function closeModal() {
  const wrap = $('#modal-wrap');
  wrap.classList.remove('open');
  $('#modal').innerHTML = '';
  document.body.classList.remove('locked');
}

function openSheet() {
  const cur = route().name;
  const items = NAV.filter(n => !TAB_IDS.includes(n.r) && (!n.adminOnly || isAdmin()));
  $('#sheet').innerHTML = items.map(n =>
    `<a class="sheet-item ${cur === n.r ? 'active' : ''}" href="#/${n.r}" data-act="sheet:close">${IC(P[n.icon], 22)}<span>${n.label}</span></a>`
  ).join('');
  $('#sheet-wrap').classList.add('open');
  document.body.classList.add('locked');
}

function closeSheet() {
  const wrap = $('#sheet-wrap');
  if (wrap) wrap.classList.remove('open');
  if (!$('#modal-wrap').classList.contains('open')) document.body.classList.remove('locked');
}

function nextWeekday(wd, next) {
  const d = new Date();
  let diff = (wd - d.getDay() + 7) % 7;
  if (next) diff += 7;
  d.setDate(d.getDate() + diff);
  return ymd(d);
}

function parseQuick(raw) {
  let s = ' ' + String(raw || '').trim() + ' ';
  const tags = [];
  let priority = 0;
  let due = null;
  s = s.replace(/#([^\s#]+)/g, (m, g) => { tags.push(g); return ' '; });
  if (/!!|！！/.test(s)) { priority = 3; s = s.replace(/!!|！！/g, ' '); }
  else if (/!|！/.test(s)) { priority = 2; s = s.replace(/!|！/g, ' '); }
  const rel = [['后天', 2], ['明天', 1], ['今天', 0]];
  for (const [k, n] of rel) {
    if (s.includes(k)) { due = addDays(today(), n); s = s.replace(k, ' '); break; }
  }
  if (!due) {
    const m = s.match(/(下)?(周|星期)([一二三四五六日天])/);
    if (m) {
      const wdMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 };
      due = nextWeekday(wdMap[m[3]], !!m[1]);
      s = s.replace(m[0], ' ');
    }
  }
  return { title: s.replace(/\s+/g, ' ').trim(), priority, due, tags, note: '', projectId: null, repeat: 'none', done: false, completedAt: null };
}

function openTodoModal(id) {
  const t = id ? S.data.todos.find(x => x.id === id) : { title: '', note: '', due: '', priority: 0, projectId: '', tags: [], repeat: 'none' };
  if (!t) return;
  const projOpts = ['<option value="">无清单</option>'].concat(
    S.data.projects.map(p => `<option value="${p.id}" ${t.projectId === p.id ? 'selected' : ''}>${p.icon} ${esc(p.name)}</option>`)
  ).join('');
  const priOpts = [['0', '无'], ['1', '低'], ['2', '中'], ['3', '高']]
    .map(([v, l]) => `<option value="${v}" ${String(t.priority || 0) === v ? 'selected' : ''}>${l}</option>`).join('');
  const repOpts = [['none', '不重复'], ['daily', '每天'], ['weekly', '每周'], ['monthly', '每月']]
    .map(([v, l]) => `<option value="${v}" ${(t.repeat || 'none') === v ? 'selected' : ''}>${l}</option>`).join('');
  openModal(`<form data-form="todo:save" data-id="${id || ''}">
    <div class="modal-head"><h3>${id ? '编辑待办' : '新建待办'}</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <input class="input title-input" name="title" id="m-title" value="${esc(t.title)}" placeholder="要做什么？" autocomplete="off" required>
      <textarea class="input" name="note" rows="2" placeholder="备注（可选）">${esc(t.note || '')}</textarea>
      <div class="field">子任务
        <div id="steps">${(t.checklist || []).map(s => stepRow(s)).join('')}</div>
        <button type="button" class="btn ghost small" data-act="step:add">+ 添加步骤</button>
      </div>
      <div class="grid2">
        <label class="field">日期<input class="input" type="date" name="due" value="${t.due || ''}"></label>
        <label class="field">优先级<select class="input" name="priority">${priOpts}</select></label>
        <label class="field">清单<select class="input" name="projectId">${projOpts}</select></label>
        <label class="field">重复<select class="input" name="repeat">${repOpts}</select></label>
      </div>
      <label class="field">标签<input class="input" name="tags" value="${esc((t.tags || []).join(' '))}" placeholder="用空格分隔，例如：工作 重要"></label>
    </div>
    <div class="modal-foot">
      ${id ? `<button type="button" class="btn danger ghost" data-act="todo:del" data-id="${id}">删除</button>` : ''}
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-act="modal:close">取消</button>
      <button class="btn primary" type="submit">保存</button>
    </div>
  </form>`);
  setTimeout(() => { const el = $('#m-title'); if (el) { el.focus(); el.select(); } }, 40);
}

function openHabitModal(id) {
  const h = id ? S.data.habits.find(x => x.id === id) : { name: '', icon: '🎯', color: '#4f6ef7' };
  if (!h) return;
  const EMOJIS = ['🎯', '🌅', '🏃', '📖', '💪', '🧘', '💧', '🥗', '😴', '✍️', '💻', '🧹', '☀️', '🚶', '🦷', '📵', '💰', '🗣️', '🎨', '🌱', '☕', '🎸', '🐶', '🧠'];
  const COLORS = ['#4f6ef7', '#7c5cff', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
  openModal(`<form data-form="habit:save" data-id="${id || ''}">
    <div class="modal-head"><h3>${id ? '编辑习惯' : '新建习惯'}</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <label class="field">名称<input class="input" name="name" id="hm-name" value="${esc(h.name)}" placeholder="例如：早起、阅读、运动" autocomplete="off" required></label>
      <div class="field">图标
        <div class="emoji-grid">${EMOJIS.map(e => `<button type="button" class="emoji-opt ${h.icon === e ? 'on' : ''}" data-act="pick:emoji" data-v="${e}">${e}</button>`).join('')}</div>
      </div>
      <div class="field">颜色
        <div class="color-row">${COLORS.map(c => `<button type="button" class="color-opt ${h.color === c ? 'on' : ''}" style="--c:${c}" data-act="pick:color" data-v="${c}" aria-label="${c}"></button>`).join('')}</div>
      </div>
      <input type="hidden" name="icon" id="hm-icon" value="${h.icon}">
      <input type="hidden" name="color" id="hm-color" value="${h.color}">
    </div>
    <div class="modal-foot">
      ${id ? `<button type="button" class="btn danger ghost" data-act="habit:del" data-id="${id}">删除</button>` : ''}
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-act="modal:close">取消</button>
      <button class="btn primary" type="submit">保存</button>
    </div>
  </form>`);
  setTimeout(() => { const el = $('#hm-name'); if (el) el.focus(); }, 40);
}

function openNoteModal(id) {
  const n = S.data.notes.find(x => x.id === id);
  if (!n) return;
  openModal(`<form data-form="note:save" data-id="${id}">
    <div class="modal-head"><h3>编辑记录</h3><button type="button" class="icon-btn" data-act="modal:close" aria-label="关闭">${IC(P.x, 18)}</button></div>
    <div class="modal-body">
      <textarea class="input" name="content" id="m-note" rows="5">${esc(n.content || '')}</textarea>
      <div class="field">心情
        <div class="moods">${MOODS.map((m, i) => `<button type="button" class="mood-chip ${n.mood === i + 1 ? 'on' : ''}" data-act="modal:mood" data-v="${i + 1}">${m}</button>`).join('')}</div>
      </div>
      <input type="hidden" name="mood" value="${n.mood || ''}">
      <label class="field">标签<input class="input" name="tags" value="${esc((n.tags || []).join(' '))}" placeholder="用空格分隔"></label>
    </div>
    <div class="modal-foot">
      <button type="button" class="btn danger ghost" data-act="note:del" data-id="${id}">删除</button>
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-act="modal:close">取消</button>
      <button class="btn primary" type="submit">保存</button>
    </div>
  </form>`);
  setTimeout(() => { const el = $('#m-note'); if (el) el.focus(); }, 40);
}

function nextDue(due, repeat) {
  const base = due && due > today() ? due : today();
  const d = parseYmd(base);
  if (repeat === 'daily') d.setDate(d.getDate() + 1);
  else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
  else if (repeat === 'monthly') {
    const day = d.getDate();
    d.setMonth(d.getMonth() + 1, 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  }
  return ymd(d);
}

async function toggleTodo(id) {
  const t = S.data.todos.find(x => x.id === id);
  if (!t) return;
  const done = !t.done;
  await put('todos', id, { done, completedAt: done ? Date.now() : null });
  if (done) {
    if (t.repeat && t.repeat !== 'none') {
      const nd = nextDue(t.due, t.repeat);
      await post('todos', {
        title: t.title, note: t.note || '', priority: t.priority || 0,
        projectId: t.projectId || null, tags: t.tags || [], repeat: t.repeat,
        due: nd, done: false, completedAt: null
      });
      toast(`重复任务已生成下一次：${fmtDate(nd)}`);
    } else {
      toast('已完成 ✓');
    }
  }
}

async function toggleHabit(id, date) {
  try {
    const updated = await api('POST', `/api/habits/${id}/toggle`, { date });
    const local = S.data.habits.find(x => x.id === id);
    if (local) local.records = updated.records || {};
    if (local && local.records[date]) {
      const streak = habitStreak(local);
      toast(streak > 1 ? `打卡成功 · 连续 ${streak} 天 🔥` : '打卡成功 🎉');
    }
    render();
  } catch (e) {
    toast('操作失败，请重试');
  }
}

async function setTheme(v) {
  S.data.settings.theme = v;
  applyTheme();
  render();
  try { await api('PUT', '/api/settings', { theme: v }); } catch (e) {}
}

async function setAccent(v) {
  S.data.settings.accent = v;
  applyAccent();
  render();
  try { await api('PUT', '/api/settings', { accent: v }); } catch (e) {}
}

async function exportData() {
  try {
    const res = await fetch('/api/state');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Tdaily-备份-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('已导出备份');
  } catch (e) {
    toast('导出失败');
  }
}

async function clearData() {
  if (!confirm('确定清除所有待办、习惯、记录吗？该操作不可撤销，建议先导出备份。')) return;
  try {
    await api('PUT', '/api/state', { todos: [], habits: [], notes: [], projects: [], settings: S.data.settings });
    S.data = await api('GET', '/api/state');
    render();
    toast('已清除全部数据');
  } catch (e) {
    toast('操作失败');
  }
}

const ACTIONS = {
  'goto': el => { location.hash = '#/' + el.dataset.to; },
  'auth:tab': el => showAuth(el.dataset.v),
  'auth:logout': async () => {
    if (!confirm('确定退出登录？')) return;
    try { await api('POST', '/api/logout'); } catch (e) {}
    location.reload();
  },
  'profile:edit': () => openProfileModal(),
  'pick:avatar': el => {
    const inp = $('#pf-avatar');
    if (inp) inp.value = el.dataset.v;
    $$('.emoji-opt').forEach(b => b.classList.toggle('on', b === el));
  },
  'chat:room': el => openRoom(el.dataset.id),
  'chat:newRoom': () => openRoomModal(),
  'chat:delRoom': async el => {
    if (!confirm('删除这个聊天室？聊天记录会一并删除。')) return;
    try {
      await api('DELETE', '/api/social/rooms/' + el.dataset.id);
      S.social.rooms = (S.social.rooms || []).filter(r => r.id !== el.dataset.id);
      if (S.social.activeRoom === el.dataset.id) { S.social.activeRoom = null; S.social.messages = []; }
      syncUnread();
      render();
      toast('已删除');
    } catch (e) { handleApiError(e, '删除失败'); }
  },
  'chat:delMsg': async el => {
    if (!confirm('撤回这条消息？')) return;
    const room = S.social.activeRoom;
    try {
      await api('DELETE', `/api/social/rooms/${room}/messages/${el.dataset.id}`);
      S.social.messages = (S.social.messages || []).filter(m => m.id !== el.dataset.id);
      const node = el.closest('.msg');
      if (node) node.remove();
      else render();
    } catch (e) { handleApiError(e, '撤回失败'); }
  },
  'pick:roomIcon': el => {
    const inp = $('#room-icon');
    if (inp) inp.value = el.dataset.v;
    $$('.emoji-opt').forEach(b => b.classList.toggle('on', b === el));
  },
  'feed:refresh': async () => { await feedEnter(); toast('已刷新'); },
  'post:like': async el => {
    try {
      const r = await api('POST', `/api/social/posts/${el.dataset.id}/like`);
      const p = (S.social.posts || []).find(x => x.id === el.dataset.id);
      if (p) { p.liked = r.liked; p.likeCount = r.likeCount; updatePostDom(p); }
    } catch (e) { handleApiError(e, '操作失败'); }
  },
  'post:comments': el => {
    const id = el.dataset.id;
    S.ui.openComments[id] = !S.ui.openComments[id];
    const p = (S.social.posts || []).find(x => x.id === id);
    if (p) updatePostDom(p);
  },
  'post:del': async el => {
    if (!confirm('删除这条动态？')) return;
    try {
      await api('DELETE', '/api/social/posts/' + el.dataset.id);
      S.social.posts = (S.social.posts || []).filter(p => p.id !== el.dataset.id);
      render();
      toast('已删除');
    } catch (e) { handleApiError(e, '删除失败'); }
  },
  'comment:del': async el => {
    if (!confirm('删除这条评论？')) return;
    try {
      await api('DELETE', `/api/social/posts/${el.dataset.pid}/comments/${el.dataset.id}`);
      const p = (S.social.posts || []).find(x => x.id === el.dataset.pid);
      if (p) { p.comments = (p.comments || []).filter(c => c.id !== el.dataset.id); updatePostDom(p); }
    } catch (e) { handleApiError(e, '删除失败'); }
  },
  'step:add': () => {
    const box = $('#steps');
    if (!box) return;
    box.insertAdjacentHTML('beforeend', stepRow({ text: '', done: false }));
    const inputs = $$('#steps .step-input');
    const last = inputs[inputs.length - 1];
    if (last) last.focus();
  },
  'step:del': el => {
    const row = el.closest('.step-row');
    if (row) row.remove();
  },
  'step:toggle': el => {
    const row = el.closest('.step-row');
    if (!row) return;
    const on = row.dataset.done !== '1';
    row.dataset.done = on ? '1' : '0';
    el.classList.toggle('on', on);
  },
  'pomo:set': el => {
    if (S.pomo.running) { toast('专注进行中，先暂停再切换时长'); return; }
    const m = Number(el.dataset.v) || 25;
    S.pomo.minutes = m;
    S.pomo.total = m * 60;
    S.pomo.remain = S.pomo.total;
    pomoSave();
    render();
    updatePomoDom();
  },
  'pomo:startpause': () => { if (S.pomo.running) pomoPause(); else pomoStart(); },
  'pomo:reset': () => { pomoPause(); S.pomo.remain = S.pomo.total; pomoSave(); updatePomoDom(); },
  'class:tab': el => { S.ui.classTab = el.dataset.v; render(); },
  'class:create': () => openClassCreateModal(),
  'class:join': () => openClassJoinModal(),
  'join:back': () => openClassJoinModal(),
  'class:renameStudent': el => openRenameStudentModal(el.dataset.sid, el.dataset.name || ''),
  'class:leave': async () => {
    if (!confirm('确定退出班级？')) return;
    try { await api('POST', '/api/class/leave'); toast('已退出班级'); await loadClassData(); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'class:dissolve': async () => {
    if (!confirm('确定解散班级？所有收集、投票、记录将被删除，不可恢复！')) return;
    try { await api('POST', '/api/class/dissolve'); toast('班级已解散'); await loadClassData(); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'class:copyCode': () => copyText((S.classData.class || {}).code || ''),
  'class:resetCode': async () => {
    if (!confirm('重置后旧班级码立即失效，确定？')) return;
    try { await api('POST', '/api/class/code'); await loadClassData(); toast('班级码已重置'); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'class:addStudents': () => openAddStudentsModal(),
  'class:removeStudent': async el => {
    if (!confirm('从名单移除该学号？若已加入也会被移出班级。')) return;
    try { await api('POST', '/api/class/students/remove', { sid: el.dataset.sid }); await loadClassData(); toast('已移除'); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'collect:new': () => openCollectNewModal(),
  'collect:fill': el => openCollectFillModal(el.dataset.id),
  'collect:view': el => openCollectViewModal(el.dataset.id),
  'collect:copy': el => copyCollect(el.dataset.id),
  'collect:close': async el => {
    try { await api('POST', '/api/class/collections/close', { id: el.dataset.id }); await loadClassData(); toast('已结束'); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'collect:delete': async el => {
    if (!confirm('删除这个收集任务？')) return;
    try { await api('POST', '/api/class/collections/delete', { id: el.dataset.id }); await loadClassData(); toast('已删除'); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'poll:new': () => openPollNewModal(),
  'poll:pick': el => {
    const pid = el.dataset.id;
    const p = (S.classData.polls || []).find(x => x.id === pid);
    if (!p) return;
    const i = Number(el.dataset.i);
    let sel = (S.ui.pollSel[pid] || p.myVotes || []).slice();
    if (p.multi) {
      sel = sel.includes(i) ? sel.filter(x => x !== i) : sel.concat(i);
    } else {
      sel = [i];
    }
    S.ui.pollSel[pid] = sel;
    render();
  },
  'poll:submit': async el => {
    const pid = el.dataset.id;
    const sel = S.ui.pollSel[pid];
    if (!sel || !sel.length) { toast('请先选择选项'); return; }
    try {
      await api('POST', '/api/class/polls/vote', { id: pid, choice: sel });
      S.ui.pollSel[pid] = null;
      await loadClassData();
      toast('投票成功');
    } catch (e) { handleApiError(e, '操作失败'); }
  },
  'poll:close': async el => {
    try { await api('POST', '/api/class/polls/close', { id: el.dataset.id }); await loadClassData(); toast('投票已结束'); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'poll:delete': async el => {
    if (!confirm('删除这个投票？')) return;
    try { await api('POST', '/api/class/polls/delete', { id: el.dataset.id }); await loadClassData(); toast('已删除'); }
    catch (e) { handleApiError(e, '操作失败'); }
  },
  'draw:count': el => { S.ui.draw.count = Number(el.dataset.v) || 1; render(); },
  'draw:go': () => classDrawRun(),
  'draw:export': () => exportDraws(),
  'file:importRoster': el => importRoster(el.dataset.target),
  'class:exportRoster': () => exportRoster(),
  'collect:export': el => exportCollect(el.dataset.id),
  'poll:export': el => exportPoll(el.dataset.id),
  'social:tab': el => { S.ui.socialTab = el.dataset.v; render(); },
  'friend:accept': async el => {
    try { await api('POST', '/api/friends/accept', { id: el.dataset.id }); await loadFriends(); toast('已同意，开始聊天吧'); }
    catch (e) { handleApiError(e); }
  },
  'friend:reject': async el => {
    try { await api('POST', '/api/friends/reject', { id: el.dataset.id }); await loadFriends(); toast('已拒绝'); }
    catch (e) { handleApiError(e); }
  },
  'friend:open': el => openDm(el.dataset.id),
  'friend:back': async () => {
    S.friends.open = null;
    S.friends.messages = [];
    stopDmPoll();
    await loadFriends(true);
    render();
  },
  'friend:remove': async el => {
    if (!confirm('删除该好友？聊天记录会保留，重新加好友后还能看到。')) return;
    try {
      await api('POST', '/api/friends/remove', { id: el.dataset.id });
      S.friends.open = null;
      S.friends.messages = [];
      stopDmPoll();
      await loadFriends(true);
      render();
      toast('已删除好友');
    } catch (e) { handleApiError(e); }
  },
  'admin:tab': el => { S.ui.adminTab = el.dataset.v; render(); },
  'admin:refresh': async () => { await loadAdmin(); toast('已刷新'); },
  'admin:ban': async el => {
    const ban = el.dataset.v === '1';
    if (!confirm(ban ? '封禁该用户？封禁后无法登录。' : '解封该用户？')) return;
    try { await api('POST', '/api/admin/users/ban', { id: el.dataset.id, banned: ban }); await loadAdmin(); toast(ban ? '已封禁' : '已解封'); }
    catch (e) { handleApiError(e); }
  },
  'admin:role': async el => {
    const role = el.dataset.v;
    if (!confirm(role === 'admin' ? '将其设为管理员？' : '取消其管理员身份？')) return;
    try { await api('POST', '/api/admin/users/role', { id: el.dataset.id, role }); await loadAdmin(); toast('已更新'); }
    catch (e) { handleApiError(e); }
  },
  'admin:userdel': async el => {
    if (!confirm('删除该用户？账号与个人数据将被删除，不可恢复！')) return;
    try { await api('POST', '/api/admin/users/delete', { id: el.dataset.id }); await loadAdmin(); toast('已删除'); }
    catch (e) { handleApiError(e); }
  },
  'admin:postdel': async el => {
    if (!confirm('删除这条帖子？')) return;
    try { await api('POST', '/api/admin/posts/delete', { id: el.dataset.id }); await loadAdmin(); toast('已删除'); }
    catch (e) { handleApiError(e); }
  },
  'admin:postclear': async () => {
    if (!confirm('清空全部帖子？不可恢复！')) return;
    try { await api('POST', '/api/admin/posts/clear'); await loadAdmin(); toast('已清空'); }
    catch (e) { handleApiError(e); }
  },
  'admin:room': async el => {
    S.ui.adminRoom = el.dataset.id;
    S.ui.adminMsgs = [];
    render();
    try {
      const dm = await api('GET', '/api/admin/messages?room=' + encodeURIComponent(S.ui.adminRoom));
      S.ui.adminMsgs = dm.messages || [];
      render();
    } catch (e) { handleApiError(e); }
  },
  'admin:msgdel': async el => {
    if (!confirm('删除这条消息？')) return;
    try {
      await api('POST', '/api/admin/messages/delete', { id: el.dataset.id });
      S.ui.adminMsgs = (S.ui.adminMsgs || []).filter(m => m.id !== el.dataset.id);
      render();
    } catch (e) { handleApiError(e); }
  },
  'admin:msgclear': async el => {
    if (!confirm('清空该聊天室的全部消息？不可恢复！')) return;
    try { await api('POST', '/api/admin/messages/clear', { roomId: el.dataset.id }); S.ui.adminMsgs = []; await loadAdmin(); toast('已清空'); }
    catch (e) { handleApiError(e); }
  },
  'admin:classdel': async el => {
    if (!confirm('解散该班级？班级数据不可恢复！')) return;
    try { await api('POST', '/api/admin/classes/delete', { id: el.dataset.id }); await loadAdmin(); toast('已解散'); }
    catch (e) { handleApiError(e); }
  },
  'theme:toggle': () => { setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); },
  'todo:new': () => openTodoModal(null),
  'todo:open': el => openTodoModal(el.dataset.id),
  'todo:toggle': el => toggleTodo(el.dataset.id),
  'todo:del': el => {
    if (!confirm('删除这个待办？')) return;
    removeItem('todos', el.dataset.id).then(() => { closeModal(); toast('已删除'); }).catch(() => toast('删除失败'));
  },
  'filter': el => { S.ui.tfilter = el.dataset.v; render(); },
  'project': el => { S.ui.project = el.dataset.id; render(); },
  'habit:new': () => openHabitModal(null),
  'habit:edit': el => openHabitModal(el.dataset.id),
  'habit:del': el => {
    if (!confirm('删除这个习惯及其打卡记录？')) return;
    removeItem('habits', el.dataset.id).then(() => { closeModal(); toast('已删除'); }).catch(() => toast('删除失败'));
  },
  'habit:toggle': el => toggleHabit(el.dataset.id, el.dataset.date),
  'note:edit': el => openNoteModal(el.dataset.id),
  'note:del': el => {
    if (!confirm('删除这条记录？')) return;
    removeItem('notes', el.dataset.id).then(() => { closeModal(); toast('已删除'); }).catch(() => toast('删除失败'));
  },
  'mood:set': el => {
    S.ui.mood = Number(el.dataset.v);
    $$('.mood-chip').forEach(b => b.classList.toggle('on', b === el));
  },
  'modal:mood': el => {
    const f = el.closest('form');
    if (!f) return;
    f.querySelector('input[name="mood"]').value = el.dataset.v;
    $$('.mood-chip', f).forEach(b => b.classList.toggle('on', b === el));
  },
  'pick:emoji': el => {
    const input = $('#hm-icon');
    if (input) input.value = el.dataset.v;
    $$('.emoji-opt').forEach(b => b.classList.toggle('on', b === el));
  },
  'pick:color': el => {
    const input = $('#hm-color');
    if (input) input.value = el.dataset.v;
    $$('.color-opt').forEach(b => b.classList.toggle('on', b === el));
  },
  'cal:prev': () => { S.ui.cal = shiftYM(S.ui.cal || today().slice(0, 7), -1); render(); },
  'cal:next': () => { S.ui.cal = shiftYM(S.ui.cal || today().slice(0, 7), 1); render(); },
  'cal:today': () => { S.ui.cal = today().slice(0, 7); S.ui.calDay = today(); render(); },
  'cal:day': el => { S.ui.calDay = el.dataset.date; render(); },
  'settings:theme': el => setTheme(el.dataset.v),
  'settings:accent': el => setAccent(el.dataset.v),
  'settings:export': () => exportData(),
  'settings:import': () => { const f = $('#import-file'); if (f) f.click(); },
  'settings:clear': () => clearData(),
  'sheet:open': () => openSheet(),
  'sheet:close': () => closeSheet(),
  'modal:close': () => closeModal()
};

const FORMS = {
  'auth:login': async fd => {
    const btn = document.querySelector('.auth-submit');
    if (btn) btn.disabled = true;
    try {
      const r = await api('POST', '/api/login', { name: fd.name, password: fd.password });
      S.user = r.user;
      await startApp();
      toast('欢迎回来，' + S.user.name);
    } catch (err) {
      authError(err.message);
    }
  },
  'auth:register': async fd => {
    const btn = document.querySelector('.auth-submit');
    if (btn) btn.disabled = true;
    try {
      const r = await api('POST', '/api/register', { name: fd.name, password: fd.password, email: fd.email, invite: fd.invite });
      S.user = r.user;
      await startApp();
      toast('欢迎使用 Tdaily，' + S.user.name);
    } catch (err) {
      authError(err.message);
    }
  },
  'profile:save': async fd => {
    try {
      const r = await api('POST', '/api/profile', { name: fd.name, avatar: fd.avatar, email: fd.email });
      S.user = r.user;
      closeModal();
      render();
      toast('资料已更新');
    } catch (err) {
      toast(err.message || '保存失败');
    }
  },
  'class:create': async fd => {
    try {
      await api('POST', '/api/class/create', { name: fd.name, mySid: fd.mySid, roster: fd.roster });
      closeModal();
      S.ui.classTab = 'home';
      await loadClassData();
      toast('班级已创建 🎉');
    } catch (e) { toast(e.message || '创建失败'); }
  },
  'class:join': async fd => {
    try {
      await api('POST', '/api/class/join', { code: fd.code, sid: fd.sid, name: fd.name });
      closeModal();
      S.ui.classTab = 'home';
      await loadClassData();
      toast('加入成功 🎉');
    } catch (e) { toast(e.message || '加入失败'); }
  },
  'class:lookup': async fd => {
    try {
      const r = await api('POST', '/api/class/lookup', { code: fd.code, sid: fd.sid });
      if (r.joined) { toast('该学号已被加入过，请联系班长'); return; }
      openJoinConfirm(r, fd.code, fd.sid);
    } catch (e) { toast(e.message || '查询失败'); }
  },
  'class:addStudents': async fd => {
    try {
      const r = await api('POST', '/api/class/students', { add: fd.list });
      closeModal();
      await loadClassData();
      toast(`已添加 ${r.added} 个学号`);
    } catch (e) { toast(e.message || '添加失败'); }
  },
  'class:renameStudent': async (fd, f) => {
    try {
      await api('POST', '/api/class/students/rename', { sid: f.dataset.sid, name: (fd.name || '').trim() });
      closeModal();
      await loadClassData();
      toast('已更新姓名');
    } catch (e) { toast(e.message || '保存失败'); }
  },
  'collect:new': async fd => {
    try {
      await api('POST', '/api/class/collections', { title: fd.title, fields: fd.fields });
      closeModal();
      await loadClassData();
      toast('收集任务已发布');
    } catch (e) { toast(e.message || '发布失败'); }
  },
  'collect:submit': async (fd, f) => {
    const id = f.dataset.id;
    const col = (S.classData.collections || []).find(c => c.id === id);
    if (!col) return;
    const values = col.fields.map((_, i) => fd['f' + i] || '');
    try {
      await api('POST', '/api/class/collections/submit', { id, values });
      closeModal();
      await loadClassData();
      toast('提交成功');
    } catch (e) { toast(e.message || '提交失败'); }
  },
  'poll:new': async fd => {
    try {
      await api('POST', '/api/class/polls', { title: fd.title, options: fd.options, multi: fd.multi === '1', anonymous: fd.anonymous === '1' });
      closeModal();
      await loadClassData();
      toast('投票已发布');
    } catch (e) { toast(e.message || '发布失败'); }
  },
  'friend:add': async fd => {
    const name = (fd.name || '').trim();
    if (!name) return;
    S.drafts.friendName = '';
    try {
      const r = await api('POST', '/api/friends/request', { name });
      await loadFriends();
      toast(r.autoAccepted ? '你们已成为好友 🎉' : '好友申请已发送');
    } catch (e) { toast(e.message || '发送失败'); }
  },
  'dm:send': async fd => {
    const fid = S.friends.open;
    if (!fid) return;
    const content = (fd.content || '').trim();
    if (!content) return;
    S.drafts.dm = '';
    try {
      const m = await api('POST', `/api/dm/${fid}`, { content });
      S.friends.messages.push(m);
      appendDmDom([m]);
      const inp = $('#dm-input');
      if (inp) { inp.value = ''; inp.focus(); }
    } catch (e) { handleApiError(e, '发送失败'); }
  },
  'chat:newRoom': async fd => {
    try {
      const r = await api('POST', '/api/social/rooms', { name: fd.name, icon: fd.icon });
      S.social.rooms.push(r);
      closeModal();
      S.social.activeRoom = r.id;
      S.social.messages = [];
      await loadMessages();
      render();
      toast('聊天室已创建');
    } catch (e) { handleApiError(e, '创建失败'); }
  },
  'chat:send': async fd => {
    const room = S.social.activeRoom;
    if (!room) return;
    const content = (fd.content || '').trim();
    if (!content) return;
    S.drafts.chat = '';
    try {
      const m = await api('POST', `/api/social/rooms/${room}/messages`, { content });
      S.social.messages.push(m);
      appendMsgsDom([m]);
      const inp = $('#chat-input');
      if (inp) { inp.value = ''; inp.focus(); }
    } catch (e) { handleApiError(e, '发送失败'); }
  },
  'post:add': async fd => {
    const content = (fd.content || '').trim();
    if (!content) return;
    S.drafts.post = '';
    try {
      const p = await api('POST', '/api/social/posts', { content });
      S.social.posts.unshift(p);
      render();
      toast('已发布');
    } catch (e) { handleApiError(e, '发布失败'); }
  },
  'post:comment': async (fd, f) => {
    const id = f.dataset.id;
    const content = (fd.content || '').trim();
    if (!content) return;
    S.drafts['c' + id] = '';
    try {
      const c = await api('POST', `/api/social/posts/${id}/comments`, { content });
      const p = (S.social.posts || []).find(x => x.id === id);
      if (p) {
        p.comments = p.comments || [];
        p.comments.push(c);
        updatePostDom(p);
        const inp = document.getElementById('cmt-' + id);
        if (inp) inp.focus();
      }
    } catch (e) { handleApiError(e, '评论失败'); }
  },
  'todo:quick': async fd => {
    const t = parseQuick(fd.title || '');
    if (!t.title) return;
    S.drafts.quick = '';
    try { await post('todos', t); toast('已添加'); } catch (e) { toast('添加失败'); }
  },
  'todo:save': async (fd, f) => {
    const id = f.dataset.id;
    const patch = {
      title: (fd.title || '').trim(),
      note: (fd.note || '').trim(),
      due: fd.due || null,
      priority: Number(fd.priority) || 0,
      projectId: fd.projectId || null,
      repeat: fd.repeat || 'none',
      tags: (fd.tags || '').split(/[\s,，]+/).filter(Boolean)
    };
    patch.checklist = $$('#steps .step-row').map(row => ({
      id: uid(),
      text: (row.querySelector('.step-input') ? row.querySelector('.step-input').value : '').trim(),
      done: row.dataset.done === '1'
    })).filter(s => s.text);
    if (!patch.title) return;
    try {
      if (id) await put('todos', id, patch);
      else await post('todos', patch);
      closeModal();
      toast(id ? '已保存' : '已添加');
    } catch (e) { toast('保存失败'); }
  },
  'habit:save': async (fd, f) => {
    const id = f.dataset.id;
    const patch = { name: (fd.name || '').trim(), icon: fd.icon || '🎯', color: fd.color || '#4f6ef7' };
    if (!patch.name) return;
    try {
      if (id) await put('habits', id, patch);
      else await post('habits', Object.assign({ records: {} }, patch));
      closeModal();
      toast('已保存');
    } catch (e) { toast('保存失败'); }
  },
  'note:add': async fd => {
    const content = (fd.content || '').trim();
    if (!content) return;
    const tags = (fd.tags || '').split(/[\s,，]+/).filter(Boolean);
    const mood = S.ui.mood;
    S.drafts.note = '';
    S.drafts.noteTags = '';
    S.ui.mood = null;
    try { await post('notes', { content, mood, tags }); toast('已记录'); } catch (e) { toast('记录失败'); }
  },
  'note:save': async (fd, f) => {
    const id = f.dataset.id;
    const patch = {
      content: (fd.content || '').trim(),
      mood: Number(fd.mood) || null,
      tags: (fd.tags || '').split(/[\s,，]+/).filter(Boolean)
    };
    if (!patch.content) return;
    try {
      await put('notes', id, patch);
      closeModal();
      toast('已保存');
    } catch (e) { toast('保存失败'); }
  }
};

document.addEventListener('click', e => {
  const target = e.target;
  if (target.classList && target.classList.contains('modal-wrap')) { closeModal(); return; }
  if (target.classList && target.classList.contains('sheet-wrap')) { closeSheet(); return; }
  const el = target.closest ? target.closest('[data-act]') : null;
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (!fn) return;
  if (!(el instanceof HTMLAnchorElement)) e.preventDefault();
  fn(el, e);
});

document.addEventListener('submit', e => {
  const f = e.target.closest ? e.target.closest('form[data-form]') : null;
  if (!f) return;
  e.preventDefault();
  e.stopPropagation();
  const fd = {};
  new FormData(f).forEach((v, k) => { fd[k] = v; });
  const fn = FORMS[f.dataset.form];
  if (fn) fn(fd, f);
});

document.addEventListener('input', e => {
  const t = e.target;
  if (!t) return;
  if (t.id === 'todo-search') { S.ui.qTodos = t.value; render(); return; }
  if (t.id === 'note-search') { S.ui.qNotes = t.value; render(); return; }
  if (t.dataset && t.dataset.draft) S.drafts[t.dataset.draft] = t.value;
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t && t.id === 'draw-fair') { S.ui.draw.fair = !!t.checked; return; }
  if (t && t.id === 'import-file') {
    const file = t.files && t.files[0];
    if (file) {
      try {
        const data = JSON.parse(await file.text());
        await api('PUT', '/api/state', data);
        S.data = await api('GET', '/api/state');
        applyTheme();
        applyAccent();
        render();
        toast('导入成功');
      } catch (err) {
        toast('导入失败：文件格式不正确');
      }
    }
    t.value = '';
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeSheet(); return; }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target && e.target.tagName === 'TEXTAREA') {
    const f = e.target.closest('form[data-form]');
    if (f) { e.preventDefault(); f.requestSubmit(); }
  }
});

function showAuth(tab) {
  if (tab) S.ui.authTab = tab;
  const t = S.ui.authTab || 'login';
  const needInvite = !!(S.info && S.info.invite);
  document.body.classList.add('need-auth');
  const auth = $('#auth');
  if (!auth) return;
  auth.innerHTML = `<div class="auth-card">
    <div class="auth-head">
      <span class="logo big">T</span>
      <div>
        <div class="auth-name">Tdaily</div>
        <div class="auth-slogan">待办 · 习惯 · 记录 · 每个账号数据独立</div>
      </div>
    </div>
    <div class="seg auth-tabs">
      <button class="seg-btn ${t === 'login' ? 'on' : ''}" data-act="auth:tab" data-v="login">登录</button>
      <button class="seg-btn ${t === 'register' ? 'on' : ''}" data-act="auth:tab" data-v="register">注册新账号</button>
    </div>
    <form class="auth-form" data-form="auth:${t}">
      <input class="input" name="name" id="auth-name" placeholder="昵称" autocomplete="username" maxlength="20">
      <input class="input" type="password" name="password" placeholder="${t === 'register' ? '设置密码（至少 6 位）' : '密码'}" autocomplete="${t === 'register' ? 'new-password' : 'current-password'}">
      ${t === 'register' ? '<input class="input" type="email" name="email" placeholder="邮箱（可选，用于找回账号）" autocomplete="email">' : ''}
      ${t === 'register' && needInvite ? '<input class="input" name="invite" placeholder="邀请码">' : ''}
      <div class="auth-err" id="auth-err"></div>
      <button class="btn primary auth-submit" type="submit">${t === 'login' ? '登 录' : '注册并进入'}</button>
    </form>
    <p class="auth-tip">${t === 'login' ? '还没有账号？点击上方「注册新账号」即可创建' : '注册后拥有独立的待办、习惯与记录空间'}</p>
    <p class="auth-foot">Tdaily · 多账号日常系统</p>
  </div>`;
  const el = $('#auth-name');
  if (el) setTimeout(() => el.focus(), 60);
}

async function startApp() {
  S.data = await api('GET', '/api/state');
  document.body.classList.remove('need-auth');
  if (!location.hash) location.hash = '#/today';
  applyTheme();
  applyAccent();
  const btnIc = document.querySelector('.btn .btn-ic');
  if (btnIc) btnIc.innerHTML = IC(P.plus, 18);
  pomoRestore();
  render();
  setInterval(() => { if (S.user) loadFriends(true); }, 30000);
}

function authError(msg) {
  const el = $('#auth-err');
  if (el) el.textContent = msg || '';
  document.querySelectorAll('.auth-submit').forEach(b => { b.disabled = false; });
}

(async function boot() {
  window.addEventListener('hashchange', () => { closeSheet(); render(); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (S.data.settings.theme === 'auto') applyTheme();
  });
  try {
    S.info = await api('GET', '/api/info');
  } catch (err) {
    S.info = null;
  }
  try {
    const me = await api('GET', '/api/me');
    S.user = me && me.user;
    await startApp();
  } catch (err) {
    if (err.status === 401) {
      showAuth();
      return;
    }
    const view = $('#view');
    if (view) view.innerHTML = '<div class="card empty">无法连接 Tdaily 服务，请先运行 启动Tdaily.bat，然后刷新页面。</div>';
  }
})();

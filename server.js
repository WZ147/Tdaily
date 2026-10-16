'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const zlib = require('zlib');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const USERS_DIR = path.join(DATA_DIR, 'users');
const SOCIAL_FILE = path.join(DATA_DIR, 'social.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const PORT = Number(process.env.PORT) || 3888;
const HOST = '0.0.0.0';
const SESSION_DAYS = 30;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function atomicWrite(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  try {
    fs.renameSync(tmp, file);
  } catch (err) {
    fs.writeFileSync(file, text, 'utf8');
    try { fs.unlinkSync(tmp); } catch (e) {}
  }
}

function loadJson(file, fallback) {
  try {
    const v = JSON.parse(fs.readFileSync(file, 'utf8'));
    return v == null ? fallback : v;
  } catch (err) {
    return fallback;
  }
}

function defaultDB() {
  const now = Date.now();
  const td = ymd(new Date());
  return {
    projects: [
      { id: 'p-work', name: '工作', color: '#4f6ef7', icon: '💼' },
      { id: 'p-life', name: '生活', color: '#10b981', icon: '🏠' },
      { id: 'p-study', name: '学习', color: '#f59e0b', icon: '📚' }
    ],
    todos: [
      { id: 't-welcome', title: '欢迎使用 Tdaily 🎉', note: '点击左侧圆圈完成任务，点击标题可编辑。', due: td, priority: 2, projectId: 'p-life', tags: ['新手'], repeat: 'none', done: false, createdAt: now, completedAt: null },
      { id: 't-demo1', title: '去「习惯」页完成一次打卡', note: '', due: td, priority: 1, projectId: 'p-life', tags: [], repeat: 'none', done: false, createdAt: now, completedAt: null },
      { id: 't-demo2', title: '试试快速添加：在输入框写「明天 !! 健身 #运动」', note: '', due: null, priority: 0, projectId: 'p-work', tags: [], repeat: 'none', done: false, createdAt: now, completedAt: null }
    ],
    habits: [
      { id: 'h-morning', name: '早起', icon: '🌅', color: '#f59e0b', records: {}, createdAt: now },
      { id: 'h-read', name: '阅读 30 分钟', icon: '📖', color: '#10b981', records: {}, createdAt: now }
    ],
    notes: [
      { id: 'n-welcome', content: '这里是「记录」页：随手写下想法、心情、灵感，像发朋友圈一样简单。', mood: 2, tags: ['开始'], createdAt: now, updatedAt: now }
    ],
    focus: [],
    settings: { theme: 'light', accent: '#4f6ef7' }
  };
}

function normalize(src) {
  const base = defaultDB();
  const db = {};
  for (const k of ['todos', 'habits', 'notes', 'projects', 'focus']) {
    db[k] = Array.isArray(src && src[k]) ? src[k] : [];
  }
  db.settings = src && typeof src.settings === 'object' && src.settings
    ? Object.assign({}, base.settings, src.settings)
    : base.settings;
  return db;
}

let users = loadJson(USERS_FILE, []);
let sessions = loadJson(SESSIONS_FILE, {});
const loginFails = new Map();

if (users.length && !users.some(u => u.role === 'admin')) {
  const first = users.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))[0];
  if (first) {
    first.role = 'admin';
    atomicWrite(USERS_FILE, JSON.stringify(users, null, 2));
  }
}

function saveUsers() { atomicWrite(USERS_FILE, JSON.stringify(users, null, 2)); }
function saveSessions() {
  const now = Date.now();
  for (const t of Object.keys(sessions)) {
    if (!sessions[t] || sessions[t].exp < now) delete sessions[t];
  }
  atomicWrite(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function pubUser(u) { return { id: u.id, name: u.name, avatar: u.avatar || '', email: u.email || '', role: u.role || 'user', createdAt: u.createdAt }; }
function findUserByName(name) {
  const n = String(name || '').trim().toLowerCase();
  return users.find(u => u.name.toLowerCase() === n);
}
function hashPw(pw, salt) { return crypto.scryptSync(String(pw), salt, 64).toString('hex'); }
function verifyPw(u, pw) {
  try {
    const a = Buffer.from(u.hash, 'hex');
    const b = Buffer.from(hashPw(pw, u.salt), 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

function newSession(uidValue) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = { uid: uidValue, exp: Date.now() + SESSION_DAYS * 86400000 };
  saveSessions();
  return token;
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', `td_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'td_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

function sessionUser(req) {
  const token = parseCookies(req).td_session;
  const s = token && sessions[token];
  if (!s) return null;
  if (s.exp < Date.now()) { delete sessions[token]; saveSessions(); return null; }
  const u = users.find(x => x.id === s.uid);
  if (!u || u.banned) return null;
  return u;
}

function userDataFile(id) { return path.join(USERS_DIR, id + '.json'); }

function loadUserData(id) {
  try {
    return normalize(JSON.parse(fs.readFileSync(userDataFile(id), 'utf8')));
  } catch (err) {
    const fresh = defaultDB();
    saveUserData(id, fresh);
    return fresh;
  }
}

function saveUserData(id, data) { atomicWrite(userDataFile(id), JSON.stringify(data, null, 2)); }

function defaultSocial() {
  return {
    rooms: [{ id: 'r-hall', name: '公共大厅', icon: '🏛️', creatorId: null, creatorName: 'Tdaily', createdAt: Date.now() }],
    messages: [],
    posts: [],
    reads: {},
    friendRequests: [],
    friendships: [],
    dms: [],
    dmReads: {}
  };
}

let social = loadJson(SOCIAL_FILE, null);
if (!social || typeof social !== 'object') {
  social = defaultSocial();
  atomicWrite(SOCIAL_FILE, JSON.stringify(social, null, 2));
}
if (!Array.isArray(social.rooms)) social.rooms = defaultSocial().rooms;
if (!Array.isArray(social.messages)) social.messages = [];
if (!Array.isArray(social.posts)) social.posts = [];
if (!social.reads || typeof social.reads !== 'object') social.reads = {};
if (!Array.isArray(social.friendRequests)) social.friendRequests = [];
if (!Array.isArray(social.friendships)) social.friendships = [];
if (!Array.isArray(social.dms)) social.dms = [];
if (!social.dmReads || typeof social.dmReads !== 'object') social.dmReads = {};

function saveSocial() { atomicWrite(SOCIAL_FILE, JSON.stringify(social, null, 2)); }

const actLimits = new Map();

function tooFast(key, ms) {
  const now = Date.now();
  const last = actLimits.get(key) || 0;
  if (now - last < ms) return true;
  actLimits.set(key, now);
  return false;
}

function defaultClassStore() { return { classes: [], membership: {} }; }

let classStore = loadJson(CLASSES_FILE, null);
if (!classStore || typeof classStore !== 'object') {
  classStore = defaultClassStore();
  atomicWrite(CLASSES_FILE, JSON.stringify(classStore, null, 2));
}
if (!Array.isArray(classStore.classes)) classStore.classes = [];
if (!classStore.membership || typeof classStore.membership !== 'object') classStore.membership = {};

function saveClasses() { atomicWrite(CLASSES_FILE, JSON.stringify(classStore, null, 2)); }
function classByUser(uidValue) {
  const cid = classStore.membership[uidValue];
  return cid ? classStore.classes.find(c => c.id === cid) : null;
}
function newClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (classStore.classes.some(c => c.code === code));
  return code;
}

function lanIPs() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 5 * 1024 * 1024) { reject(new Error('payload too large')); req.destroy(); return; }
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function importState(udb, src) {
  for (const k of ['todos', 'habits', 'notes', 'projects', 'focus']) {
    if (Array.isArray(src[k])) udb[k] = src[k];
  }
  if (src.settings && typeof src.settings === 'object') {
    udb.settings = Object.assign({}, udb.settings, src.settings);
  }
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const method = req.method;
  const ip = req.socket.remoteAddress || '';

  if (parts[1] === 'info' && method === 'GET') {
    return send(res, 200, { name: 'Tdaily', version: '1.7.0', port: PORT, lan: lanIPs(), invite: !!process.env.TD_INVITE });
  }

  if (parts[1] === 'register' && method === 'POST') {
    const body = await readBody(req);
    if (process.env.TD_INVITE && String(body.invite || '') !== process.env.TD_INVITE) {
      return send(res, 403, { error: '邀请码不正确' });
    }
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    if (!/^\S{2,20}$/.test(name)) return send(res, 400, { error: '昵称需为 2-20 个字符，且不含空格' });
    if (password.length < 6) return send(res, 400, { error: '密码至少 6 位' });
    if (password.length > 100) return send(res, 400, { error: '密码过长' });
    if (findUserByName(name)) return send(res, 409, { error: '该昵称已被注册' });
    const email = String(body.email || '').trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: '邮箱格式不正确' });
    if (email && users.some(u => (u.email || '') === email)) return send(res, 409, { error: '该邮箱已被使用' });
    const salt = crypto.randomBytes(16).toString('hex');
    const user = { id: 'u-' + uid(), name, email, avatar: '', role: users.length === 0 ? 'admin' : 'user', salt, hash: hashPw(password, salt), createdAt: Date.now() };
    users.push(user);
    saveUsers();
    let initial = null;
    if (users.length === 1 && fs.existsSync(DB_FILE)) {
      try {
        initial = normalize(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
        fs.renameSync(DB_FILE, DB_FILE + '.migrated');
      } catch (err) { initial = null; }
    }
    saveUserData(user.id, initial || defaultDB());
    setSessionCookie(res, newSession(user.id));
    return send(res, 200, { user: pubUser(user) });
  }

  if (parts[1] === 'login' && method === 'POST') {
    const f = loginFails.get(ip);
    if (f && Date.now() - f.ts < 15 * 60000 && f.n >= 10) {
      return send(res, 429, { error: '尝试次数过多，请 15 分钟后再试' });
    }
    const body = await readBody(req);
    const user = findUserByName(body.name);
    if (!user || !verifyPw(user, body.password)) {
      const cur = loginFails.get(ip) || { n: 0, ts: Date.now() };
      cur.n++;
      cur.ts = Date.now();
      loginFails.set(ip, cur);
      return send(res, 401, { error: '昵称或密码不正确' });
    }
    loginFails.delete(ip);
    if (user.banned) return send(res, 403, { error: '该账号已被管理员封禁' });
    setSessionCookie(res, newSession(user.id));
    return send(res, 200, { user: pubUser(user) });
  }

  if (parts[1] === 'logout' && method === 'POST') {
    const token = parseCookies(req).td_session;
    if (token) { delete sessions[token]; saveSessions(); }
    clearSessionCookie(res);
    return send(res, 200, { ok: true });
  }

  const user = sessionUser(req);
  if (!user) return send(res, 401, { error: '请先登录' });

  if (parts[1] === 'me' && method === 'GET') {
    return send(res, 200, { user: pubUser(user) });
  }

  if (parts[1] === 'profile' && method === 'POST') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const avatarStr = String(body.avatar || '').slice(0, 4);
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^\S{2,20}$/.test(name)) return send(res, 400, { error: '昵称需为 2-20 个字符，且不含空格' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: '邮箱格式不正确' });
    if (email && users.some(u => u.id !== user.id && (u.email || '') === email)) return send(res, 409, { error: '该邮箱已被使用' });
    const other = users.find(u => u.id !== user.id && u.name.toLowerCase() === name.toLowerCase());
    if (other) return send(res, 409, { error: '该昵称已被使用' });
    user.name = name;
    user.avatar = avatarStr;
    user.email = email;
    saveUsers();
    return send(res, 200, { user: pubUser(user) });
  }

  if (parts[1] === 'social') {
    await handleSocial(req, res, parts, url, user, method);
    return;
  }

  if (parts[1] === 'friends') {
    await handleFriends(req, res, parts, user, method);
    return;
  }

  if (parts[1] === 'dm' && parts[2]) {
    await handleDm(req, res, parts, url, user, method);
    return;
  }

  if (parts[1] === 'class') {
    await handleClass(req, res, parts, user, method);
    return;
  }

  if (parts[1] === 'admin') {
    if (user.role !== 'admin') return send(res, 403, { error: '需要管理员权限' });
    await handleAdmin(req, res, parts, url, user, method);
    return;
  }

  const udb = loadUserData(user.id);

  if (parts[1] === 'state' && method === 'GET') return send(res, 200, udb);
  if (parts[1] === 'state' && method === 'PUT') {
    const body = await readBody(req);
    importState(udb, body);
    saveUserData(user.id, udb);
    return send(res, 200, udb);
  }
  if (parts[1] === 'settings' && method === 'PUT') {
    const body = await readBody(req);
    udb.settings = Object.assign({}, udb.settings, body);
    saveUserData(user.id, udb);
    return send(res, 200, udb.settings);
  }

  const cols = ['todos', 'habits', 'notes', 'projects', 'focus'];
  const col = parts[1];
  const id = parts[2];

  if (col === 'habits' && id && parts[3] === 'toggle' && method === 'POST') {
    const habit = udb.habits.find(x => x.id === id);
    if (!habit) return send(res, 404, { error: 'not found' });
    const body = await readBody(req);
    const date = String(body.date || ymd(new Date()));
    if (!habit.records) habit.records = {};
    if (habit.records[date]) delete habit.records[date];
    else habit.records[date] = 1;
    saveUserData(user.id, udb);
    return send(res, 200, habit);
  }

  if (cols.includes(col)) {
    if (method === 'POST' && !id) {
      const body = await readBody(req);
      const item = Object.assign({}, body, { id: uid(), createdAt: Date.now() });
      udb[col].push(item);
      saveUserData(user.id, udb);
      return send(res, 200, item);
    }
    if (method === 'PUT' && id) {
      const item = udb[col].find(x => x.id === id);
      if (!item) return send(res, 404, { error: 'not found' });
      const body = await readBody(req);
      delete body.id;
      Object.assign(item, body);
      saveUserData(user.id, udb);
      return send(res, 200, item);
    }
    if (method === 'DELETE' && id) {
      udb[col] = udb[col].filter(x => x.id !== id);
      saveUserData(user.id, udb);
      return send(res, 200, { ok: true });
    }
  }
  send(res, 404, { error: 'not found' });
}

async function handleSocial(req, res, parts, url, user, method) {
  const seg = parts[2];

  if (seg === 'rooms') {
    const roomId = parts[3];

    if (roomId && parts[4] === 'messages' && !parts[5]) {
      if (method === 'GET') {
        const after = Number(url.searchParams.get('after')) || 0;
        const list = social.messages.filter(m => m.roomId === roomId && m.createdAt > after).slice(-300);
        return send(res, 200, { messages: list });
      }
      if (method === 'POST') {
        if (!social.rooms.find(r => r.id === roomId)) return send(res, 404, { error: '聊天室不存在' });
        if (tooFast('m:' + user.id, 400)) return send(res, 429, { error: '发得太快了，缓一缓' });
        const body = await readBody(req);
        const content = String(body.content || '').trim().slice(0, 1000);
        if (!content) return send(res, 400, { error: '内容不能为空' });
        const msg = { id: uid(), roomId, userId: user.id, userName: user.name, av: user.avatar || '', content, createdAt: Date.now() };
        social.messages.push(msg);
        if (social.messages.length > 20000) social.messages = social.messages.slice(-15000);
        social.reads[user.id] = social.reads[user.id] || {};
        social.reads[user.id][roomId] = msg.createdAt;
        saveSocial();
        return send(res, 200, msg);
      }
    }

    if (roomId && parts[4] === 'messages' && parts[5] && method === 'DELETE') {
      const i = social.messages.findIndex(m => m.id === parts[5] && m.roomId === roomId);
      if (i < 0) return send(res, 404, { error: '消息不存在' });
      if (social.messages[i].userId !== user.id && user.role !== 'admin') return send(res, 403, { error: '只能撤回自己的消息' });
      social.messages.splice(i, 1);
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (roomId && parts[4] === 'read' && method === 'POST') {
      social.reads[user.id] = social.reads[user.id] || {};
      social.reads[user.id][roomId] = Date.now();
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (roomId && !parts[4] && method === 'DELETE') {
      const room = social.rooms.find(r => r.id === roomId);
      if (!room) return send(res, 404, { error: '聊天室不存在' });
      if (room.id === 'r-hall') return send(res, 403, { error: '公共大厅不能删除' });
      if (room.creatorId !== user.id) return send(res, 403, { error: '只有创建者可以删除' });
      social.rooms = social.rooms.filter(r => r.id !== roomId);
      social.messages = social.messages.filter(m => m.roomId !== roomId);
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (!roomId && method === 'GET') {
      const last = {};
      const unread = {};
      const myReads = social.reads[user.id] || {};
      for (const m of social.messages) {
        const l = last[m.roomId];
        if (!l || m.createdAt > l.createdAt) last[m.roomId] = m;
        if (m.createdAt > (myReads[m.roomId] || 0)) unread[m.roomId] = (unread[m.roomId] || 0) + 1;
      }
      const rooms = social.rooms.map(r => ({
        id: r.id, name: r.name, icon: r.icon, creatorId: r.creatorId, createdAt: r.createdAt,
        unread: unread[r.id] || 0,
        last: last[r.id] ? { userName: last[r.id].userName, content: last[r.id].content, createdAt: last[r.id].createdAt } : null
      }));
      rooms.sort((a, b) => (b.last ? b.last.createdAt : b.createdAt) - (a.last ? a.last.createdAt : a.createdAt));
      const hi = rooms.findIndex(r => r.id === 'r-hall');
      if (hi > 0) rooms.unshift(rooms.splice(hi, 1)[0]);
      return send(res, 200, { rooms });
    }

    if (!roomId && method === 'POST') {
      if (tooFast('room:' + user.id, 10000)) return send(res, 429, { error: '操作太快，稍后再试' });
      const body = await readBody(req);
      const name = String(body.name || '').trim().slice(0, 12);
      const icon = String(body.icon || '💬').slice(0, 4) || '💬';
      if (!name) return send(res, 400, { error: '聊天室名称不能为空' });
      if (social.rooms.length >= 50) return send(res, 400, { error: '聊天室数量已达上限' });
      const room = { id: uid(), name, icon, creatorId: user.id, creatorName: user.name, createdAt: Date.now() };
      social.rooms.push(room);
      saveSocial();
      return send(res, 200, room);
    }
  }

  if (seg === 'posts') {
    const postId = parts[3];

    if (postId && parts[4] === 'like' && method === 'POST') {
      const post = social.posts.find(p => p.id === postId);
      if (!post) return send(res, 404, { error: '动态不存在' });
      post.likes = post.likes || [];
      const i = post.likes.indexOf(user.id);
      if (i >= 0) post.likes.splice(i, 1);
      else post.likes.push(user.id);
      saveSocial();
      return send(res, 200, { liked: i < 0, likeCount: post.likes.length });
    }

    if (postId && parts[4] === 'comments' && !parts[5] && method === 'POST') {
      if (tooFast('c:' + user.id, 2000)) return send(res, 429, { error: '评论太快，稍后再试' });
      const post = social.posts.find(p => p.id === postId);
      if (!post) return send(res, 404, { error: '动态不存在' });
      const body = await readBody(req);
      const content = String(body.content || '').trim().slice(0, 500);
      if (!content) return send(res, 400, { error: '评论不能为空' });
      post.comments = post.comments || [];
      const cmt = { id: uid(), userId: user.id, userName: user.name, av: user.avatar || '', content, createdAt: Date.now() };
      post.comments.push(cmt);
      saveSocial();
      return send(res, 200, cmt);
    }

    if (postId && parts[4] === 'comments' && parts[5] && method === 'DELETE') {
      const post = social.posts.find(p => p.id === postId);
      if (!post) return send(res, 404, { error: '动态不存在' });
      post.comments = (post.comments || []).filter(c => !(c.id === parts[5] && (c.userId === user.id || user.role === 'admin')));
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (postId && !parts[4] && method === 'DELETE') {
      const post = social.posts.find(p => p.id === postId);
      if (!post) return send(res, 404, { error: '动态不存在' });
      if (post.userId !== user.id && user.role !== 'admin') return send(res, 403, { error: '只能删除自己的动态' });
      social.posts = social.posts.filter(p => p.id !== postId);
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (!postId && method === 'GET') {
      const posts = social.posts.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 60).map(p => ({
        id: p.id, userId: p.userId, userName: p.userName, av: p.av || '', content: p.content, createdAt: p.createdAt,
        likeCount: (p.likes || []).length,
        liked: (p.likes || []).includes(user.id),
        comments: (p.comments || []).slice(-50).map(c => ({ id: c.id, userId: c.userId, userName: c.userName, av: c.av || '', content: c.content, createdAt: c.createdAt }))
      }));
      return send(res, 200, { posts });
    }

    if (!postId && method === 'POST') {
      if (tooFast('p:' + user.id, 5000)) return send(res, 429, { error: '发布太快，稍后再试' });
      const body = await readBody(req);
      const content = String(body.content || '').trim().slice(0, 5000);
      if (!content) return send(res, 400, { error: '内容不能为空' });
      const post = { id: uid(), userId: user.id, userName: user.name, av: user.avatar || '', content, likes: [], comments: [], createdAt: Date.now() };
      social.posts.push(post);
      if (social.posts.length > 2000) social.posts = social.posts.slice(-1500);
      saveSocial();
      return send(res, 200, {
        id: post.id, userId: post.userId, userName: post.userName, av: post.av,
        content: post.content, createdAt: post.createdAt, likeCount: 0, liked: false, comments: []
      });
    }
  }

  send(res, 404, { error: 'not found' });
}

function classDrawCounts(c) {
  const counts = {};
  for (const d of c.draws || []) {
    for (const p of d.picks || []) counts[p.sid] = (counts[p.sid] || 0) + 1;
  }
  return counts;
}

function classPayload(c, me) {
  const isOwner = c.ownerId === me.id;
  const students = (c.students || []).map(s => ({
    sid: s.sid, name: s.name || '', joined: !!s.userId, mine: s.userId === me.id
  }));
  const myRow = (c.students || []).find(s => s.userId === me.id);
  const joinedCount = (c.students || []).filter(s => s.userId).length;
  const collections = (c.collections || []).map(col => {
    const subs = col.subs || {};
    const base = {
      id: col.id, title: col.title, fields: col.fields, closed: !!col.closed,
      createdAt: col.createdAt, subCount: Object.keys(subs).length
    };
    if (isOwner) {
      base.subs = Object.values(subs).map(s => ({ sid: s.sid, name: s.name, values: s.values, at: s.at }))
        .sort((a, b) => String(a.sid).localeCompare(String(b.sid)));
    } else {
      base.mine = subs[me.id] || null;
    }
    return base;
  });
  const polls = (c.polls || []).map(p => {
    const votes = p.votes || {};
    const entries = Object.entries(votes);
    const tally = (p.options || []).map((_, i) => entries.filter(([, v]) => v.includes(i)).length);
    const out = {
      id: p.id, title: p.title, options: p.options, multi: !!p.multi, anonymous: !!p.anonymous,
      closed: !!p.closed, createdAt: p.createdAt, tally,
      voteCount: entries.length, myVotes: votes[me.id] || []
    };
    if (!p.anonymous) {
      out.voters = (p.options || []).map((_, i) => entries.filter(([, v]) => v.includes(i)).map(([uid2]) => {
        const st = (c.students || []).find(s => s.userId === uid2);
        return st ? (st.name || st.sid) : '未知';
      }));
    }
    if (isOwner) {
      out.notVoted = (c.students || []).filter(s => s.userId && !votes[s.userId]).map(s => ((s.name ? s.name + ' ' : '') + s.sid).trim());
    }
    return out;
  });
  return {
    class: {
      id: c.id, name: c.name, code: c.code, ownerId: c.ownerId, ownerName: c.ownerName,
      createdAt: c.createdAt, isOwner, total: (c.students || []).length, joined: joinedCount,
      my: { sid: myRow ? myRow.sid : '', name: myRow ? myRow.name : me.name }
    },
    students,
    collections,
    polls,
    draws: (c.draws || []).slice(-20).reverse(),
    drawCounts: classDrawCounts(c)
  };
}

function xmlDecode(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

function parseXlsx(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 xlsx 文件');
  const cdCount = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let n = 0; n < cdCount; n++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const cmtLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    entries[name] = { method, compSize, localOff };
    off += 46 + nameLen + extraLen + cmtLen;
  }
  function readEntry(name) {
    const e = entries[name];
    if (!e) return null;
    const lo = e.localOff;
    if (lo + 30 > buf.length) return null;
    const nameLen = buf.readUInt16LE(lo + 26);
    const extraLen = buf.readUInt16LE(lo + 28);
    const start = lo + 30 + nameLen + extraLen;
    const comp = buf.slice(start, start + e.compSize);
    if (e.method === 0) return comp.toString('utf8');
    return zlib.inflateRawSync(comp).toString('utf8');
  }
  const sharedXml = readEntry('xl/sharedStrings.xml');
  const shared = [];
  if (sharedXml) {
    const siRe = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = siRe.exec(sharedXml))) {
      let text = '';
      const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
      let t;
      while ((t = tRe.exec(m[1]))) text += xmlDecode(t[1]);
      shared.push(text);
    }
  }
  const sheetName = Object.keys(entries).find(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  if (!sheetName) throw new Error('找不到工作表');
  const sheetXml = readEntry(sheetName);
  const rows = [];
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(sheetXml)) && rows.length < 500) {
    const row = [];
    const cRe = /<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm;
    let seqCol = 0;
    while ((cm = cRe.exec(rm[1]))) {
      const attrs = cm[1];
      const inner = cm[2] || '';
      const rMatch = /r="([A-Z]+)\d+"/.exec(attrs);
      let col;
      if (rMatch) {
        col = 0;
        for (const ch of rMatch[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
        col -= 1;
      } else {
        col = seqCol;
      }
      seqCol = col + 1;
      const tMatch = /t="([^"]+)"/.exec(attrs);
      const type = tMatch ? tMatch[1] : '';
      let val = '';
      if (type === 's') {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (v) val = shared[Number(v[1])] || '';
      } else if (type === 'inlineStr') {
        const tRe2 = /<t[^>]*>([\s\S]*?)<\/t>/g;
        let t2;
        while ((t2 = tRe2.exec(inner))) val += xmlDecode(t2[1]);
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (v) val = xmlDecode(v[1]);
      }
      row[col] = String(val).trim();
    }
    for (let i = 0; i < row.length; i++) if (row[i] == null) row[i] = '';
    const trimmed = row.slice(0, 30);
    if (trimmed.some(x => x !== '')) rows.push(trimmed);
  }
  return rows;
}

function areFriends(a, b) {
  return social.friendships.some(f => (f.a === a && f.b === b) || (f.a === b && f.b === a));
}

async function handleFriends(req, res, parts, user, method) {
  const seg = parts[2];

  if (method === 'GET' && !seg) {
    const ids = social.friendships.filter(f => f.a === user.id || f.b === user.id).map(f => (f.a === user.id ? f.b : f.a));
    const myReads = social.dmReads[user.id] || {};
    const friends = ids.map(id => {
      const u = users.find(x => x.id === id);
      if (!u) return null;
      const convo = social.dms.filter(m => (m.from === id && m.to === user.id) || (m.from === user.id && m.to === id));
      const last = convo.length ? convo[convo.length - 1] : null;
      const unread = social.dms.filter(m => m.from === id && m.to === user.id && m.createdAt > (myReads[id] || 0)).length;
      return {
        id, name: u.name, avatar: u.avatar || '', unread,
        last: last ? { content: last.content, at: last.createdAt, mine: last.from === user.id } : null
      };
    }).filter(Boolean).sort((a, b) => (b.last ? b.last.at : 0) - (a.last ? a.last.at : 0));
    const requests = social.friendRequests.filter(r => r.to === user.id).map(r => {
      const u = users.find(x => x.id === r.from);
      return { id: r.id, fromId: r.from, fromName: u ? u.name : '已注销用户', at: r.createdAt };
    });
    const unreadTotal = friends.reduce((s, f) => s + f.unread, 0);
    return send(res, 200, { friends, requests, unreadTotal });
  }

  if (method === 'POST') {
    const body = await readBody(req);

    if (seg === 'request') {
      const name = String(body.name || '').trim();
      if (!name) return send(res, 400, { error: '请输入对方昵称' });
      const target = findUserByName(name);
      if (!target) return send(res, 404, { error: '没有找到这个用户' });
      if (target.id === user.id) return send(res, 400, { error: '不能添加自己为好友' });
      if (areFriends(user.id, target.id)) return send(res, 400, { error: '你们已经是好友了' });
      const reverse = social.friendRequests.find(r => r.from === target.id && r.to === user.id);
      if (reverse) {
        social.friendRequests = social.friendRequests.filter(r => r !== reverse);
        social.friendships.push({ id: uid(), a: user.id, b: target.id, at: Date.now() });
        saveSocial();
        return send(res, 200, { ok: true, autoAccepted: true, friendName: target.name });
      }
      if (social.friendRequests.some(r => r.from === user.id && r.to === target.id)) {
        return send(res, 400, { error: '已发送过申请，等待对方同意' });
      }
      if (tooFast('fr:' + user.id, 3000)) return send(res, 429, { error: '操作太快，稍后再试' });
      social.friendRequests.push({ id: uid(), from: user.id, to: target.id, createdAt: Date.now() });
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (seg === 'accept') {
      const r = social.friendRequests.find(x => x.id === body.id && x.to === user.id);
      if (!r) return send(res, 404, { error: '申请不存在' });
      social.friendRequests = social.friendRequests.filter(x => x !== r && !(x.from === r.to && x.to === r.from));
      if (!areFriends(r.from, user.id)) social.friendships.push({ id: uid(), a: r.from, b: user.id, at: Date.now() });
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (seg === 'reject') {
      social.friendRequests = social.friendRequests.filter(x => !(x.id === body.id && x.to === user.id));
      saveSocial();
      return send(res, 200, { ok: true });
    }

    if (seg === 'remove') {
      const fid = String(body.id || '');
      social.friendships = social.friendships.filter(f => !((f.a === user.id && f.b === fid) || (f.a === fid && f.b === user.id)));
      saveSocial();
      return send(res, 200, { ok: true });
    }
  }

  send(res, 404, { error: 'not found' });
}

async function handleDm(req, res, parts, url, user, method) {
  const friendId = parts[2];
  const friend = users.find(u => u.id === friendId);
  if (!friend) return send(res, 404, { error: '用户不存在' });
  if (!areFriends(user.id, friendId)) return send(res, 403, { error: '你们还不是好友' });

  if (method === 'GET') {
    const after = Number(url.searchParams.get('after')) || 0;
    const list = social.dms.filter(m =>
      ((m.from === user.id && m.to === friendId) || (m.from === friendId && m.to === user.id)) && m.createdAt > after
    ).slice(-300);
    social.dmReads[user.id] = social.dmReads[user.id] || {};
    social.dmReads[user.id][friendId] = Date.now();
    saveSocial();
    return send(res, 200, { messages: list, friend: { id: friend.id, name: friend.name, avatar: friend.avatar || '' } });
  }

  if (method === 'POST') {
    if (tooFast('dm:' + user.id, 400)) return send(res, 429, { error: '发得太快了' });
    const body = await readBody(req);
    const content = String(body.content || '').trim().slice(0, 1000);
    if (!content) return send(res, 400, { error: '内容不能为空' });
    const msg = { id: uid(), from: user.id, to: friendId, fromName: user.name, av: user.avatar || '', content, createdAt: Date.now() };
    social.dms.push(msg);
    if (social.dms.length > 50000) social.dms = social.dms.slice(-40000);
    saveSocial();
    return send(res, 200, msg);
  }

  send(res, 404, { error: 'not found' });
}

async function handleClass(req, res, parts, user, method) {
  const seg = parts[2];
  const mine = classByUser(user.id);
  const needOwner = () => (mine && mine.ownerId === user.id) ? mine : null;

  if (seg === 'xlsx-rows' && method === 'POST') {
    const body = await readBody(req);
    const b64 = String(body.file || '').replace(/^data:[^,]+,/, '');
    if (!b64) return send(res, 400, { error: '缺少文件内容' });
    let buf;
    try { buf = Buffer.from(b64, 'base64'); } catch (e) { return send(res, 400, { error: '文件内容无法识别' }); }
    if (buf.length > 4 * 1024 * 1024) return send(res, 400, { error: '文件太大（限 4MB）' });
    try {
      const rows = parseXlsx(buf);
      return send(res, 200, { rows });
    } catch (e) {
      return send(res, 400, { error: 'Excel 解析失败：' + (e.message || '未知错误') + '。可在 Excel/WPS 中「另存为 CSV」后再导入' });
    }
  }

  if (seg === 'lookup' && method === 'POST') {
    if (mine) return send(res, 400, { error: '你已在一个班级中，先退出再加入新班级' });
    const body = await readBody(req);
    const code = String(body.code || '').trim().toUpperCase();
    const sid = String(body.sid || '').trim().slice(0, 30);
    if (!sid) return send(res, 400, { error: '请填写学号' });
    const c = classStore.classes.find(x => x.code === code);
    if (!c) return send(res, 404, { error: '班级码不正确，请找班长确认' });
    const st = (c.students || []).find(s => s.sid === sid);
    if (c.students.length && !st) return send(res, 404, { error: '你的学号不在班级名单中，请联系班长' });
    return send(res, 200, {
      className: c.name,
      sid,
      name: st ? (st.name || '') : '',
      joined: !!(st && st.userId)
    });
  }

  if (method === 'GET' && !seg) {
    if (!mine) return send(res, 200, { class: null, students: [], collections: [], polls: [], draws: [], drawCounts: {} });
    return send(res, 200, classPayload(mine, user));
  }

  if (seg === 'create' && method === 'POST') {
    if (mine) return send(res, 400, { error: '你已在一个班级中，先退出再加入新班级' });
    const body = await readBody(req);
    const name = String(body.name || '').trim().slice(0, 20);
    const mySid = String(body.mySid || '').trim().slice(0, 30);
    if (!name) return send(res, 400, { error: '班级名称不能为空' });
    if (!mySid) return send(res, 400, { error: '请填写你的学号' });
    let roster = Array.isArray(body.roster) ? body.roster : String(body.roster || '').split(/\n+/);
    const seenSids = new Set();
    const parsed = [];
    for (const item of roster) {
      let sid, nm;
      if (item && typeof item === 'object') {
        sid = String(item.sid || '').trim().slice(0, 30);
        nm = String(item.name || '').trim().slice(0, 20);
      } else {
        const line = String(item || '').trim();
        if (!line) continue;
        const bits = line.split(/[\s,，、;；]+/).filter(Boolean);
        sid = String(bits[0] || '').slice(0, 30);
        nm = bits.slice(1).join(' ').slice(0, 20);
      }
      if (!sid || seenSids.has(sid)) continue;
      seenSids.add(sid);
      parsed.push({ sid, name: nm });
    }
    if (!seenSids.has(mySid)) parsed.unshift({ sid: mySid, name: '' });
    if (parsed.length > 200) return send(res, 400, { error: '名单最多 200 人' });
    const students = parsed.map(x => ({ sid: x.sid, name: x.name, userId: null, joinedAt: null }));
    const my = students.find(s => s.sid === mySid);
    my.name = user.name;
    my.userId = user.id;
    my.joinedAt = Date.now();
    const c = {
      id: uid(), name, code: newClassCode(), ownerId: user.id, ownerName: user.name,
      createdAt: Date.now(), students, collections: [], polls: [], draws: []
    };
    classStore.classes.push(c);
    classStore.membership[user.id] = c.id;
    saveClasses();
    return send(res, 200, classPayload(c, user));
  }

  if (seg === 'join' && method === 'POST') {
    if (mine) return send(res, 400, { error: '你已在一个班级中' });
    const body = await readBody(req);
    const code = String(body.code || '').trim().toUpperCase();
    const sid = String(body.sid || '').trim().slice(0, 30);
    const name = String(body.name || '').trim().slice(0, 20) || user.name;
    if (!sid) return send(res, 400, { error: '请填写学号' });
    const c = classStore.classes.find(x => x.code === code);
    if (!c) return send(res, 404, { error: '班级码不正确，请找班长确认' });
    const st = (c.students || []).find(s => s.sid === sid);
    if (c.students.length && !st) return send(res, 404, { error: '你的学号不在班级名单中，请联系班长' });
    if (st && st.userId) return send(res, 409, { error: '该学号已被加入过' });
    if (st) {
      st.userId = user.id;
      st.name = name;
      st.joinedAt = Date.now();
    } else {
      c.students.push({ sid, name, userId: user.id, joinedAt: Date.now() });
    }
    classStore.membership[user.id] = c.id;
    saveClasses();
    return send(res, 200, classPayload(c, user));
  }

  if (seg === 'leave' && method === 'POST') {
    if (!mine) return send(res, 404, { error: '你还没有加入班级' });
    if (mine.ownerId === user.id) return send(res, 400, { error: '班长不能退出，可以选择解散班级' });
    const st = (mine.students || []).find(s => s.userId === user.id);
    if (st) { st.userId = null; st.joinedAt = null; }
    delete classStore.membership[user.id];
    saveClasses();
    return send(res, 200, { class: null });
  }

  if (seg === 'dissolve' && method === 'POST') {
    const c = needOwner();
    if (!c) return send(res, 403, { error: '只有班长可以解散班级' });
    for (const s of c.students || []) if (s.userId) delete classStore.membership[s.userId];
    classStore.classes = classStore.classes.filter(x => x.id !== c.id);
    saveClasses();
    return send(res, 200, { class: null });
  }

  if (seg === 'code' && method === 'POST') {
    const c = needOwner();
    if (!c) return send(res, 403, { error: '只有班长可以操作' });
    c.code = newClassCode();
    saveClasses();
    return send(res, 200, { code: c.code });
  }

  if (seg === 'students' && method === 'POST') {
    const c = needOwner();
    if (!c) return send(res, 403, { error: '只有班长可以操作' });
    const body = await readBody(req);
    if (parts[3] === 'remove') {
      const sid = String(body.sid || '').trim();
      const st = (c.students || []).find(s => s.sid === sid);
      if (!st) return send(res, 404, { error: '名单中没有这个学号' });
      if (st.userId) delete classStore.membership[st.userId];
      c.students = c.students.filter(s => s.sid !== sid);
      saveClasses();
      return send(res, 200, { ok: true });
    }
    if (parts[3] === 'rename') {
      const sid = String(body.sid || '').trim();
      const nm = String(body.name || '').trim().slice(0, 20);
      const st = (c.students || []).find(s => s.sid === sid);
      if (!st) return send(res, 404, { error: '名单中没有这个学号' });
      st.name = nm;
      saveClasses();
      return send(res, 200, { ok: true });
    }
    let add = Array.isArray(body.add) ? body.add : String(body.add || '').split(/\n+/);
    let added = 0;
    for (const item of add) {
      let sid, nm;
      if (item && typeof item === 'object') {
        sid = String(item.sid || '').trim().slice(0, 30);
        nm = String(item.name || '').trim().slice(0, 20);
      } else {
        const line = String(item || '').trim();
        if (!line) continue;
        const bits = line.split(/[\s,，、;；]+/).filter(Boolean);
        sid = String(bits[0] || '').slice(0, 30);
        nm = bits.slice(1).join(' ').slice(0, 20);
      }
      if (!sid) continue;
      if ((c.students || []).some(s => s.sid === sid)) continue;
      if (c.students.length >= 200) break;
      c.students.push({ sid, name: nm, userId: null, joinedAt: null });
      added++;
    }
    saveClasses();
    return send(res, 200, { added });
  }

  if (seg === 'collections' && method === 'POST') {
    if (!mine) return send(res, 403, { error: '你还没有加入班级' });
    const body = await readBody(req);
    if (parts[3] === 'submit') {
      const col = (mine.collections || []).find(x => x.id === body.id);
      if (!col) return send(res, 404, { error: '收集任务不存在' });
      if (col.closed) return send(res, 400, { error: '该收集已结束' });
      const values = Array.isArray(body.values) ? body.values.map(v => String(v || '').trim().slice(0, 500)) : [];
      if (values.length !== col.fields.length) return send(res, 400, { error: '请填完所有字段' });
      if (values.every(v => !v)) return send(res, 400, { error: '内容不能全为空' });
      const st = (mine.students || []).find(s => s.userId === user.id);
      col.subs = col.subs || {};
      col.subs[user.id] = { sid: st ? st.sid : '', name: (st && st.name) ? st.name : user.name, values, at: Date.now() };
      saveClasses();
      return send(res, 200, { ok: true });
    }
    const c = needOwner();
    if (!c) return send(res, 403, { error: '只有班长可以操作' });
    if (parts[3] === 'close') {
      const col = (c.collections || []).find(x => x.id === body.id);
      if (col) col.closed = true;
      saveClasses();
      return send(res, 200, { ok: true });
    }
    if (parts[3] === 'delete') {
      c.collections = (c.collections || []).filter(x => x.id !== body.id);
      saveClasses();
      return send(res, 200, { ok: true });
    }
    const title = String(body.title || '').trim().slice(0, 50);
    let fields = Array.isArray(body.fields) ? body.fields : String(body.fields || '').split('\n');
    fields = fields.map(f => String(f).trim().slice(0, 30)).filter(Boolean).slice(0, 20);
    if (!title || !fields.length) return send(res, 400, { error: '请填写标题和至少一个字段' });
    c.collections = c.collections || [];
    c.collections.push({ id: uid(), title, fields, closed: false, createdAt: Date.now(), subs: {} });
    saveClasses();
    return send(res, 200, { ok: true });
  }

  if (seg === 'polls' && method === 'POST') {
    if (!mine) return send(res, 403, { error: '你还没有加入班级' });
    const body = await readBody(req);
    if (parts[3] === 'vote') {
      const p = (mine.polls || []).find(x => x.id === body.id);
      if (!p) return send(res, 404, { error: '投票不存在' });
      if (p.closed) return send(res, 400, { error: '投票已结束' });
      let choice = Array.isArray(body.choice) ? body.choice.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n < p.options.length) : [];
      choice = Array.from(new Set(choice)).sort((a, b) => a - b);
      if (!p.multi) choice = choice.slice(0, 1);
      if (!choice.length) return send(res, 400, { error: '请选择一个选项' });
      p.votes = p.votes || {};
      p.votes[user.id] = choice;
      saveClasses();
      return send(res, 200, { ok: true });
    }
    const c = needOwner();
    if (!c) return send(res, 403, { error: '只有班长可以操作' });
    if (parts[3] === 'close') {
      const p = (c.polls || []).find(x => x.id === body.id);
      if (p) p.closed = true;
      saveClasses();
      return send(res, 200, { ok: true });
    }
    if (parts[3] === 'delete') {
      c.polls = (c.polls || []).filter(x => x.id !== body.id);
      saveClasses();
      return send(res, 200, { ok: true });
    }
    const title = String(body.title || '').trim().slice(0, 50);
    let options = Array.isArray(body.options) ? body.options : String(body.options || '').split('\n');
    options = options.map(o => String(o).trim().slice(0, 50)).filter(Boolean).slice(0, 20);
    if (!title || options.length < 2) return send(res, 400, { error: '请填写标题和至少两个选项' });
    c.polls = c.polls || [];
    c.polls.push({ id: uid(), title, options, multi: !!body.multi, anonymous: !!body.anonymous, closed: false, createdAt: Date.now(), votes: {} });
    saveClasses();
    return send(res, 200, { ok: true });
  }

  if (seg === 'draw' && method === 'POST') {
    const c = needOwner();
    if (!c) return send(res, 403, { error: '只有班长可以发起抽人' });
    const body = await readBody(req);
    const students = (c.students || []).filter(s => s.sid);
    if (!students.length) return send(res, 400, { error: '班级里还没有学生' });
    let count = Math.max(1, Math.min(10, Number(body.count) || 1));
    count = Math.min(count, students.length);
    const fair = !!body.fair;
    const counts = classDrawCounts(c);
    const maxCount = Math.max(0, ...students.map(s => counts[s.sid] || 0));
    const pool = students.slice();
    const picks = [];
    for (let k = 0; k < count && pool.length; k++) {
      let idx = 0;
      if (fair) {
        const weights = pool.map(s => Math.max(1, maxCount + 1 - (counts[s.sid] || 0)));
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        idx = 0;
        while (idx < pool.length - 1 && r > weights[idx]) { r -= weights[idx]; idx++; }
      } else {
        idx = Math.floor(Math.random() * pool.length);
      }
      const s = pool.splice(idx, 1)[0];
      picks.push({ sid: s.sid, name: s.name || '', count: (counts[s.sid] || 0) + 1 });
    }
    const draw = { id: uid(), at: Date.now(), by: user.name, count, fair, picks };
    c.draws = c.draws || [];
    c.draws.push(draw);
    if (c.draws.length > 200) c.draws = c.draws.slice(-200);
    saveClasses();
    return send(res, 200, { draw, drawCounts: classDrawCounts(c) });
  }

  send(res, 404, { error: 'not found' });
}

async function handleAdmin(req, res, parts, url, user, method) {
  const seg = parts[2];

  if (method === 'GET' && seg === 'overview') {
    const comments = social.posts.reduce((s, p) => s + (p.comments || []).length, 0);
    return send(res, 200, {
      stats: {
        users: users.length,
        banned: users.filter(u => u.banned).length,
        posts: social.posts.length,
        comments,
        messages: social.messages.length,
        classes: classStore.classes.length
      },
      users: users.map(u => ({
        id: u.id, name: u.name, email: u.email || '', role: u.role || 'user',
        banned: !!u.banned, createdAt: u.createdAt,
        clazz: (classStore.classes.find(c => c.id === classStore.membership[u.id]) || {}).name || ''
      })),
      posts: social.posts.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 100).map(p => ({
        id: p.id, userName: p.userName, av: p.av || '', content: p.content, createdAt: p.createdAt,
        likeCount: (p.likes || []).length, commentCount: (p.comments || []).length
      })),
      rooms: social.rooms.map(r => ({
        id: r.id, name: r.name, icon: r.icon,
        messageCount: social.messages.filter(m => m.roomId === r.id).length
      })),
      classes: classStore.classes.map(c => ({
        id: c.id, name: c.name, ownerName: c.ownerName,
        total: (c.students || []).length, joined: (c.students || []).filter(s => s.userId).length
      }))
    });
  }

  if (method === 'GET' && seg === 'messages') {
    const roomId = url.searchParams.get('room') || '';
    const list = social.messages.filter(m => m.roomId === roomId).slice(-200);
    return send(res, 200, { messages: list });
  }

  if (method === 'POST') {
    const body = await readBody(req);

    if (seg === 'users') {
      const target = users.find(u => u.id === body.id);
      if (!target) return send(res, 404, { error: '用户不存在' });
      const action = parts[3];
      if (action === 'ban') {
        if (target.id === user.id) return send(res, 400, { error: '不能封禁自己' });
        target.banned = !!body.banned;
        if (target.banned) {
          for (const t of Object.keys(sessions)) if (sessions[t].uid === target.id) delete sessions[t];
          saveSessions();
        }
        saveUsers();
        return send(res, 200, { ok: true });
      }
      if (action === 'role') {
        if (target.id === user.id) return send(res, 400, { error: '不能修改自己的角色' });
        target.role = body.role === 'admin' ? 'admin' : 'user';
        if (target.role === 'user' && !users.some(u => u.role === 'admin')) target.role = 'admin';
        saveUsers();
        return send(res, 200, { ok: true });
      }
      if (action === 'delete') {
        if (target.id === user.id) return send(res, 400, { error: '不能删除自己' });
        if ((target.role || 'user') === 'admin') return send(res, 400, { error: '不能删除管理员，先取消其管理员身份' });
        for (const t of Object.keys(sessions)) if (sessions[t].uid === target.id) delete sessions[t];
        saveSessions();
        const cid = classStore.membership[target.id];
        if (cid) {
          const c = classStore.classes.find(x => x.id === cid);
          if (c) {
            const st = (c.students || []).find(s => s.userId === target.id);
            if (st) { st.userId = null; st.joinedAt = null; }
          }
          delete classStore.membership[target.id];
          saveClasses();
        }
        users = users.filter(u => u.id !== target.id);
        saveUsers();
        try { fs.unlinkSync(userDataFile(target.id)); } catch (e) {}
        return send(res, 200, { ok: true });
      }
    }

    if (seg === 'posts') {
      if (parts[3] === 'delete') {
        social.posts = social.posts.filter(p => p.id !== body.id);
        saveSocial();
        return send(res, 200, { ok: true });
      }
      if (parts[3] === 'clear') {
        social.posts = [];
        saveSocial();
        return send(res, 200, { ok: true });
      }
      if (parts[3] === 'comments' && parts[4] === 'delete') {
        const p = social.posts.find(x => x.id === body.postId);
        if (p) {
          p.comments = (p.comments || []).filter(c => c.id !== body.commentId);
          saveSocial();
        }
        return send(res, 200, { ok: true });
      }
    }

    if (seg === 'messages') {
      if (parts[3] === 'delete') {
        social.messages = social.messages.filter(m => m.id !== body.id);
        saveSocial();
        return send(res, 200, { ok: true });
      }
      if (parts[3] === 'clear') {
        social.messages = social.messages.filter(m => m.roomId !== body.roomId);
        social.reads = {};
        saveSocial();
        return send(res, 200, { ok: true });
      }
    }

    if (seg === 'classes') {
      if (parts[3] === 'delete') {
        const c = classStore.classes.find(x => x.id === body.id);
        if (c) {
          for (const s of c.students || []) if (s.userId) delete classStore.membership[s.userId];
          classStore.classes = classStore.classes.filter(x => x.id !== c.id);
          saveClasses();
        }
        return send(res, 200, { ok: true });
      }
    }
  }

  send(res, 404, { error: 'not found' });
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, pathname));
  const inside = file === PUBLIC_DIR || file.startsWith(PUBLIC_DIR + path.sep);
  if (!inside) return send(res, 403, { error: 'forbidden' });
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, { error: 'not found' });
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch(err => {
      console.error('[api error]', err && err.message);
      send(res, 500, { error: 'server error' });
    });
    return;
  }
  serveStatic(req, res, url);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error(`  端口 ${PORT} 已被占用，Tdaily 可能已在运行。`);
    console.error(`  可以浏览器直接访问 http://localhost:${PORT} ，或先运行 停止Tdaily.bat 再重启。`);
    console.error('');
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  Tdaily 已启动（多账号模式）');
  console.log(`  本机访问:  http://localhost:${PORT}`);
  for (const ip of lanIPs()) {
    console.log(`  局域网访问: http://${ip}:${PORT}   (同一 WiFi 的设备均可打开并注册)`);
  }
  console.log(`  数据目录:  ${DATA_DIR}`);
  if (process.env.TD_INVITE) console.log('  注册方式:  需要邀请码（TD_INVITE 已设置）');
  else console.log('  注册方式:  开放注册（如需邀请码，设置环境变量 TD_INVITE=你的邀请码）');
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});

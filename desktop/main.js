const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// 服务器地址：默认连本机，可通过环境变量 TDAILY_URL 覆盖，
// 或直接改成你自己部署的地址，例如 https://tdaily.example.com
const APP_URL = process.env.TDAILY_URL || 'http://localhost:3888';

function errorPage() {
  const html = `<!doctype html><html><body style="margin:0;font-family:sans-serif;background:#faf1ef;display:flex;align-items:center;justify-content:center;height:100vh">
    <div style="text-align:center">
      <div style="font-size:42px">🌤️</div>
      <h2 style="margin:10px 0 6px">暂时连不上 Tdaily</h2>
      <p style="color:#7e6f6a">请检查网络（或确认服务器在运行），然后重试</p>
      <button onclick="location.href='${APP_URL}'" style="margin-top:10px;padding:9px 22px;border-radius:10px;border:0;background:#e4574c;color:#fff;font-size:15px;cursor:pointer">重新加载</button>
    </div>
  </body></html>`;
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 380,
    autoHideMenuBar: true,
    backgroundColor: '#faf1ef',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      spellcheck: false
    }
  });
  win.loadURL(APP_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (isMainFrame && url !== APP_URL) return;
    if (isMainFrame) win.loadURL(errorPage());
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

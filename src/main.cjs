const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { autoUpdater } = require('electron-updater');
const { execFile } = require('node:child_process');

const dev = process.argv.includes('--dev');
let dock, panel, tray, quitting = false;
let db;
const defaults = () => ({ tasks: [], notes: [], reminders: [], settings: { accent: 'lime', minimizeToTray: true } });
const storePath = () => path.join(app.getPath('userData'), 'orbi-data.json');
function load() {
  try { db = { ...defaults(), ...JSON.parse(fs.readFileSync(storePath(), 'utf8')) }; }
  catch { db = defaults(); }
  db.settings = { ...defaults().settings, ...(db.settings || {}) };
  for (const k of ['tasks','notes','reminders']) if (!Array.isArray(db[k])) db[k] = [];
}
function save() {
  const dest = storePath();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, dest);
  broadcast('data:changed', db);
}
function broadcast(channel, payload) {
  for (const w of [dock,panel]) if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
}
function makeDock() {
  const {width} = screen.getPrimaryDisplay().workAreaSize;
  dock = new BrowserWindow({ width: 278, height: 48, x: Math.round((width - 278)/2), y: 0,
    frame: false, transparent: true, alwaysOnTop: true, resizable: false, show: false,
    skipTaskbar: true, backgroundColor: '#00000000', webPreferences: { preload: path.join(__dirname,'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  dock.loadFile(path.join(__dirname, 'dock.html'));
  dock.once('ready-to-show', () => dock.show());
  dock.on('closed', () => {dock = null;});
}
function makePanel() {
  const {width: sw, height: sh} = screen.getPrimaryDisplay().workAreaSize;
  const w = Math.min(1030, sw - 28), h = Math.min(720, sh - 78);
  panel = new BrowserWindow({ width: w, height: h, x: Math.round((sw-w)/2), y: 64, frame:false,
    show:false, resizable: true, minWidth:720, minHeight:520, backgroundColor:'#101216',
    webPreferences:{ preload:path.join(__dirname,'preload.cjs'), contextIsolation:true, nodeIntegration:false, sandbox:true }
  });
  panel.loadFile(path.join(__dirname,'index.html'));
  panel.on('close', e => { if (!quitting) { e.preventDefault(); panel.hide(); } });
  panel.on('closed', () => {panel = null;});
}
function togglePanel() { if (!panel) return; if (panel.isVisible()) panel.hide(); else {panel.show(); panel.focus();} }
function makeTray() {
  const img = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABFUlEQVQ4T6WTsQ3CMAxFfwdgA1gCNgAJkAGyARtAEtgARqABG8AGbAA3gBFgA0yACWABctyJRCoFSiR09p3vz7L/ynhKpZz0L4BtZB+hXQLkYkUD4EsAJuAbmHAE4AzsAs8JMB0BnoAz4BlYBI6Aw0AGYNpAm8EzgDKTCw8FV+DUd/5rSLTsARwCLwFz7d0FgAO4A7wABgM7gzWD8AC5HgxWO8BZKBEWHSTIIyTwNaOBM0DuD7ajux5QKZ0SKEfPPOMPUJtZNgsBzsCg9Z5tnwB4EYQMGYuVm4HuDKnR4RxhKLQeOziYvgektQDPtFWMxltH+9qfq+glb/WdMMrQAtgUPEmkWcLP6OCvIi1ItCa1OxMi1z8I/KFHJqmiBH3YNOoAAAAASUVORK5CYII=');
  tray = new Tray(img);
  tray.setToolTip('orbi');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label:'Abrir orbi', click: () => {panel.show();panel.focus();} },
    {label:'Verificar atualizações',click: checkUpdates},
    {type:'separator'}, {label:'Sair', click: () => {quitting = true; app.quit();}}
  ]));
  tray.on('double-click', togglePanel);
}
const allowedApps = { bloco:'notepad.exe', notas:'notepad.exe', calculadora:'calc.exe', explorer:'explorer.exe', arquivos:'explorer.exe', paint:'mspaint.exe' };
function command(input) {
  const q = String(input||'').trim(); const s = q.toLowerCase();
  if (!q || q.length > 500) return {message:'Digite um comando curto para começar.'};
  if (/^(abrir|abre)\s+/.test(s)) {
    const match = Object.keys(allowedApps).find(k => s.includes(k));
    if (match && process.platform === 'win32') {execFile(allowedApps[match], [], {windowsHide:false}, () => {});return {message:`Abrindo ${match}.`};}
    return {message:'Posso abrir Bloco de Notas, Calculadora, Explorer e Paint no Windows.'};
  }
  if (/^(criar tarefa|adicionar tarefa|tarefa)\b/.test(s)) {
    const title = q.replace(/^(criar tarefa|adicionar tarefa|tarefa)\s*:?\s*/i,'').trim();
    if (!title) return {message:'Qual é o nome da tarefa?'};
    db.tasks.unshift({id:crypto.randomUUID(),title:title.slice(0,200),done:false,created:Date.now()});save();
    return {message:`Tarefa criada: ${title}`};
  }
  if (/^(anotar|nota|anota)\b/.test(s)) {
    const content=q.replace(/^(anotar|nota|anota)\s*:?\s*/i,'').trim();
    if (!content) return {message:'O que deseja anotar?'};
    db.notes.unshift({id:crypto.randomUUID(),content:content.slice(0,2000),created:Date.now()});save();
    return {message:'Anotação salva no computador.'};
  }
  if (/^(como está|status|uso do)\b/.test(s)) return {message:`Memória livre: ${Math.round(os.freemem()/1024/1024/1024)} GB. Processadores lógicos: ${os.cpus().length}.`};
  if (/^(que horas|hora atual)\b/.test(s)) return {message:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})};
  return {message:'Ainda não tenho uma IA conectada. Nesta versão consigo criar tarefas, anotar, mostrar status e abrir apps básicos. Em Configurações você encontra a versão e atualizações.'};
}
function checkReminders() {
  const now=Date.now(); let changed=false;
  for (const r of db.reminders) {
    if (!r.fired && r.at <= now) {
      r.fired=true; changed=true;
      if (Notification.isSupported()) new Notification({title:'orbi · lembrete',body:r.title}).show();
      broadcast('reminder:fired',r);
    }
  }
  if(changed) save();
}
function sendUpdate(state, extra = {}) {broadcast('update:status',{state,...extra});}
function checkUpdates() {
  if (!app.isPackaged) return sendUpdate('development',{message:'Atualizações só podem ser verificadas na versão instalada.'});
  sendUpdate('checking');
  autoUpdater.checkForUpdates().catch(e=>sendUpdate('error',{message:e.message}));
}
function installUpdate() {autoUpdater.quitAndInstall(false,true);}
app.whenReady().then(() => {
  load();
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('checking-for-update',()=>sendUpdate('checking'));
  autoUpdater.on('update-available', info=>sendUpdate('available',{version:info.version}));
  autoUpdater.on('update-not-available',()=>sendUpdate('latest',{version:app.getVersion()}));
  autoUpdater.on('download-progress', p=>sendUpdate('downloading',{percent:Math.round(p.percent)}));
  autoUpdater.on('update-downloaded',info=>sendUpdate('downloaded',{version:info.version}));
  autoUpdater.on('error',e=>sendUpdate('error',{message:e.message}));
  ipcMain.handle('get:state',()=>({db, version:app.getVersion(), packaged:app.isPackaged}));
  ipcMain.handle('get:system',()=>({free:os.freemem(),total:os.totalmem(),cpus:os.cpus().length,platform:process.platform}));
  ipcMain.handle('task:add',(_,title)=>{if(typeof title!=='string'||!title.trim()||title.length>200)return false;db.tasks.unshift({id:crypto.randomUUID(),title:title.trim(),done:false,created:Date.now()});save();return true;});
  ipcMain.handle('task:toggle',(_,id)=>{const t=db.tasks.find(t=>t.id===id);if(t){t.done=!t.done;save();}return !!t;});
  ipcMain.handle('task:remove',(_,id)=>{db.tasks=db.tasks.filter(t=>t.id!==id);save();return true;});
  ipcMain.handle('note:add',(_,value)=>{if(typeof value!=='string'||!value.trim()||value.length>2000)return false;db.notes.unshift({id:crypto.randomUUID(),content:value.trim(),created:Date.now()});save();return true;});
  ipcMain.handle('note:remove',(_,id)=>{db.notes=db.notes.filter(n=>n.id!==id);save();return true;});
  ipcMain.handle('reminder:add',(_,rem)=>{const time=Date.parse(rem?.at);if(typeof rem?.title!=='string'||!rem.title.trim()||rem.title.length>200||!Number.isFinite(time)||time<Date.now())return false;db.reminders.push({id:crypto.randomUUID(),title:rem.title.trim(),at:time,fired:false});save();return true;});
  ipcMain.handle('settings:update',(_,data)=>{if(data?.accent&&['lime','blue','mono'].includes(data.accent)){db.settings.accent=data.accent;save();}return db.settings;});
  ipcMain.handle('command:run',(_,q)=>command(q));
  ipcMain.handle('window:toggle',togglePanel);
  ipcMain.handle('window:hide',()=>panel?.hide());
  ipcMain.handle('window:minimize',()=>panel?.minimize());
  ipcMain.handle('update:check',checkUpdates);
  ipcMain.handle('update:download',()=>autoUpdater.downloadUpdate().catch(e=>sendUpdate('error',{message:e.message})));
  ipcMain.handle('update:install',installUpdate);
  ipcMain.handle('open:release',()=>{const feed=app.isPackaged ? app.getAppPath() : '';return !!feed;});
  makeDock(); makePanel(); makeTray();
  setInterval(checkReminders,10000);checkReminders();
  if(app.isPackaged) setTimeout(checkUpdates,8000);
});
app.on('window-all-closed',()=>{});
app.on('before-quit',()=>{quitting=true;});
app.on('activate',()=>{if(panel){panel.show();panel.focus();}});

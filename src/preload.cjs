const { contextBridge, ipcRenderer } = require('electron');
const channels = new Set(['data:changed', 'reminder:fired', 'update:status']);
contextBridge.exposeInMainWorld('orbi', Object.freeze({
  getState:()=>ipcRenderer.invoke('get:state'), getSystem:()=>ipcRenderer.invoke('get:system'),
  addTask:title=>ipcRenderer.invoke('task:add',title), toggleTask:id=>ipcRenderer.invoke('task:toggle',id), removeTask:id=>ipcRenderer.invoke('task:remove',id),
  addNote:value=>ipcRenderer.invoke('note:add',value), removeNote:id=>ipcRenderer.invoke('note:remove',id),
  addReminder:rem=>ipcRenderer.invoke('reminder:add',rem), updateSettings:data=>ipcRenderer.invoke('settings:update',data),
  command:q=>ipcRenderer.invoke('command:run',q), toggle:()=>ipcRenderer.invoke('window:toggle'), hide:()=>ipcRenderer.invoke('window:hide'), minimize:()=>ipcRenderer.invoke('window:minimize'),
  checkUpdate:()=>ipcRenderer.invoke('update:check'),downloadUpdate:()=>ipcRenderer.invoke('update:download'),installUpdate:()=>ipcRenderer.invoke('update:install'),
  on:(channel,cb)=>{if(!channels.has(channel)||typeof cb!=='function')return ()=>{};const fn=(_event,data)=>cb(data);ipcRenderer.on(channel,fn);return ()=>ipcRenderer.removeListener(channel,fn);}
}));

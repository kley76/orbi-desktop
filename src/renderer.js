let db = {tasks:[], notes:[], reminders:[], settings:{accent:'lime'}};
let remaining = 25*60, ticking = false, timerHandle=null;
const $ = sel=>document.querySelector(sel);
const all=sel=>Array.from(document.querySelectorAll(sel));
const el=(tag, cls, content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;};
const fmt=ms=>new Date(ms).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
function page(name){all('.page').forEach(e=>e.classList.toggle('active',e.id===name));all('.nav').forEach(e=>e.classList.toggle('active',e.dataset.page===name));}
function empty(target,text){target.replaceChildren(el('p','empty',text));}
function render(){
 document.body.dataset.accent=db.settings?.accent||'lime';
 all('.theme').forEach(e=>e.classList.toggle('selected',e.dataset.accent===document.body.dataset.accent));
 const tasks=$('#tasks-list');tasks.replaceChildren();
 if(!db.tasks.length)empty(tasks,'Nenhuma tarefa ainda. Adicione sua primeira tarefa acima.');
 for(const task of db.tasks){let item=el('div','item'),check=el('input');check.type='checkbox';check.checked=!!task.done;check.onchange=()=>window.orbi.toggleTask(task.id);let title=el('span',task.done?'done-text':'',task.title),rm=el('button',null,'Excluir');rm.onclick=()=>window.orbi.removeTask(task.id);item.append(check,title,rm);tasks.append(item);}
 const finished=db.tasks.filter(t=>t.done).length;$('#task-count').textContent=`${finished} / ${db.tasks.length}`;
 const mini=$('#sidebar-tasks');mini.replaceChildren();if(!db.tasks.length)empty(mini,'Sem tarefas por enquanto.');
 db.tasks.slice(0,5).forEach(t=>{const item=el('div','widget-task');item.append(el('span','check'+(t.done?' done':'')),el('span',t.done?'done-text':'',t.title));mini.append(item);});
 const notes=$('#notes-list');notes.replaceChildren();if(!db.notes.length)empty(notes,'Suas notas aparecerão aqui.');
 db.notes.forEach(n=>{const card=el('div','note'),p=el('p',null,n.content),foot=el('footer'),dt=el('span',null,fmt(n.created)),rm=el('button',null,'Excluir');rm.onclick=()=>window.orbi.removeNote(n.id);foot.append(dt,rm);card.append(p,foot);notes.append(card);});
 const quickNotes=$('#sidebar-notes');quickNotes.replaceChildren();if(!db.notes.length)empty(quickNotes,'Sem notas salvas.');
 db.notes.slice(0,3).forEach(n=>quickNotes.append(el('div',null,'• '+n.content.slice(0,85))));
 const reminders=$('#reminders-list');reminders.replaceChildren();const sorted=[...db.reminders].sort((a,b)=>a.at-b.at);
 if(!sorted.length)empty(reminders,'Nenhum lembrete agendado.');
 sorted.forEach(r=>{const item=el('div','item'),title=el('span',r.fired?'done-text':'',r.title),date=el('small','muted',fmt(r.at)+(r.fired?' · avisado':''));item.append(title,date);reminders.append(item);});
 const soon=$('#sidebar-reminders');soon.replaceChildren();const active=sorted.filter(r=>!r.fired).slice(0,3);if(!active.length)empty(soon,'Nenhum lembrete próximo.');
 active.forEach(r=>soon.append(el('div',null,'• '+fmt(r.at)+' · '+r.title)));
}
function showMessage(message){let node=$('#response');node.hidden=false;node.textContent=message;}
function showTime(){let m=String(Math.floor(remaining/60)).padStart(2,'0'),s=String(remaining%60).padStart(2,'0');$('#timer').textContent=m+':'+s;}
function toggleTimer(){ticking=!ticking;$('#timer-toggle').textContent=ticking?'Pausar':'Iniciar';if(timerHandle)clearInterval(timerHandle);if(ticking)timerHandle=setInterval(()=>{remaining=Math.max(0,remaining-1);showTime();if(remaining===0){toggleTimer();showMessage('Sua sessão de foco terminou. Ótimo trabalho!');}},1000);}
async function refreshSystem(){try{const d=await window.orbi.getSystem();const pct=Math.round(100*(1-d.free/d.total));$('#memory').textContent=pct+'%';$('#memorybar').style.width=pct+'%';}catch{}}
function updateStatus(data){let info=$('#update-info'),check=$('#update-check'),download=$('#update-download'),install=$('#update-install');download.hidden=true;install.hidden=true;check.disabled=false;
 switch(data.state){case 'checking':info.textContent='Procurando atualização...';check.disabled=true;break;case 'latest':info.textContent=`Você está na versão mais recente (${data.version}).`;break;case 'available':info.textContent=`Nova versão ${data.version} disponível.`;download.hidden=false;break;case 'downloading':info.textContent=`Baixando atualização: ${data.percent}%`;check.disabled=true;break;case 'downloaded':info.textContent=`Versão ${data.version} pronta para instalar.`;install.hidden=false;break;case 'development':info.textContent=data.message;break;case 'error':info.textContent='Erro ao verificar: '+data.message;break;}}
async function boot(){let state=await window.orbi.getState();db=state.db;$('#version').textContent='v'+state.version;$('#settings-version').textContent=state.version;$('#today').textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});render();refreshSystem();setInterval(refreshSystem,15000);
 window.orbi.on('data:changed',next=>{db=next;render();});window.orbi.on('update:status',updateStatus);window.orbi.on('reminder:fired',r=>showMessage('Lembrete: '+r.title));
 all('[data-page]').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
 all('[data-command]').forEach(b=>b.addEventListener('click',async()=>showMessage((await window.orbi.command(b.dataset.command)).message)));
 $('#close').onclick=()=>window.orbi.hide();$('#min').onclick=()=>window.orbi.minimize();
 $('#command-form').onsubmit=async e=>{e.preventDefault();const q=$('#command').value.trim();if(!q)return;showMessage((await window.orbi.command(q)).message);$('#command').value='';};
 $('#task-form').onsubmit=async e=>{e.preventDefault();if(await window.orbi.addTask($('#task-input').value))$('#task-input').value='';};
 $('#note-form').onsubmit=async e=>{e.preventDefault();if(await window.orbi.addNote($('#note-input').value))$('#note-input').value='';};
 $('#reminder-form').onsubmit=async e=>{e.preventDefault();const ok=await window.orbi.addReminder({title:$('#reminder-input').value,at:$('#reminder-date').value});if(ok){$('#reminder-input').value='';$('#reminder-date').value='';}else alert('Selecione uma data futura válida.');};
 $('#newTaskQuick').onclick=()=>{page('tasks');$('#task-input').focus();};$('#newNoteQuick').onclick=()=>{page('notes');$('#note-input').focus();};
 $('#timer-toggle').onclick=toggleTimer;$('#timer-reset').onclick=()=>{if(ticking)toggleTimer();remaining=1500;showTime();};
 all('.theme').forEach(b=>b.onclick=()=>window.orbi.updateSettings({accent:b.dataset.accent}));
 $('#update-check').onclick=()=>window.orbi.checkUpdate();$('#update-download').onclick=()=>window.orbi.downloadUpdate();$('#update-install').onclick=()=>window.orbi.installUpdate();
}
boot().catch(err=>{console.error(err);showMessage('Não foi possível carregar os dados.');});

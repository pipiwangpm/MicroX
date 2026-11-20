let simFloatingPanel=new URLSearchParams(location.search).get('panel')||'controls';
const flowPanels={controls:'控制',plays:'玩法',devices:'设备',logs:'日志'};
function setSimFloatingPanel(name){
 if(simulatorRemote&&name!=='controls')simulatorRemote.releaseAll();
 simFloatingPanel=name;
 document.querySelectorAll('[data-flow-panel]').forEach(panel=>{panel.hidden=panel.dataset.flowPanel!==name});
 document.querySelectorAll('[data-flow-open]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.flowOpen===name)));
}
function applyControlFlow(){
 if(!isSimMode()){
  const sidebar=document.querySelector('.control-sidebar');
  sidebar.querySelector('.brand').href='workbench.html';
  sidebar.querySelector('.control-side-bottom').innerHTML='<a class="textlink" href="start.html">返回调试方式</a>';
  document.querySelector('.control-title a[href*="expressions"]')?.remove();
  document.querySelector('.workspace-device-status [data-pc-connect]')?.remove();
  document.querySelector('.control-top-right').innerHTML=status(pc.connected,'设备在线','未连接');
  return;
 }
 document.body.classList.add('flow-simulator');
 document.querySelector('.control-sidebar').remove();
 const header=document.querySelector('.control-topbar');
 header.innerHTML=`<a class="flow-brand" href="start.html"><img src="../assets/company-logo-footer.png" alt="Raydiculous"></a><strong>模拟器</strong><nav aria-label="模拟器工具">${Object.entries(flowPanels).map(([key,label])=>`<button class="btn small" data-flow-open="${key}" aria-pressed="false">${label}</button>`).join('')}<button class="btn small flow-global-recover" data-dino-action="recover">恢复姿态</button><button class="btn small flow-global-stop" data-dino-action="stop">停止</button></nav><a class="textlink" href="start.html">返回调试方式</a>`;
 const host=document.querySelector('.control-content');
 const operation=host.querySelector('.workspace-operation');
 const preview=host.querySelector('.workspace-preview');
 operation.querySelector('.control-title')?.remove();
 const panels={};
 for(const [key,label] of Object.entries(flowPanels)){
  const panel=document.createElement('section');panel.className='flow-dialog';panel.dataset.flowPanel=key;panel.setAttribute('role','dialog');panel.setAttribute('aria-label',label);panel.innerHTML=`<header class="flow-dialog-header"><h2>${label}</h2><button class="btn small" data-flow-close aria-label="关闭${label}">关闭</button></header><div class="flow-dialog-body"></div>`;panels[key]=panel;
 }
 operation.querySelectorAll('.dino-remote,.keyboard-panel,.body-action-panel').forEach(node=>panels.controls.lastElementChild.append(node));
 operation.querySelectorAll('.play-simulator').forEach(node=>panels.plays.lastElementChild.append(node));
 const media=preview.querySelector('.local-media');if(media)panels.devices.lastElementChild.append(media);
 const logs=preview.querySelector('.logs-panel');if(logs)panels.logs.lastElementChild.append(logs);
 preview.querySelector('.workspace-preview-heading')?.remove();preview.querySelector('.workspace-device-status')?.remove();preview.querySelector('.workspace-audio')?.remove();
 if(simSession.running){const state=preview.querySelector('.workspace-execution');if(state)state.textContent=selectedApp.name+' · 运行中'}
 operation.remove();
 const floating=document.createElement('div');floating.className='flow-floats';for(const panel of Object.values(panels))floating.append(panel);host.append(floating);
 setSimFloatingPanel(Object.hasOwn(flowPanels,simFloatingPanel)?simFloatingPanel:'');
}
document.addEventListener('click',event=>{
 const open=event.target.closest('[data-flow-open]');
 if(open){const key=open.dataset.flowOpen;setSimFloatingPanel(simFloatingPanel===key?'':key)}
 if(event.target.closest('[data-flow-close]')){const previous=simFloatingPanel;setSimFloatingPanel('');document.querySelector(`[data-flow-open="${previous}"]`)?.focus()}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('flow-simulator'))setSimFloatingPanel('')});

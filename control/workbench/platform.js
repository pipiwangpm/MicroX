'use strict';
(() => {
 const host=window.ControlSession;
 const url=new URL(location.href),view=url.searchParams.get('view')||'control';
 if(!host.signedIn()){location.replace('start.html?next=workbench&view='+encodeURIComponent(view));document.getElementById('app').innerHTML='';return}
 const pcKey='microx-v2-control';
 s.uid='RAYDINO-001';engState().deviceName=readPc().deviceName||'我的 RayDino';
 function readPc(){try{return JSON.parse(localStorage.getItem(pcKey)||'{}')}catch{return {}}}
 function writePc(v){try{localStorage.setItem(pcKey,JSON.stringify(v))}catch{}}
 function syncHost(){const device=readPc();if(connected&&setupState().done){host.select('real');Object.assign(device,{connected:true,sleeping:false});device.logs??=[];device.installed??=[];device.running=null;writePc(device)}else if(host.mode()==='real'){host.disconnect();device.connected=false;writePc(device)}}
 if(host.mode()==='real'&&host.connected()){
  const device=readPc();if(device.running){device.running=null;writePc(device);log('进入测试标定，已停止运行玩法')}
  connected=true;stopped=false;wbMethod='wifi';s.uid='RAYDINO-001';s.connection={method:'wifi',network:'已连接网络'};
  const network=setupState();network.done=true;network.status='connected';network.ssid||='已连接网络';
  engState().deviceName=device.deviceName||'我的 RayDino';save();
 }
 if(!setupState().done){setupScreen='setup'}else setupScreen=view==='maintenance'?'maintenance':view==='connection'?'setup':'control';
 if(setupScreen==='maintenance')wbEngOpen=true;
 function title(){return {setup:'连接与配网',control:'测试标定',maintenance:'工程维护'}[setupScreen]}
 function navLink(label,href,active,ic){return `<a class="control-nav ${active?'active':''}" href="${href}">${icon(ic)}<span>${label}</span></a>`}
 function shell(){return `<aside class="pp-sidebar control-sidebar"><a class="brand" href="index.html"><img class="company-logo" src="../assets/company-logo-footer.png" alt="Raydiculous"></a><div class="control-word">RaydiculousX CONTROL</div><div class="control-nav-label">工作空间</div>${navLink('工作台','index.html',false,'robot')}${navLink('测试标定','workbench.html?view=control',setupScreen!=='maintenance','target')}${navLink('工程维护','workbench.html?view=maintenance',setupScreen==='maintenance','chip')}${navLink('玩法','apps.html',false,'grid')}<div class="pp-device"><strong>${esc(engState().deviceName)}</strong><span class="mono">${esc(s.uid)}</span>${pill(connected?'设备在线':'未连接',connected?'ok':'')}</div><div class="control-side-bottom"><a class="textlink" href="device.html">设备设置</a><a class="textlink" href="start.html?next=simulator">机器人仿真</a><a class="textlink" href="../website/index.html">官网与玩法广场</a><a class="textlink" href="../admin/index.html">管理后台</a></div></aside><header class="pp-topbar"><div class="control-breadcrumb"><span>实机工作台</span><span>/</span><strong>${title()}</strong></div><div class="row"><button data-do="export">导出记录</button><button data-pp-connect>管理连接</button><button data-do="new">下一台</button><button data-pp-logout>退出登录</button></div></header>`}
 const base=workbenchRender;
 workbenchRender=function(){syncHost();base();const root=$('#app');root.innerHTML=root.innerHTML.replace(/<header class="wb-header">[\s\S]*?<\/header>/,shell());document.title=title()+' · RaydiculousX';};
 const previousDisconnect=handlers.connect;
 handlers.connect=()=>{previousDisconnect();syncHost()};
 const previousRename=handlers.engSetName;
 handlers.engSetName=()=>{previousRename();const d=readPc();d.deviceName=engState().deviceName;writePc(d)};
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-pp-logout]')){finishCsv('退出登录');cancelJob('退出登录');connected=false;host.logout()}
  if(e.target.closest('[data-pp-connect]'))setupNavigate('setup');
 });
 window.addEventListener('pagehide',()=>{if(engState().body==='运动中')handlers.rcStop();finishCsv('离开调试页面')});
 window.addEventListener('pageshow',e=>{if(e.persisted){if(!host.signedIn())location.replace('start.html?next=workbench');else if(host.mode()!=='real'||!host.connected()){connected=false;setupScreen='setup';render()}}});
 render();
 if(connected&&!s.released)selfcheck();
})();

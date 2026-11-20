'use strict';
(() => {
 const host=window.ControlSession;
 const url=new URL(location.href),view=url.searchParams.get('view')||'control';
 if(!host.signedIn()){location.replace('start.html');document.getElementById('app').innerHTML='';return}
 const pcKey='microx-v2-control';
 if(url.searchParams.has('fresh')){host.disconnect();window.history.replaceState(null,'','workbench.html?view=connection')}
 if(!host.connected()){connected=false;setupState().done=false;setupState().status='idle';wbMethod='bluetooth'}
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
 if(!connected||!setupState().done){setupScreen='setup'}else setupScreen=view==='maintenance'?'maintenance':'control';
 if(setupScreen==='maintenance')wbEngOpen=true;
 function title(){return {setup:'连接与配网',control:'测试标定',maintenance:'工程维护'}[setupScreen]}
 function navLink(label,href,active,ic){return `<a class="control-nav ${active?'active':''}" href="${href}">${icon(ic)}<span>${label}</span></a>`}
 function shell(){const linked=connected&&setupState().done;return `${linked?`<aside class="pp-sidebar control-sidebar"><a class="brand" href="workbench.html"><img class="company-logo" src="../assets/company-logo-footer.png" alt="Raydiculous"></a><div class="control-word">RaydiculousX CONTROL</div><div class="control-nav-label">实机调试</div>${navLink('测试标定','workbench.html?view=control',setupScreen==='control','target')}${navLink('工程维护','workbench.html?view=maintenance',setupScreen==='maintenance','chip')}${navLink('玩法','apps.html',false,'grid')}<div class="pp-device"><strong>${esc(engState().deviceName)}</strong><span class="mono">${esc(s.uid)}</span>${pill('设备在线','ok')}</div><div class="control-side-bottom"><a class="textlink" href="start.html">返回调试方式</a></div></aside>`:''}<header class="pp-topbar">${!linked?'<a class="flow-brand" href="start.html"><img src="../assets/company-logo-footer.png" alt="Raydiculous"></a>':''}<div class="control-breadcrumb"><span>实机调试</span><span>/</span><strong>${title()}</strong></div>${!linked?'<a class="textlink" href="start.html">返回调试方式</a>':''}</header>`}

 const base=workbenchRender;
 workbenchRender=function(){syncHost();if(!connected||!setupState().done)setupScreen='setup';else if(setupScreen==='setup')setupScreen='control';base();const root=$('#app');root.innerHTML=root.innerHTML.replace(/<header class="wb-header">[\s\S]*?<\/header>/,shell());root.innerHTML=root.innerHTML.replace(/<nav class="setup-tabs"[\s\S]*?<\/nav>/,'');document.body.classList.toggle('flow-onboarding',setupScreen==='setup');document.title=title()+' · RaydiculousX';};
 const previousDisconnect=handlers.connect;
 handlers.connect=()=>{previousDisconnect();syncHost()};
 const previousRename=handlers.engSetName;
 handlers.engSetName=()=>{previousRename();const d=readPc();d.deviceName=engState().deviceName;writePc(d)};
 const deviceSettings=wbParams;
 wbParams=function(){return deviceSettings()+`<div class="flow-network-settings"><h3>网络</h3>${kv('Wi-Fi',setupState().ssid||'--')}${kv('机器人 IP',s.ip)}${wbBtn('重新配网','setupReset',!!busy)}</div>`};
 window.addEventListener('pagehide',()=>{if(engState().body==='运动中')handlers.rcStop();finishCsv('离开调试页面')});
 window.addEventListener('pageshow',e=>{if(e.persisted){if(!host.signedIn())location.replace('start.html');else if(host.mode()!=='real'||!host.connected()){connected=false;setupScreen='setup';render()}}});
 render();
 if(connected&&!s.released)selfcheck();
})();

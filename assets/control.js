const page = document.body.dataset.page;
const session = ControlSession;
const requestedPlay = ROBOT_PLAYS.find(play => play.id === params.get('app'));
const requestedSimulation = page === 'simulator' || (session.mode() === 'simulation' && page === 'play');
let redirect = '';
if (!session.signedIn()) {
  redirect = requestedSimulation ? 'start.html?next=simulator' + (requestedPlay ? '&app=' + requestedPlay.id : '') : 'start.html';
} else if (page === 'simulator') {
  session.select('simulation');
} else if (session.mode() === 'simulation' && page === 'play') {
  redirect = 'simulator.html' + (requestedPlay ? '?app=' + requestedPlay.id : '');
} else if (!session.mode() || (session.mode() === 'real' && !session.connected())) {
  redirect = 'start.html';
} else if (page === 'play' && !requestedPlay) {
  redirect = 'apps.html';
}
const isSimMode = () => session.mode() === 'simulation';
APPS.splice(0, APPS.length, ...ROBOT_PLAYS);
selectedApp = requestedPlay || APPS[0];
const PKEY = 'microx-v2-control';
const defaults = { connected: false, running: null, installed: [], logs: [], lastRun: null, sleeping: false, volume: 60, mic: true };
let pc = isSimMode() ? defaults : readStore(PKEY, defaults);
pc.connected = !isSimMode() && session.connected();
let pcBusy = false, pcPose = { yaw: 0, pitch: 0, speed: 50 };
pc.installed = pc.installed.filter(id => APPS.some(play => play.id === id));
if (!pc.installed.includes(pc.running)) pc.running = null;
function pSave(){if(!isSimMode())writeStore(PKEY,pc)}
function pLog(message,level='INFO'){pc.logs.unshift({time:new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}),message,level});pc.logs=pc.logs.slice(0,50);pSave();const e=document.getElementById('pc-logs');if(e)e.innerHTML=pLogs()}
function pLogs(){const list=pc.logs.length?pc.logs:[{time:'--:--:--',level:'INFO',message:isSimMode()?'仿真就绪。':'设备已就绪。'}];return list.slice(0,4).map(x=>`<div class="log-row"><span class="log-time">${x.time}</span><span class="log-level ${x.level==='WARN'?'warn':''}">${x.level}</span><span class="log-text">${esc(x.message.replace(/（模拟）|本地演示|模拟/g,'').replace('DEMO-001','RAYDINO-001'))}</span></div>`).join('')}
function pNav(key,label,glyph,badge=''){return `<a class="control-nav ${page===key||(key==='home'&&['expressions'].includes(page))||(key==='apps'&&page==='play')?'active':''}" href="${{home:'index',device:'device',apps:'apps',simulator:'simulator',expressions:'expressions',controller:'controller',play:'play'}[key]}.html">${icon(glyph)}<span>${label}</span>${badge?'<span class="tag">'+badge+'</span>':''}</a>`}
function pcRender(){if(typeof releaseKeyboard==='function')releaseKeyboard(!isPlaySimulation());document.getElementById('app').innerHTML=strip('电脑控制台')+`<div class="control-shell"><aside class="control-sidebar"><a class="brand" href="index.html"><img class="company-logo" src="../assets/company-logo-footer.png" alt="Raydiculous 成都人形机器人创新中心"></a><div class="control-word">RaydiculousX CONTROL</div><div class="control-nav-label">工作空间</div>${pNav('home','工作台','robot')}${pNav('controller','手动控制','gamepad')}${pNav('apps','玩法','apps')}${isSimMode()?pNav('simulator','机器人仿真','cube'):''}<div class="control-side-bottom"><a class="textlink" href="device.html">${icon('settings')}<span>${isSimMode()?'调试设备':'设备设置'}</span></a><span class="desktop-version">v0.1.0</span><div class="divider" style="background:#354332"></div><a class="textlink" href="../website/index.html" target="_blank"><span>浏览官网生态</span>${icon('external')}</a><a class="textlink" href="../admin/index.html">${icon('settings')}<span>管理后台</span></a></div></aside><main class="control-main"><header class="control-topbar"><div class="control-breadcrumb"><span>${isSimMode()?'仿真工作台':'实机工作台'}</span><span>/</span><strong>${{home:'机器人',device:isSimMode()?'调试设备':'设备设置',apps:'玩法',simulator:'机器人仿真',expressions:'动作轮盘',controller:'手动控制',play:selectedApp.name}[page]}</strong></div><div class="control-top-right"><a class="btn small" href="start.html"><span>切换调试方式</span></a><button type="button" class="btn small" data-web-logout><span>退出登录</span></button>${status(pc.connected,pc.sleeping?'休眠中':'设备在线','未连接')}</div></header><div class="control-content ${page==='home'?'desktop-home':''}">${({home:pcHome,device:pcDevice,apps:pcApps,simulator:renderPlaySimulator,expressions:pcWheel,controller:pcController,play:pcPlay}[page]||pcHome)()}</div></main></div>`;pcSplitWorkspace();if(page==='controller'&&!isSimMode())drawSimRobot();keyboardUi();document.querySelectorAll('.control-shell a[href]').forEach(a=>{const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname.includes('/control/')&&u.pathname.endsWith('.html')){u.searchParams.set('v','unified-1103b');a.href=u.href}});if(isSimMode()){document.querySelector('.workspace-preview-heading .linkrow')?.remove();document.querySelector('.control-top-right .status')?.remove();document.querySelector('.control-top-right')?.insertAdjacentHTML('beforeend',status(true,'仿真会话'));const d=document.querySelector('.workspace-device-status');if(d)d.innerHTML='<div><strong>虚拟 RayDino</strong>'+status(true,isPlaySimulation()?(simSession.running?'玩法运行中':'手动控制'):'仿真会话')+'</div><a class="btn small" href="start.html"><span>切换调试方式</span></a>';document.querySelector('.workspace-audio')?.remove();const side=document.querySelector('.control-side-device');if(side)side.innerHTML='<strong>虚拟 RayDino</strong>'+status(true,'仿真会话')+'<p>无需实体设备</p>'}}
function pTitle(title,sub,actions){return `<div class="control-title"><div><h1>${title}</h1></div><div class="linkrow">${actions||''}</div></div>`}
function pConnectButton(){return `<button class="btn ${pc.connected?'':'orange'}" data-pc-connect>${icon('connect')}<span>${pc.connected?'管理连接':'连接机器人'}</span></button>`}
function pViewport(sim=false){return `<div class="viewport"><div class="floor-grid"></div><div class="viewport-label"><b>${sim?'SIMULATION':'DEVICE VIEW'}</b><span> / RayDino</span></div><div class="view-toolbar"><button data-view="default" aria-label="恢复视图">${icon('refresh')}</button><button data-view="mirror" aria-label="切换视角">${icon('eye')}</button></div><div data-active-robot>${robot()}</div><div class="view-axes"><span class="axis x">X</span><span class="axis y">Y</span><span class="axis z">Z</span></div><div class="viewport-status"><span>${sim?'SIMULATION':'DEVICE'}</span><span>•</span><span id="viewport-state">${sim?'READY':pc.connected?'CONNECTED':'OFFLINE'}</span></div>${!sim&&!pc.connected?'<div class="connection-callout"><span>连接设备以开始控制</span><button class="btn small orange" data-pc-connect><span>连接设备</span></button></div>':''}</div>`}
function pPose(){return `<div class="control-pose"><h3>头部姿态</h3>${[['yaw','左右转动','−30°','30°',-30,30,'°'],['pitch','上下俯仰','−15°','15°',-15,15,'°'],['speed','动作速度','慢','快',10,100,'%']].map(([id,label,minLabel,maxLabel,min,max,unit])=>`<div class="slider-group"><div class="slider-label"><label for="pose-${id}">${label}</label><output id="out-${id}">${pcPose[id]}${unit}</output></div><input type="range" id="pose-${id}" data-pose="${id}" min="${min}" max="${max}" value="${pcPose[id]}" ${(!pc.connected&&!isSimMode())||pc.sleeping||pc.running?'disabled':''}><div class="slider-extents"><span>${minLabel}</span><span>${maxLabel}</span></div></div>`).join('')}<div class="pose-actions"><button class="btn small" data-pose-reset ${(!pc.connected&&!isSimMode())||pc.sleeping||pc.running?'disabled':''}><span>归零</span></button><button class="btn small orange" data-pose-apply ${(!pc.connected&&!isSimMode())||pc.sleeping||pc.running?'disabled':''}><span>应用姿态</span></button></div></div>`}
function pLogsPanel(){return `<section class="control-panel logs-panel"><header class="cp-head"><h2>事件日志</h2><div class="linkrow"><span>LOCAL SESSION</span><button class="textlink" data-log-clear style="font-size:10px"><span>清空</span></button><button class="textlink" data-log-export style="font-size:10px"><span>导出</span>${icon('download')}</button></div></header><div class="log-console" id="pc-logs">${pLogs()}</div></section>`}
function pcDevice(){if(isSimMode())return pTitle('调试设备')+controlMedia.panel();return pTitle('设备设置','',pConnectButton())+`<div class="settings-grid"><section class="control-panel"><header class="cp-head"><h2>我的设备</h2></header><div class="desktop-device-info"><img src="../assets/robot-x3-green.png" alt="RayDino"><div><h2>我的 RayDino</h2>${status(pc.connected,pc.sleeping?'休眠中':'已就绪','未连接')}<p>RAYDINO-001</p></div></div><div class="capabilities"><div class="cap-row"><span>正在运行</span><strong>${pc.running?appById(pc.running).name:pcTalk?'语音对话':'无'}</strong></div></div><div class="device-settings-actions">${pc.connected?`<button class="btn" data-pc-power>${icon('power')}<span>${pc.sleeping?'唤醒机器人':'休眠机器人'}</span></button>`:''}<button class="btn danger" data-pc-stop>${icon('stop')}<span>停止全部动作</span></button></div></section><section class="control-panel"><header class="cp-head"><h2>声音设置</h2></header><div class="desktop-sound"><label for="desktop-volume">扬声器音量 <output id="desktop-volume-value">${pc.volume}%</output></label><input id="desktop-volume" type="range" min="0" max="100" value="${pc.volume}" ${!pc.connected?'disabled':''}><div class="desktop-mic-row"><span>麦克风</span><button class="btn small" data-desktop-mic role="switch" aria-label="麦克风" aria-checked="${pc.mic}" ${!pc.connected?'disabled':''}>${icon('mic')}<span>${pc.mic?'已开启':'已关闭'}</span></button></div></div></section></div>`}

function pcApps() {
  const list = APPS.filter(play =>
    (isSimMode() || pcScope !== 'mine' || pc.installed.includes(play.id)) &&
    (play.name + play.desc).includes(pcSearch));
  return pTitle('玩法', '', '<a class="btn" href="expressions.html"><span>打开动作轮盘</span></a>') + `
    <div class="desktop-play-filter">
      ${isSimMode()?'':`<div class="desktop-play-scopes">
        <button class="${pcScope==='all'?'active':''}" data-pc-scope="all"><span>发现玩法</span></button>
        <button class="${pcScope==='mine'?'active':''}" data-pc-scope="mine"><span>已安装到 RayDino</span><span>${pc.installed.length}</span></button>
      </div>`}
      <label class="desktop-search">${icon('search')}<input id="desktop-app-search" aria-label="搜索玩法" placeholder="搜索玩法" value="${esc(pcSearch)}"></label>
    </div>
    <div class="control-app-grid">${list.map(pcPlayCard).join('') || '<div class="desktop-empty">没有找到匹配的玩法</div>'}</div>`;
}

function pcPlayCard(play) {
  const installed = pc.installed.includes(play.id);
  const running = pc.running === play.id;
  return `<article class="control-app">${cover(play)}<div class="control-app-info">
    <h3>${play.name}</h3>
    <div class="web-author"><span>${play.category}</span><span class="tag">官方</span><span>v${play.version}</span></div>
    <p>${play.desc}</p>
    <div class="desktop-play-targets">
      ${isSimMode() ? `<div class="desktop-play-target"><a class="btn small orange" href="simulator.html?app=${play.id}">${icon('cube')}<span>运行仿真</span></a></div>` :
        `<div class="desktop-play-target"><div><strong>实体 RayDino</strong><span>${running?'运行中':installed?'已安装':'未安装'}</span></div>
          <button class="btn small ${installed?'':'orange'}" ${installed?'data-pc-start':'data-pc-add'}="${play.id}"><span>${running?'打开玩法':installed?'在 RayDino 上启动':'安装到 RayDino'}</span></button>
        </div>`}
    </div></div></article>`;
}


function pConnection() {
  if (isSimMode()) return;
  if (!pc.connected) {
    location.href = 'start.html';
    return;
  }
  connectionDialog(true, connected => {
    if (connected) return;
    stopAnimation();
    session.disconnect();
    pc.connected = false;
    pc.running = null;
    pSave();
    location.href = 'start.html';
  });
}
function pInstall(id) {
  if (isSimMode()) return;
  if (!pc.connected) return pConnection();
  installRobotPlay(id, appById(id).name, () => {
    pc = readStore(PKEY, pc);
    pcRender();
  }, PKEY);
}
function ensureStart(id,next){if(isSimMode())return;if(!pc.installed.includes(id)){pInstall(id);return}if(!pc.connected){pConnection(()=>ensureStart(id,next));return}const launch=()=>{pcTalk=false;pc.sleeping=false;pc.running=id;pSave();pLog('应用 '+appById(id).name+' 已获得控制权。');pcRender();next?.()};if(pc.running&&pc.running!==id){confirmDialog('切换运行的小程序？','「'+appById(pc.running).name+'」正在运行，启动「'+appById(id).name+'」前将先停止它。','停止并切换',launch)}else launch()}
function pStop(all=true){cancelBodyAction();pcTalk=false;pcWheelState='已停止';deskDriveStop();stopAnimation();pcBusy=false;pc.lastRun='已停止';if(all)pc.running=null;pSave();pLog('已停止'+(all?'全部动作，并释放应用控制权。':'当前动作。'),'WARN');pcRender();toast('动作已停止')}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-pc-connect'))pConnection();if(b.dataset.pcStart){const id=b.dataset.pcStart;ensureStart(id,()=>{location.href='play.html?app='+id})}if(b.dataset.pcAdd)pInstall(b.dataset.pcAdd);if(b.hasAttribute('data-stop-app'))pStop();if(b.hasAttribute('data-pc-stop'))pStop();if(b.dataset.pcMotion){if(!pc.connected||pc.running||pcBusy)return;pcBusy=true;const m=b.dataset.pcMotion;pLog('手动动作 '+m+'：RUNNING');document.getElementById('pc-action-state').textContent=m+' · 执行中';animate(m,()=>{pcBusy=false;pLog('手动动作 '+m+'：COMPLETED');document.getElementById('pc-action-state').textContent=m+' · 已完成'})}if(b.hasAttribute('data-pose-reset')){pcPose={yaw:0,pitch:0,speed:50};pcRender()}if(b.hasAttribute('data-pose-apply')){pLog('姿态配置已应用：yaw='+pcPose.yaw+'°, pitch='+pcPose.pitch+'°, speed='+pcPose.speed+'%');const v=document.querySelector('.viewport .robot-visual');if(v){v.style.rotate=pcPose.pitch/2+'deg';v.style.transform='translateX(-50%) perspective(700px) rotateY('+pcPose.yaw+'deg)'}toast('姿态已应用')}if(b.hasAttribute('data-log-clear')){pc.logs=[];pSave();document.getElementById('pc-logs').innerHTML=pLogs()}if(b.hasAttribute('data-log-export')){const blob=new Blob([pc.logs.map(x=>`${x.time} ${x.level} ${x.message}`).join('\n')],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='RaydiculousX_调试日志.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('日志已导出')}if(b.dataset.view){const img=document.querySelector('.viewport .robot-img');if(img)img.style.scale=b.dataset.view==='mirror'?'-1 1':'1';toast(b.dataset.view==='mirror'?'视角已切换':'已恢复默认视图')}if(b.hasAttribute('data-pc-reset'))confirmDialog('重置设置？','恢复默认设置并清空日志。','重置',()=>{localStorage.removeItem(PKEY);location.href='index.html'})});
document.addEventListener('input',e=>{const id=e.target.dataset.pose;if(id){pcPose[id]=Number(e.target.value);document.getElementById('out-'+id).textContent=pcPose[id]+(id==='speed'?'%':'°')}});

Object.assign(ICONS,{power:'\uf011',volume:'\uf028',mic:'\uf130',gamepad:'\uf11b',smile:'\uf118',wheel:'\uf1cd',moon:'\uf186',music:'\uf001',up:'\uf062',down:'\uf063',left:'\uf060',right:'\uf061'});
let pcTalk=false,pcScope='all',pcSearch='',pcWheelSelected=0,pcWheelState='点击播放',deskDriveButton=null,deskDriveTimer=null;
const pcWheelActions=[['开心','smile','招呼'],['好奇','eye','摇头'],['打招呼','hand','招呼'],['摇头','rotate','摇头'],['困倦','moon','点头'],['点头','head','点头'],['左右摇摆','music','摇头'],['开心律动','gamepad','招呼']];
function pcHome(){if(isSimMode())return pTitle('仿真工作台')+`<div class="split-shortcuts">
  <a href="controller.html"><span>${icon('gamepad')}</span><strong>手动控制</strong><span>打开</span></a>
  <a href="apps.html"><span>${icon('apps')}</span><strong>玩法仿真</strong><span>打开</span></a>
  <a href="device.html"><span>${icon('settings')}</span><strong>调试设备</strong><span>打开</span></a>
  </div>`;return `<div class="split-home-title"><div><span>RaydiculousX CONTROL</span><h1>我的玩法 <small>${pc.installed.length}</small></h1></div><a class="btn small" href="apps.html">${icon('plus')}<span>发现玩法</span></a></div><section class="split-app-list">${APPS.filter(a=>pc.installed.includes(a.id)).map(a=>`<article><span class="split-app-symbol cover-${a.color}">${icon(a.icon)}</span><div><h2>${a.name}</h2><span>Raydiculous · 官方玩法</span></div><button class="btn small orange" data-pc-start="${a.id}"><span>${pc.running===a.id?'打开':'启动'}</span>${icon('play')}</button></article>`).join('')||'<a class="btn" href="apps.html"><span>添加第一个玩法</span></a>'}</section><section class="split-conversation" aria-label="对讲"><div><h2>和 RayDino 聊聊</h2><strong id="desktop-talk-state">${pcTalk?'正在聆听':'点击开始对话'}</strong><p id="desktop-talk-hint">${pcTalk?'再次点击结束':'说说今天的新鲜事'}</p></div><div class="desktop-talk-orbit ${pcTalk?'listening':''}" id="desktop-talk-orbit"><button class="desktop-talk-button" data-pc-talk aria-label="${pcTalk?'结束对话':'开始对话'}" aria-pressed="${pcTalk}">${icon('mic')}</button></div></section><div class="split-section-heading"><h2>快捷控制</h2></div><div class="split-shortcuts"><a href="expressions.html"><span>${icon('wheel')}</span><strong>动作轮盘</strong><span>打开 ${icon('external')}</span></a><a href="controller.html"><span>${icon('gamepad')}</span><strong>手动控制</strong><span>打开 ${icon('external')}</span></a></div>`}
function pcSplitWorkspace(){const host=document.querySelector('.control-content');host.classList.add('workspace-split');const left=document.createElement('section');left.className='workspace-operation';while(host.firstChild)left.appendChild(host.firstChild);let currentState=left.querySelector('#desktop-play-status')?.textContent||left.querySelector('#desktop-drive-state')?.textContent||'';left.querySelectorAll('.logs-panel,.desktop-wheel-side').forEach(x=>x.remove());if(page==='controller')left.querySelector('.desktop-controller-grid>section:first-child')?.remove();if(page==='play')left.querySelector('.desktop-play-layout>section:first-child')?.remove();left.querySelectorAll('[data-active-robot]').forEach(x=>x.remove());host.appendChild(left);const right=document.createElement('aside');right.className='workspace-preview';right.innerHTML=`<header class="workspace-preview-heading"><div><span>RayDino</span><h2>${isSimMode()?'仿真视图':page==='controller'?'设备状态':'机器人视图'}</h2></div><div class="linkrow"><a class="btn small" href="device.html" aria-label="设备设置">${icon('settings')}</a><button class="btn small" data-pc-power aria-label="${pc.sleeping?'唤醒机器人':'休眠机器人'}" ${!pc.connected?'disabled':''}>${icon('power')}</button></div></header>${page==='controller'&&!isSimMode()?'':pViewport(isSimMode())}<div class="workspace-device-status"><div><strong>我的 RayDino</strong>${status(pc.connected,pc.sleeping?'休眠中':'已就绪','未连接')}</div>${pConnectButton()}</div>${page==='play'?'<div class="workspace-execution" id="desktop-play-status">'+esc(currentState)+'</div>':(page==='controller'||isPlaySimulation())?'<div class="workspace-execution" id="desktop-drive-state" role="status">'+esc(currentState||'已停止')+'</div>':''}<div class="workspace-audio" ${page!=='device'?'hidden':''}><div><label for="desktop-volume">${icon('volume')}<span>扬声器</span></label><output id="desktop-volume-value">${pc.volume}%</output><input id="desktop-volume" aria-label="扬声器音量" type="range" min="0" max="100" value="${pc.volume}" ${!pc.connected?'disabled':''}></div><div><span>麦克风</span><button class="btn small" data-desktop-mic role="switch" aria-label="麦克风" aria-checked="${pc.mic}" ${!pc.connected?'disabled':''}>${icon('mic')}<span>${pc.mic?'已开启':'已关闭'}</span></button></div></div>${isPlaySimulation()?simLogsPanel():pLogsPanel()}`;if(page==='device'){left.querySelector('.desktop-sound')?.closest('.control-panel')?.remove()}if(isSimMode()&&page==='simulator')right.insertAdjacentHTML('beforeend',controlMedia.panel());host.appendChild(right);controlMedia.mount();drawPlaySimulation()}
function desktopReady(next){if(isSimMode()){next();return}if(!pc.connected){pConnection(()=>desktopReady(next));return}if(pc.sleeping){pc.sleeping=false;pSave();pcRender()}if(pc.running){confirmDialog('切换互动方式？','将停止「'+appById(pc.running).name+'」。','停止并切换',()=>{stopAnimation();pcBusy=false;pc.running=null;pSave();pcRender();next()});return}next()}
function pcSetTalk(on){pcTalk=on;pc.mic=on;pSave();document.getElementById('desktop-talk-orbit')?.classList.toggle('listening',on);const b=document.querySelector('[data-pc-talk]');if(b){b.setAttribute('aria-label',on?'结束对话':'开始对话');b.setAttribute('aria-pressed',String(on))}const s=document.getElementById('desktop-talk-state');if(s)s.textContent=on?'正在聆听':'对话已结束';const h=document.getElementById('desktop-talk-hint');if(h)h.textContent=on?'再次点击结束':'点击麦克风，再聊一会儿'}
function pcWheel(){return pTitle('动作轮盘','',`<a class="btn" href="index.html">${icon('back')}<span>返回机器人</span></a><button class="btn danger" data-pc-stop>${icon('stop')}<span>停止动作</span></button>`)+`<div class="desktop-wheel-layout"><div class="desktop-wheel-stage"><div class="desktop-wheel" role="group" aria-label="动作轮盘">${pcWheelActions.map(([name,glyph],i)=>{const start=i*45-112.5,end=start+45,pts=['50% 50%'];for(let a=start;a<=end;a+=2.5)pts.push((50+50*Math.cos(a*Math.PI/180))+'% '+(50+50*Math.sin(a*Math.PI/180))+'%');const mid=(start+end)/2;return `<button class="desktop-wheel-sector ${pcWheelSelected===i?'selected':''}" style="clip-path:polygon(${pts.join(',')})" data-pc-wheel="${i}" aria-label="${name}" aria-pressed="${pcWheelSelected===i}"><span class="desktop-wheel-label" style="left:${50+36*Math.cos(mid*Math.PI/180)}%;top:${50+36*Math.sin(mid*Math.PI/180)}%">${icon(glyph)}<span>${name}</span></span></button>`}).join('')}<button class="desktop-wheel-center ${pcBusy?'executing':''}" data-pc-wheel-center aria-label="${pcBusy?'停止动作':'播放所选动作'}">${icon(pcWheelActions[pcWheelSelected][1])}<strong>${pcWheelActions[pcWheelSelected][0]}</strong><span id="desktop-wheel-state">${pcWheelState}</span></button></div></div><aside class="desktop-wheel-side"><img src="../assets/robot-x3-green.png" alt="RayDino"><h2>我的 RayDino</h2>${status(pc.connected,pc.sleeping?'休眠中':'已就绪','未连接')}<p>点选一个动作，和 RayDino 互动</p>${!pc.connected?pConnectButton():''}</aside></div>`}
function runDesktopWheel(index){desktopReady(()=>{pcTalk=false;stopAnimation();pcWheelSelected=index;pcBusy=true;pcWheelState='正在执行';pcRender();const [name,,motion]=pcWheelActions[index];pLog('动作 '+name+'：RUNNING');let left=index>=6?3:1;const step=()=>animate(motion,()=>{if(--left>0)step();else{pcBusy=false;pcWheelState='已完成 · 点击重播';document.querySelector('.desktop-wheel-center')?.classList.remove('executing');document.querySelector('.desktop-wheel-center')?.setAttribute('aria-label','播放所选动作');const label=document.getElementById('desktop-wheel-state');if(label)label.textContent=pcWheelState;pLog('动作 '+name+'：COMPLETED')}});step()})}
let keyboardArmed=isPlaySimulation();
function pcDriveDisabled() {
  return ((page==='controller'||isPlaySimulation()) && simDriveDisabled()) || pc.sleeping || pc.running || (!isSimMode() && !pc.connected);
}
function renderDrivePanel() {
  const disabled = pcDriveDisabled();
  const driveReason = isPlaySimulation() ? (simSession.running ? '停止玩法后可手动控制。' : simRobot.action?'动作完成后可移动。':'起立后可移动。') :
    pc.running ? '先停止当前玩法，再接管控制。' : pc.sleeping ? '请先唤醒机器人。' : simRobot.action?'动作完成后可移动。':simRobot.posture==='sitting'?'起立后可移动。':'连接机器人后即可启用。';
  const directions = [['forward','前进','W','↑'],['left','左转','A','←'],['backward','后退','S','↓'],['right','右转','D','→']];
  return `<section class="keyboard-panel control-panel">
    <header class="cp-head"><h2>${isPlaySimulation() ? '移动控制' : '键盘控制'}</h2><span id="keyboard-indicator">未启用</span></header>
    <div class="keyboard-intro"><p>${isPlaySimulation() ? 'WASD／方向键移动，R 站起或坐下，C 切换跟随视角。' : 'WASD 或方向键移动，松开即停。'}</p>
      <button class="btn orange" data-keyboard-arm ${disabled ? 'disabled' : ''}><span>启用键盘控制</span></button>
      ${disabled ? `<p>${driveReason}</p>` : ''}
    </div>
    <div class="keyboard-controls" role="group" aria-label="移动控制">
      ${directions.map(([key,label,letter,arrow])=>`<button data-desktop-drive="${key}" aria-label="${label}" ${disabled?'disabled':''}><kbd>${letter}</kbd><span>${label}</span><small>${arrow}</small></button>`).join('')}
    </div>
    <div class="keyboard-footer"><span>按住按钮可移动</span><button class="btn" data-desktop-drive-stop><kbd>Space</kbd><span>停止移动</span></button></div>
  </section>`;
}

function pcController() {
  return pTitle('手动控制','',`<button class="btn danger" data-pc-stop>${icon('stop')}<span>停止全部动作</span></button>`) +
    renderDrivePanel() + simPosturePanel() + `<section class="control-panel pose-panel"><header class="cp-head"><h2>姿态与速度</h2><span>调整后应用</span></header>${pPose()}</section>`;
}

function deskDriveStop() {
  clearTimeout(deskDriveTimer);
  deskDriveButton?.classList.remove('pressed');
  deskDriveButton = null;
  if (isPlaySimulation()) stopSimDrive();
  else {
    const robot = document.querySelector('.workspace-preview .robot-visual');
    if (robot) robot.style.translate = '';
  }
  const state = document.getElementById('desktop-drive-state');
  if (state) state.textContent = '已停止';
}

function deskDriveStart(button) {
  if (pcDriveDisabled()) return;
  deskDriveStop();
  deskDriveButton = button;
  button.classList.add('pressed');
  const direction = button.dataset.desktopDrive;
  const names = { forward: '前进', backward: '后退', left: '左转', right: '右转' };
  document.getElementById('desktop-drive-state').textContent = names[direction] + '中';
  if (isPlaySimulation()) startSimDrive(direction, pcPose.speed);
  else {
    const robot = document.querySelector('.workspace-preview .robot-visual');
    const distance = Math.round(pcPose.speed / 3);
    const offset = { forward: [0, -distance], backward: [0, distance], left: [-distance, 0], right: [distance, 0] };
    if (robot) robot.style.translate = offset[direction].map(value => value + 'px').join(' ');
  }
  deskDriveTimer = setTimeout(deskDriveStop, 5000);
}
function pcRealPlay(play) {
  const running = pc.connected && pc.running === play.id;
  const installed = pc.installed.includes(play.id);
  const instruction = play.id === 'spot'
    ? '把光斑投到 RayDino 前方的地面上，移动光斑即可观察跟随。'
    : '把 RayDino 放在桌面上，启动专注后就可以开始做自己的事。';
  return pTitle(play.name, '', '<a class="btn" href="apps.html"><span>返回玩法</span></a>') + `
    <section class="control-panel play-simulator">
      <header class="cp-head"><h2>实体 RayDino</h2><span>${running?'运行中':installed?'已安装':'未安装'}</span></header>
      <div class="sim-play-body"><p>${instruction}</p><div class="linkrow">
        ${running?'<button class="btn danger" data-stop-app><span>停止玩法</span></button>':`<button class="btn orange" ${installed?'data-pc-start':'data-pc-add'}="${play.id}"><span>${installed?'在 RayDino 上启动':'安装到 RayDino'}</span></button>`}
      </div></div>
    </section>`;
}
function pcPlay(){return pcRealPlay(selectedApp);}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-pc-talk')){if(pcTalk)pcSetTalk(false);else desktopReady(()=>pcSetTalk(true))}if(b.hasAttribute('data-pc-power')){if(!pc.connected)return;const change=()=>{cancelBodyAction();deskDriveStop();stopAnimation();pcBusy=false;pcTalk=false;pc.sleeping=!pc.sleeping;if(pc.sleeping)pc.running=null;pSave();pcRender();toast(pc.sleeping?'机器人已休眠':'机器人已唤醒')};if(!pc.sleeping&&pc.running)confirmDialog('让机器人休眠？','当前玩法将停止。','休眠',change);else change()}if(b.dataset.pcScope){pcScope=b.dataset.pcScope;pcRender()}if(b.hasAttribute('data-desktop-mic')){pc.mic=!pc.mic;pSave();pcRender()}if(b.dataset.pcWheel!==undefined)runDesktopWheel(Number(b.dataset.pcWheel));if(b.hasAttribute('data-pc-wheel-center')){if(pcBusy)pStop();else runDesktopWheel(pcWheelSelected)}if(b.hasAttribute('data-desktop-take'))desktopReady(()=>{});if(b.hasAttribute('data-desktop-drive-stop'))deskDriveStop();if(b.dataset.desktopDrive&&e.detail===0){deskDriveStart(b);clearTimeout(deskDriveTimer);deskDriveTimer=setTimeout(deskDriveStop,350)}});
document.addEventListener('input',e=>{if(e.target.id==='desktop-volume'){pc.volume=Number(e.target.value);document.getElementById('desktop-volume-value').textContent=pc.volume+'%';pSave()}if(e.target.id==='desktop-app-search'){pcSearch=e.target.value;pcRender();const el=document.getElementById('desktop-app-search');el.focus();el.setSelectionRange(pcSearch.length,pcSearch.length)}});
document.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-desktop-drive]');if(!b||b.disabled)return;e.preventDefault();b.setPointerCapture?.(e.pointerId);deskDriveStart(b)});document.addEventListener('pointerup',deskDriveStop);document.addEventListener('pointercancel',deskDriveStop);window.addEventListener('blur',deskDriveStop);window.addEventListener('pagehide',deskDriveStop);document.addEventListener('visibilitychange',()=>{if(document.hidden)deskDriveStop()});

const heldDriveKeys=new Map();let keyboardHeartbeat=null;
function keyboardUi(){const i=document.getElementById('keyboard-indicator');if(i)i.textContent=keyboardArmed?'键盘已启用':'未启用';const b=document.querySelector('[data-keyboard-arm]');if(b){b.querySelector('span').textContent=keyboardArmed?'停用键盘控制':'启用键盘控制';b.setAttribute('aria-pressed',String(keyboardArmed))}}
function releaseKeyboard(disarm=false){if(typeof heldDriveKeys==='undefined')return;heldDriveKeys.clear();clearInterval(keyboardHeartbeat);keyboardHeartbeat=null;deskDriveStop();if(disarm)keyboardArmed=false;keyboardUi()}
function driveFromKeyboard(){if(!keyboardArmed||!heldDriveKeys.size)return;const dir=[...heldDriveKeys.values()].at(-1);const b=document.querySelector('[data-desktop-drive="'+dir+'"]');if(b&&!b.disabled){if(deskDriveButton!==b)deskDriveStart(b);clearTimeout(deskDriveTimer)}}
document.addEventListener('click',e=>{if(e.target.closest('[data-keyboard-arm]')){keyboardArmed=!keyboardArmed;if(!keyboardArmed)releaseKeyboard();keyboardUi()}if(e.target.closest('[data-desktop-drive-stop],[data-pc-stop]'))releaseKeyboard()});
document.addEventListener('keydown',e=>{if((page!=='controller'&&!isPlaySimulation())||!keyboardArmed||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]')){releaseKeyboard();return}if(isPlaySimulation()&&!e.repeat){const control={KeyR:'[data-sim-posture]:enabled',KeyC:'[data-arena-follow]',Home:'[data-arena-reset]'}[e.code];if(control){e.preventDefault();document.querySelector(control)?.click();return}}const dirs={KeyW:'forward',ArrowUp:'forward',KeyS:'backward',ArrowDown:'backward',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};if(e.code==='Space'||e.code==='Escape'){e.preventDefault();releaseKeyboard(e.code==='Escape');return}if(!dirs[e.code])return;e.preventDefault();if(e.repeat)return;heldDriveKeys.set(e.code,dirs[e.code]);driveFromKeyboard();if(!keyboardHeartbeat)keyboardHeartbeat=setInterval(driveFromKeyboard,100)});
document.addEventListener('keyup',e=>{if(!heldDriveKeys.has(e.code))return;e.preventDefault();heldDriveKeys.delete(e.code);if(heldDriveKeys.size)driveFromKeyboard();else releaseKeyboard()});
window.addEventListener('blur',()=>releaseKeyboard(!isPlaySimulation()));window.addEventListener('pagehide',()=>releaseKeyboard(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseKeyboard(!isPlaySimulation())});document.addEventListener('focusin',e=>{if(e.target.closest('input,textarea,select,[contenteditable="true"]'))releaseKeyboard()});

document.addEventListener('click', event => {
  if (event.target.closest('[data-web-logout]')) session.logout();
});
window.addEventListener('pageshow', event => {
  if (event.persisted && (!session.signedIn() || isSimMode() !== renderedSimulation ||
      (!isSimMode() && !session.connected()))) location.reload();
});
const renderedSimulation = isSimMode();
if (redirect) location.replace(redirect);
else pcRender();

const cloudEntry = params.get('method') === 'cloud';
let screen = cloudEntry ? 'connect' : 'choose', method = cloudEntry ? 'cloud' : 'bridge', step = 0;
const el=document.getElementById('entry');
const btn=(s,a,c='')=>`<button class="btn ${c}" data-act="${a}"><span>${s}</span></button>`;
function render(){el.innerHTML=screen==='choose'?`<div class="entry-intro"><span>开始一个工作会话</span><h1>今天，在哪儿调试？</h1><p>连接身边的 RayDino，或先在虚拟环境中验证想法。</p></div><div class="entry-options"><article><div class="entry-art physical"><img src="../assets/robot-x3-green.png" alt="RayDino 实体机器人"><span>REAL ROBOT</span></div><div class="entry-card"><h2>连接机器人</h2><p>查看设备状态、调试动作，验证真实运行效果。</p><div class="entry-tags"><span>实机控制</span><span>设备与声音</span><span>运行日志</span></div>${btn('连接实机','real','orange')}</div></article><article><div class="entry-art virtual"><div class="entry-grid"></div><img src="../assets/robot-x3-green.png" alt="RayDino 虚拟模型"><span>SIMULATION</span></div><div class="entry-card"><h2>进入仿真器</h2><p>无需实体设备，从虚拟 RayDino 开始动作调试。</p><div class="entry-tags"><span>虚拟设备</span><span>动作预览</span><span>重置场景</span></div>${btn('创建仿真会话','sim')}</div></article></div>`:`<button class="entry-back" data-act="back">${icon('back')}<span>返回调试方式</span></button><div class="entry-intro"><span>实机调试 / 连接设备</span><h1>${step===2?'准备好开始调试了':'连接你的 RayDino'}</h1><p>${step===2?'确认设备与连接方式后，进入工作台。':'选择适合当前设备的连接方式。'}</p></div><div class="connect-layout"><nav><button data-method="bridge" class="${method==='bridge'?'selected':''}"><strong>通过本地连接服务</strong><span>USB 或同一局域网 · 开发调试</span></button><button data-method="cloud" class="${method==='cloud'?'selected':''}"><strong>连接已绑定设备</strong><span>联网调试 · 使用 App 绑定账号</span></button></nav><section class="connect-panel">${panel()}</section></div>`}
function panel(){if(step===2)return `<div class="connection-success">${icon('check')}<span>连接已建立</span></div><div class="entry-device"><img src="../assets/robot-x3-green.png" alt="RayDino"><div><h2>我的 RayDino</h2><p>${esc(method === 'cloud' ? MicroXEnrollment.owned()?.sn : 'RAYDINO-001')}</p><p>${method==='bridge'?'本地连接服务 / USB':'App 绑定 / 联网调试'}</p></div></div><div class="entry-checks"><span>控制通道已就绪</span><span>设备状态已读取</span><span>控制权已获取</span></div>${btn('进入实机工作台','workspace','orange')}`;
if(method==='bridge')return `<span class="entry-caption">本地连接服务</span><h2>先让电脑找到机器人</h2><ol><li>安装并启动 RaydiculousX 连接服务</li><li>用 USB 连接机器人，或让两者加入同一局域网</li><li>允许浏览器访问本机连接服务</li></ol>${step===1?`<div class="entry-device"><img src="../assets/robot-x3-green.png" alt="RayDino"><div><h3>RayDino</h3><p>RAYDINO-001 · USB</p></div><span>可连接</span></div>${btn('连接此机器人','connect','orange')}`:`${btn('检查连接服务','detect','orange')}${btn('找不到设备？','help')}<p id="entry-help" hidden>确认连接服务正在运行，检查 USB 数据线或局域网连接，然后重试。</p>`}`;
const account = MicroXEnrollment.current();
const device = MicroXEnrollment.owned();
return `<span class="entry-caption">联网调试</span><h2>连接 App 已绑定的 RayDino</h2>
  <p>使用同一演示账号查看已绑定设备。首次认领在 App 里完成。</p>
  ${account ? `<p>当前账号 ${MicroXEnrollment.mask(account.phone)}</p>` : ''}
  ${device ? `<div class="entry-device"><img src="../assets/robot-x3-green.png" alt="RayDino"><div><h3>RayDino</h3><p>${esc(device.sn)}</p></div><span>已绑定</span></div>
    ${btn('连接此机器人','cloud-connect','orange')}` : account ?
    '<p>当前账号暂无绑定设备。</p><a class="btn orange" href="../mobile/bind.html?from=control"><span>去 App 绑定设备</span></a>' : ''}
  <div class="linkrow">${btn('使用注册演示账号','demo-register')}${btn('使用登录演示账号','demo-login')}</div>`;}

document.addEventListener('click', event => {
  const tab = event.target.closest('[data-method]');
  if (tab) {
    method = tab.dataset.method;
    step = 0;
    render();
    return;
  }
  const action = event.target.closest('[data-act]')?.dataset.act;
  switch (action) {
    case 'back': screen = 'choose'; step = 0; break;
    case 'real': screen = 'connect'; break;
    case 'detect': step = 1; break;
    case 'help': document.getElementById('entry-help').hidden = false; return;
    case 'connect': step = 2; break;
    case 'cloud-connect': if (MicroXEnrollment.owned()) step = 2; break;
    case 'demo-register':
    case 'demo-login':
      MicroXEnrollment.session(MicroXEnrollment.demoAccount(action === 'demo-register' ? 'register' : 'login'), false);
      break;
    case 'workspace': return enter('real');
    case 'sim': return enter('simulation');
    default: return;
  }
  render();
});

function enter(mode) {
  const cloud = mode === 'real' && method === 'cloud';
  const device = cloud ? MicroXEnrollment.owned() : null;
  if (cloud && !device) {
    step = 0;
    render();
    return;
  }
  const key = 'raydiculousx-cloud-device';
  if (device) sessionStorage.setItem(key, device.sn);
  else sessionStorage.removeItem(key);
  sessionStorage.setItem('microx-work-mode', mode);
  const pc = readStore('microx-v2-control', { installed: [], logs: [] });
  Object.assign(pc, { connected: mode === 'real', running: null, sleeping: false });
  writeStore('microx-v2-control', pc);
  location.href = mode === 'real' ? 'index.html' : 'simulator.html';
}
window.addEventListener('pageshow', event => { if (event.persisted) render(); });
window.addEventListener('storage', event => {
  if (event.key === MicroXEnrollment.key && screen === 'connect' && method === 'cloud') {
    if (!MicroXEnrollment.owned()) step = 0;
    render();
  }
});
render();

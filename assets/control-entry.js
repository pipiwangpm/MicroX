const entry = document.getElementById('entry');
const session = ControlSession;
const btn = (label, action, color = '') => `<button type="button" class="btn ${color}" data-act="${action}"><span>${label}</span></button>`;
const pendingPlay = ROBOT_PLAYS.find(play => play.id === params.get('app'));
const pendingSimulation = params.get('next') === 'simulator';
let step = null;

function loginPage() {
  return `<section class="entry-login connect-panel"><span class="entry-caption">RaydiculousX Web</span><h1>登录开发者 Web</h1>
    <form id="web-login">
      <label for="web-phone">手机号（+86）</label><input id="web-phone" type="tel" placeholder="请输入手机号" readonly>
      <label for="web-code">短信验证码</label>
      <div class="entry-login-code"><input id="web-code" placeholder="请输入验证码" readonly><button type="button" class="btn" disabled><span>获取验证码</span></button></div>
      <button type="submit" class="btn orange"><span>登录</span></button>
    </form></section>`;
}

function modePage() {
  return `<div class="entry-intro"><h1>选择调试方式</h1></div><div class="entry-options">
    <article><div class="entry-art physical"><img src="../assets/robot-x3-green.png" alt="实体 RayDino"><span>REAL ROBOT</span></div>
      <div class="entry-card"><h2>实机工作台</h2><p>通过 USB 或局域网连接 RayDino，进行语音交互、手动控制和玩法安装。</p>
      ${btn('连接实机','real','orange')}</div></article>
    <article><div class="entry-art virtual"><div class="entry-grid"></div><img src="../assets/robot-x3-green.png" alt="虚拟 RayDino"><span>SIMULATION</span></div>
      <div class="entry-card"><h2>仿真工作台</h2><p>控制虚拟 RayDino、运行玩法仿真，并调试本机摄像头和麦克风。</p>
      ${btn('进入仿真器','simulation')}</div></article>
  </div>`;
}

function connectionPage() {
  let content;
  if (step === 2) {
    content = `<div class="connection-success">${icon('check')}<span>连接已建立</span></div>
      <div class="entry-device"><img src="../assets/robot-x3-green.png" alt="RayDino"><div><h2>RayDino</h2><p>RAYDINO-001</p></div></div>
      ${btn('进入实机工作台','workspace','orange')}`;
  } else if (step === 1) {
    content = `<div class="entry-device"><img src="../assets/robot-x3-green.png" alt="RayDino"><div><h2>RayDino</h2><p>RAYDINO-001</p></div><span>可连接</span></div>
      ${btn('连接此机器人','connect','orange')}`;
  } else {
    content = `<h2>本地连接服务</h2><p>启动 RaydiculousX 连接服务，通过 USB 连接机器人，或将电脑与机器人接入同一局域网。</p>
      ${btn('检查连接服务','detect','orange')}`;
  }
  return `<button class="entry-back" data-act="back">${icon('back')}<span>返回调试方式</span></button>
    <div class="entry-intro"><h1>连接 RayDino</h1></div><section class="connect-panel entry-connect">${content}</section>`;
}

function render() {
  entry.innerHTML = !session.signedIn() ? loginPage() : step === null ? modePage() : connectionPage();
  document.querySelector('[data-web-logout]').hidden = !session.signedIn();
}

function enter(mode) {
  session.select(mode);
  if (mode === 'real') {
    const pc = readStore('microx-v2-control', { installed: [], logs: [] });
    Object.assign(pc, { connected: true, running: null, sleeping: false });
    writeStore('microx-v2-control', pc);
  }
  location.href = mode === 'real' ? 'index.html' : 'simulator.html' + (pendingPlay ? '?app=' + pendingPlay.id : '');
}

entry.addEventListener('submit', event => {
  if (event.target.id !== 'web-login') return;
  event.preventDefault();
  session.login();
  if (pendingSimulation) return enter('simulation');
  render();
});
document.addEventListener('click', event => {
  if (event.target.closest('[data-web-logout]')) return session.logout();
  if (!session.signedIn()) return;
  switch (event.target.closest('[data-act]')?.dataset.act) {
    case 'back': step = null; break;
    case 'real': step = 0; break;
    case 'detect': step = 1; break;
    case 'connect': step = 2; break;
    case 'workspace': if (step === 2) return enter('real'); break;
    case 'simulation': return enter('simulation');
    default: return;
  }
  render();
});

if (session.signedIn() && pendingSimulation) enter('simulation');
else render();
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    step = null;
    render();
  }
});

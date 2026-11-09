const storageKey = 'microx-v2-mobile';
const app = document.getElementById('app');
const light = {x: 72, y: 63};
const dinosaur = {x: 29, y: 73, facing: 1};
const route = [{x: 74, y: 43}, {x: 27, y: 50}, {x: 46, y: 79}];
let tracking = false;
let frameId = 0;
let lastFrame = 0;
let nextMove = 0;
let routeIndex = 0;

function render() {
  const device = readStore(storageKey, {installed: []});
  const installed = device.installed.includes('spot');
  app.innerHTML = `<div class="sg-review"><main class="phone mobile-no-tab sg-phone">
    <div class="phone-status"><span>9:41</span><div class="phone-dynamic"></div><span class="phone-status-right">${icon('signal')}${icon('wifi')}${icon('battery')}</span></div>
    <div class="mobile-content">
      <header class="sg-bar"><a href="discover.html" aria-label="返回玩法">${icon('back')}</a><strong>光斑追踪</strong><span></span></header>
      <div class="sg-device"><span>${icon('robot')}<strong>我的 MicroX</strong></span>${status(device.connected, '已连接', '未连接')}</div>
      <div class="spot-intro"><h1>跟着光斑走</h1><p>把光斑投在小恐龙前方的地面上，慢慢移动光斑，小恐龙就会跟过去。</p></div>
      <button class="spot-field" type="button" aria-label="移动演示光斑" data-active="${tracking}" aria-disabled="${!tracking}">
        <span class="spot-grid" aria-hidden="true"></span><span class="spot-preview-label">跟随演示</span>
        <span class="spot-light" aria-hidden="true"></span><img class="spot-robot" src="../assets/robot-x3-green.png" alt="MicroX 小恐龙">
      </button>
      <p class="spot-hint">开始后，点按场地可以移动演示光斑。</p>
      <div class="spot-state" role="status" data-active="${tracking}"><span class="spot-state-dot"></span><span>${tracking ? '正在跟随光斑' : installed ? '已安装到小恐龙' : '尚未安装'}</span></div>
      <div class="spot-actions"><button class="sg-btn ${tracking ? '' : 'primary'}" id="tracking-action"><span>${tracking ? '停止追踪' : !installed ? '安装到小恐龙' : device.connected ? '开始追踪' : '连接并开始'}</span></button><a href="discover.html">返回玩法</a></div>
    </div><div class="phone-home-indicator"></div></main></div>`;
  draw();
  document.getElementById('tracking-action').onclick = tracking ? stop : start;
  app.querySelector('.spot-field').onclick = moveLight;
}

function draw() {
  const dot = app.querySelector('.spot-light');
  const robot = app.querySelector('.spot-robot');
  dot.style.left = light.x + '%';
  dot.style.top = light.y + '%';
  robot.style.left = dinosaur.x + '%';
  robot.style.top = dinosaur.y + '%';
  robot.style.transform = `translate(-50%,-76%) scaleX(${dinosaur.facing})`;
}

function moveLight(event) {
  if (!tracking) return;
  if (event.detail === 0) {
    Object.assign(light, route[routeIndex++ % route.length]);
  } else {
    const bounds = event.currentTarget.getBoundingClientRect();
    light.x = Math.min(87, Math.max(13, (event.clientX - bounds.left) / bounds.width * 100));
    light.y = Math.min(86, Math.max(38, (event.clientY - bounds.top) / bounds.height * 100));
  }
  nextMove = performance.now() + 5500;
}

function tick(now) {
  if (!tracking) return;
  if (now >= nextMove) {
    Object.assign(light, route[routeIndex++ % route.length]);
    nextMove = now + 3400;
  }
  const delta = Math.min(40, now - lastFrame);
  lastFrame = now;
  const dx = light.x - dinosaur.x;
  const dy = light.y - dinosaur.y;
  const distance = Math.hypot(dx, dy);
  if (distance > 8) {
    const step = Math.min(distance - 8, delta * 0.024);
    dinosaur.x += dx / distance * step;
    dinosaur.y += dy / distance * step;
    if (Math.abs(dx) > 4) dinosaur.facing = dx > 0 ? -1 : 1;
  }
  draw();
  frameId = requestAnimationFrame(tick);
}

function start() {
  const device = readStore(storageKey, {installed: []});
  if (!device.installed.includes('spot')) {
    installRobotPlay('spot', '光斑追踪', render);
    return;
  }
  if (!device.connected) {
    connectionDialog(false, connected => {
      writeStore(storageKey, {...device, connected, sleeping: false});
    }, start);
    return;
  }
  const begin = () => {
    writeStore(storageKey, {...device, running: 'spot', sleeping: false});
    tracking = true;
    lastFrame = performance.now();
    nextMove = lastFrame + 3400;
    render();
    document.getElementById('tracking-action').focus({preventScroll: true});
    frameId = requestAnimationFrame(tick);
  };
  if (device.running && device.running !== 'spot') {
    confirmDialog('切换玩法？', '当前玩法会停止。', '切换并开始', begin);
    return;
  }
  begin();
}

function releaseTracking() {
  cancelAnimationFrame(frameId);
  tracking = false;
  const device = readStore(storageKey, {});
  if (device.running === 'spot') writeStore(storageKey, {...device, running: null});
}

function stop() {
  releaseTracking();
  render();
  document.getElementById('tracking-action').focus({preventScroll: true});
}

window.addEventListener('pagehide', releaseTracking);
window.addEventListener('pageshow', event => {
  if (event.persisted) render();
});
render();

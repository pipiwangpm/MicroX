const simSession = {
  running: false, output: '等待启动', events: [], light: '', position: 0, phone: false
};

const simRobot = { posture: 'standing', x: 0, y: 0, heading: 0 };
let simDriveFrame = 0;
let simDriveDirection = '';

function simDriveDisabled() {
  return simSession.running || simRobot.posture === 'sitting';
}

function mountSimArena() {
  const stage = document.querySelector('.workspace-preview .viewport');
  if (!stage || !window.controlArena) return false;
  window.controlArena.mount(stage);
  return true;
}

function drawSimRobot() {
  if (mountSimArena()) {
    window.controlArena.update({ ...simRobot, moving: simDriveDirection });
    return;
  }
  const viewport = document.querySelector('.workspace-preview .viewport');
  const robot = viewport?.querySelector('.robot-visual');
  if (!robot) return;
  const angle = simRobot.heading * Math.PI / 180;
  const sitting = simRobot.posture === 'sitting';
  robot.style.translate = `${simRobot.x * viewport.clientWidth}px ${simRobot.y * viewport.clientHeight}px`;
  robot.style.transform = `translateX(-50%) perspective(650px) rotateY(${Math.sin(angle) * 35}deg) scaleY(${sitting ? .68 : 1})`;
}

function startSimDrive(direction, speed) {
  simDriveDirection = direction;
  let previous = performance.now() - 25;
  function update(now) {
    const seconds = Math.min(.05, (now - previous) / 1000);
    previous = now;
    if (direction === 'left' || direction === 'right') {
      simRobot.heading = (simRobot.heading + seconds * speed * 2 * (direction === 'left' ? -1 : 1)) % 360;
    } else {
      const distance = seconds * speed / 155 * (direction === 'forward' ? 1 : -1);
      const angle = simRobot.heading * Math.PI / 180;
      simRobot.x = Math.min(.24, Math.max(-.24, simRobot.x + distance * Math.sin(angle)));
      simRobot.y = Math.min(.19, Math.max(-.19, simRobot.y - distance * Math.cos(angle)));
    }
    drawSimRobot();
    simDriveFrame = requestAnimationFrame(update);
  }
  update(performance.now());
}

function stopSimDrive() {
  cancelAnimationFrame(simDriveFrame);
  if (!simDriveDirection) return;
  simDriveDirection = '';
  if (!simSession.running) drawSimRobot();
}

function simPosturePanel() {
  const sitting = simRobot.posture === 'sitting';
  return `<section class="control-panel play-simulator">
    <header class="cp-head"><h2>身体姿态</h2><span role="status">${sitting ? '已坐下' : '站立中'}</span></header>
    <div class="sim-play-body"><div class="linkrow">
      <button type="button" class="btn" data-sim-posture="standing" ${simSession.running || !sitting ? 'disabled' : ''}><span>站起</span></button>
      <button type="button" class="btn" data-sim-posture="sitting" ${simSession.running || sitting ? 'disabled' : ''}><span>坐下</span></button>
    </div></div>
  </section>`;
}

function renderPlaySimulator() {
  const play = selectedApp;
  return pTitle('机器人仿真', '', '<a class="btn" href="apps.html"><span>返回玩法</span></a>') +
    renderDrivePanel() + simPosturePanel() + `
    <section class="control-panel play-simulator">
      <header class="cp-head"><h2>玩法仿真</h2></header>
      <div class="sim-play-body">
        <label for="sim-play-picker">选择玩法</label>
        <select id="sim-play-picker" ${simSession.running?'disabled':''}>${APPS.map(a=>`<option value="${a.id}" ${a.id===play.id?'selected':''}>${a.name}</option>`).join('')}</select>
        <p>${play.desc}</p>
        <div class="linkrow">
          <button class="btn orange" data-play-sim="start" ${simSession.running || simRobot.posture === 'sitting' ? 'disabled' : ''}>${icon('play')}<span>启动仿真</span></button>
          <button class="btn" data-play-sim="stop" ${simSession.running?'':'disabled'}>${icon('stop')}<span>停止玩法</span></button>
        </div>
      </div>
    </section>
    <section class="control-panel play-simulator">
      <header class="cp-head"><h2>调试输入</h2></header>
      <div class="sim-play-body">
        ${simControls(play.id)}
        <p class="sim-output" role="status">${esc(simSession.output)}</p>
      </div>
    </section>`;
}

function simButton(label, action, disabled = !simSession.running) {
  return `<button class="btn" data-play-sim="${action}" ${disabled?'disabled':''}><span>${label}</span></button>`;
}

function simControls(id) {
  if (id === 'spot') return `<p>移动光斑，观察 RayDino 是否跟随。</p><div class="linkrow">${simButton('光斑移到左侧','left')}${simButton('光斑移到右侧','right')}${simButton('隐藏光斑','hide',!simSession.running||!simSession.light)}</div>`;
  return `<p>切换手机使用状态，查看专注提醒。</p><div class="linkrow">${simButton('拿起手机','phone-up',!simSession.running||simSession.phone)}${simButton('放下手机','phone-down',!simSession.running||!simSession.phone)}</div>`;
}

function simReport(message) {
  simSession.output = message;
  simSession.events.unshift({time:new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}),message});
  simSession.events = simSession.events.slice(0,20);
  const robot = document.querySelector('.workspace-preview .sim-follow-robot');
  if (!simSession.running) simSession.position = 0;
  else if (robot) simSession.position = parseFloat(getComputedStyle(robot).translate) || 0;
  pcRender();
}

function simLogsPanel() {
  return `<section class="control-panel logs-panel"><header class="cp-head"><h2>仿真日志</h2></header><div class="log-console">${simSession.events.length?simSession.events.map(e=>`<div class="log-row"><span class="log-time">${e.time}</span><span class="log-text">${esc(e.message)}</span></div>`).join(''):'<span>仿真就绪。</span>'}</div></section>`;
}

function drawPlaySimulation() {
  if (!isPlaySimulation()) return;
  if (!simSession.running || selectedApp.id !== 'spot') {
    drawSimRobot();
    return;
  }
  if (mountSimArena()) {
    const light = simSession.light;
    const x = light ? (light === 'left' ? -.14 : .14) : simSession.position;
    simSession.position = x;
    window.controlArena.update({ ...simRobot, x, y: 0, heading: 0, light, moving: '' });
    return;
  }
  const viewport = document.querySelector('.workspace-preview .viewport');
  const robot = viewport?.querySelector('.robot-visual');
  if (!robot) return;
  robot.classList.add('sim-follow-robot');
  robot.style.translate = simSession.position + 'px 0';
  if (!simSession.light) return;
  const light = document.createElement('span');
  light.className = 'sim-light ' + simSession.light;
  light.setAttribute('aria-hidden', 'true');
  viewport.append(light);
  const target = simSession.light === 'left' ? -72 : 72;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (robot.isConnected) robot.style.translate = target + 'px 0';
  }));
}

function isPlaySimulation() {
  return page === 'simulator';
}

document.addEventListener('change', event => {
  if (event.target.id !== 'sim-play-picker' || simSession.running) return;
  selectedApp = appById(event.target.value);
  const url = new URL(location.href);
  url.searchParams.set('app', selectedApp.id);
  history.replaceState(null, '', url);
  simSession.output = '等待启动';
  pcRender();
  document.getElementById('sim-play-picker')?.focus();
});

document.addEventListener('click', event => {
  if (!isPlaySimulation()) return;
  const posture = event.target.closest('[data-sim-posture]')?.dataset.simPosture;
  if (posture && !simSession.running) {
    simRobot.posture = posture;
    simReport(posture === 'standing' ? '虚拟 RayDino 已站起。' : '虚拟 RayDino 已坐下。');
    document.querySelector('[data-sim-posture]:enabled')?.focus();
    return;
  }
  const action = event.target.closest('[data-play-sim]')?.dataset.playSim;
  if (!action) return;
  if (action === 'start') {
    if (simDriveDisabled()) return;
    simSession.running = true;
    simSession.light = selectedApp.id === 'spot' ? 'right' : '';
    simReport(selectedApp.name + '已在虚拟 RayDino 启动。');
    return;
  }
  if (!simSession.running) return;
  if (action === 'stop') {
    stopAnimation();
    Object.assign(simSession, {running:false, light:'', phone:false});
    simReport('玩法仿真已停止。');
    return;
  }
  if (action === 'left' || action === 'right') {
    simSession.light = action;
    simReport('识别到' + (action==='left'?'左侧':'右侧') + '光斑，RayDino 正在跟随。');
    return;
  }
  if (action === 'hide') {
    simSession.light = '';
    simReport('光斑消失，RayDino 停止跟随。');
    return;
  }
  if (action === 'phone-up' || action === 'phone-down') {
    simSession.phone = action === 'phone-up';
    simReport(simSession.phone ? '检测到拿起手机，RayDino 发出专注提醒。' : '手机已放下，继续专注。');
    return;
  }

});

document.addEventListener('arena-reset', () => {
  releaseKeyboard();
  Object.assign(simRobot, { x: 0, y: 0, heading: 0, posture: 'standing' });
  Object.assign(simSession, { running: false, light: '', phone: false, position: 0 });
  simReport('场地已重置。');
});

window.addEventListener('pagehide', stopAnimation);

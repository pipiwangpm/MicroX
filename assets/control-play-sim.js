const simSession = {
  running: false, output: '等待启动', events: [], light: '', position: 0, phone: false,
  answer: null, motionIndex: 0, playing: false
};

function renderPlaySimulator() {
  const play = selectedApp;
  return pTitle('仿真调试', '', '<a class="btn" href="apps.html"><span>返回玩法</span></a>') + `
    <section class="control-panel play-simulator">
      <header class="cp-head"><h2>运行配置</h2><span>虚拟 MicroX</span></header>
      <div class="sim-play-body">
        <label for="sim-play-picker">选择玩法</label>
        <select id="sim-play-picker" ${simSession.running?'disabled':''}>${APPS.map(a=>`<option value="${a.id}" ${a.id===play.id?'selected':''}>${a.name}</option>`).join('')}</select>
        <p>${play.desc}</p>
        <div class="linkrow">
          <button class="btn orange" data-play-sim="start" ${simSession.running?'disabled':''}>${icon('play')}<span>启动仿真</span></button>
          <button class="btn" data-play-sim="stop" ${simSession.running?'':'disabled'}>${icon('stop')}<span>停止</span></button>
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
  if (id === 'spot') return `<p>移动光斑，观察小恐龙是否跟随。</p><div class="linkrow">${simButton('光斑移到左侧','left')}${simButton('光斑移到右侧','right')}${simButton('隐藏光斑','hide',!simSession.running||!simSession.light)}</div>`;
  if (id === 'focus') return `<p>切换手机使用状态，查看专注提醒。</p><div class="linkrow">${simButton('拿起手机','phone-up',!simSession.running||simSession.phone)}${simButton('放下手机','phone-down',!simSession.running||!simSession.phone)}</div>`;
  return `<p>播放一个动作，然后选出答案。</p><div class="linkrow">${simButton('播放动作','show-motion',!simSession.running||simSession.playing||simSession.answer!==null)}</div><div class="linkrow sim-answers">${selectedApp.motions.map((motion,i)=>simButton(motion,'answer-'+i,simSession.answer===null)).join('')}</div>`;
}

function simReport(message) {
  simSession.output = message;
  simSession.events.unshift({time:new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}),message});
  simSession.events = simSession.events.slice(0,20);
  const robot = document.querySelector('.workspace-preview .sim-follow-robot');
  simSession.position = simSession.running && robot
    ? (parseFloat(getComputedStyle(robot).translate) || 0)
    : 0;
  pcRender();
}

function simLogsPanel() {
  return `<section class="control-panel logs-panel"><header class="cp-head"><h2>仿真日志</h2><span>演示会话</span></header><div class="log-console">${simSession.events.length?simSession.events.map(e=>`<div class="log-row"><span class="log-time">${e.time}</span><span class="log-text">${esc(e.message)}</span></div>`).join(''):'<span>等待启动仿真。</span>'}</div></section>`;
}

function drawPlaySimulation() {
  if (!isPlaySimulation()) return;
  const viewport = document.querySelector('.workspace-preview .viewport');
  const robot = viewport?.querySelector('.robot-visual');
  if (!robot || selectedApp.id !== 'spot') return;
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
  location.href = 'simulator.html?app=' + encodeURIComponent(event.target.value);
});

document.addEventListener('click', event => {
  const action = event.target.closest('[data-play-sim]')?.dataset.playSim;
  if (!action || !isPlaySimulation()) return;
  if (action === 'start') {
    if (simSession.running) return;
    simSession.running = true;
    simSession.light = selectedApp.id === 'spot' ? 'right' : '';
    simReport(selectedApp.name + '已在虚拟 MicroX 启动。');
    return;
  }
  if (!simSession.running) return;
  if (action === 'stop') {
    stopAnimation();
    Object.assign(simSession, {running:false, light:'', phone:false, answer:null, playing:false});
    simReport('仿真已停止。');
    return;
  }
  if (action === 'left' || action === 'right') {
    simSession.light = action;
    simReport('识别到' + (action==='left'?'左侧':'右侧') + '光斑，小恐龙正在跟随。');
    return;
  }
  if (action === 'hide') {
    simSession.light = '';
    simReport('光斑消失，小恐龙停止跟随。');
    return;
  }
  if (action === 'phone-up' || action === 'phone-down') {
    simSession.phone = action === 'phone-up';
    simReport(simSession.phone ? '检测到拿起手机，小恐龙发出专注提醒。' : '手机已放下，继续专注。');
    return;
  }
  if (action === 'show-motion' && !simSession.playing && simSession.answer === null) {
    simSession.playing = true;
    const answer = simSession.motionIndex++ % selectedApp.motions.length;
    simReport('小恐龙正在播放动作。');
    animate(selectedApp.motions[answer], () => {
      simSession.playing = false;
      simSession.answer = answer;
      simReport('动作已播放，请选择答案。');
    });
    return;
  }
  if (action.startsWith('answer-') && simSession.answer !== null) {
    const answer = simSession.answer;
    simSession.answer = null;
    simReport(Number(action.slice(7)) === answer ? '答对了！' : '刚才的动作是「' + selectedApp.motions[answer] + '」。');
  }
});

window.addEventListener('pagehide', stopAnimation);

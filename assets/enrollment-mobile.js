(() => {
  const store = MicroXEnrollment;
  const root = document.getElementById('app');
  const binding = document.body.dataset.enrollment === 'bind';
  const user = store.current();
  if (binding && !user) {
    location.replace('account.html');
    return;
  }

  const methods = {
    qr: { title: '扫码添加', icon: '\uf029', detail: '打开手机摄像头，扫描机身二维码。' },
    bluetooth: { title: '蓝牙接入', icon: '\uf293', detail: '搜索附近可配对的 RayDino。' },
    ap: { title: 'AP 接入', icon: '\uf1eb', detail: '连接 RayDino 发出的 Wi-Fi 热点。' }
  };
  const devices = [
    { token: 'green', sn: 'RD-260001', name: 'RayDino · 青绿', hotspot: 'RayDino-Green' },
    { token: 'show', sn: 'RD-260002', name: 'RayDino · 展示机', hotspot: 'RayDino-Show' },
    { token: 'new', sn: 'RD-260099', name: 'RayDino · 新设备', hotspot: 'RayDino-New' }
  ];
  let login = params.get('mode') === 'login';
  let method = '';
  let candidate = null;
  let notice = params.has('revoked') ? '当前机器人已解绑，请重新添加。' : '';
  let stream;
  let scannerVersion = 0;
  let scanFrame;

  function stopScanner() {
    scannerVersion++;
    cancelAnimationFrame(scanFrame);
    stream?.getTracks().forEach(track => track.stop());
    stream = undefined;
  }

  function frame(content, action = '') {
    stopScanner();
    root.innerHTML = `<div class="mobile-review enroll"><main class="phone">
      <div class="phone-status"><span>9:41</span><div class="phone-dynamic"></div><span class="phone-status-right">${icon('signal')}${icon('wifi')}${icon('battery')}</span></div>
      <div class="mobile-content">
        <header class="enroll-brand"><img src="../assets/company-logo-footer.png" alt="Raydiculous 成都人形机器人创新中心">${action}</header>
        ${content}
      </div><div class="phone-home-indicator"></div>
    </main></div>`;
  }

  const feedback = () => `<p id="enroll-feedback" class="enroll-message" role="status">${esc(notice)}</p>`;

  function accountScreen() {
    frame(`<p class="kicker">RaydiculousX APP</p><h1>${login ? '登录 RaydiculousX' : '注册 RaydiculousX 账号'}</h1>
      <p class="intro">登录后，连接你的 RayDino。</p>
      <img class="enroll-hero" src="../assets/robot-x3-green.png" alt="RayDino">
      <div class="enroll-tabs" role="group" aria-label="账号操作">
        <button type="button" data-account-tab="register" aria-pressed="${!login}"><span>注册</span></button>
        <button type="button" data-account-tab="login" aria-pressed="${login}"><span>登录</span></button>
      </div>
      <div class="enroll-account-fields">
        <label class="enroll-field"><span>手机号（+86）</span><input type="tel" placeholder="请输入手机号" readonly></label>
        <div class="enroll-inline">
          <label class="enroll-field"><span>短信验证码</span><input inputmode="numeric" placeholder="请输入验证码" readonly></label>
          <button type="button" class="enroll-action" disabled><span>获取验证码</span></button>
        </div>
        <button type="button" class="enroll-action enroll-primary" data-demo-account><span>${login ? '登录' : '注册并登录'}</span></button>
      </div>`,
      user ? '<a class="enroll-link" href="my.html">返回我的</a>' : '');
  }

  function enterApp() {
    store.session(store.demoAccount(login ? 'login' : 'register'));
    location.replace('bind.html');
  }

  function deviceCard(name) {
    return `<div class="enroll-device"><img src="../assets/robot-x3-green.png" alt="RayDino"><strong>${esc(name)}</strong></div>`;
  }

  function scannerScreen() {
    return `<p class="kicker">连接机器人</p><h1>扫描机身二维码</h1>
      <p class="intro">将贴在 RayDino 机身上的二维码对准取景框。</p>
      <div class="enroll-scanner">
        <video id="enroll-camera" autoplay muted playsinline aria-label="扫码摄像头取景"></video>
        <div class="enroll-scan-frame" aria-hidden="true"></div>
      </div>
      <p class="enroll-note enroll-scan-status" id="scan-status" role="status">正在打开摄像头…</p>
      <button class="enroll-action enroll-alt" id="retry-camera" hidden><span>重新打开摄像头</span></button>
      <details class="enroll-demo"><summary>扫码样例</summary>
        <p class="enroll-note"><a class="enroll-link" href="../demo/raydino-pairing.png" target="_blank" rel="noopener">打开样例二维码</a></p>
        <div class="enroll-options">${devices.map(device => `<button class="enroll-action" data-pair="${device.token}"><span>${device.name}</span></button>`).join('')}</div>
      </details>`;
  }

  function nearbyScreen() {
    const bluetooth = method === 'bluetooth';
    return `<p class="kicker">连接机器人</p><h1>${methods[method].title}</h1>
      <p class="intro">${bluetooth ? '打开手机蓝牙，并让 RayDino 进入配对状态。从列表中选择机器人。' : '在手机 Wi-Fi 设置中连接 RayDino 的热点，再返回选择对应热点。'}</p>
      <div class="enroll-nearby-heading"><strong>${bluetooth ? '附近的机器人' : '机器人热点'}</strong></div>
      <div class="enroll-options">${devices.map(device => `<button class="enroll-choice" data-pair="${device.token}">
        ${icon(methods[method].icon)}<span><strong>${bluetooth ? device.name : device.hotspot}</strong><small>${bluetooth ? '可配对' : device.name}</small></span>${icon('chevron')}</button>`).join('')}</div>`;
  }

  function bindingScreen() {
    const result = candidate ? store.check(candidate.sn) : null;
    const currentDevice = store.owned();
    let content;
    if (result) {
      notice = result.error || '';
      content = `<p class="kicker">连接机器人 · 设备校验</p>
        <h1>${result.conflict ? '机器人已被绑定' : result.error ? '暂时无法认领' : '确认认领'}</h1>
        ${deviceCard(candidate.name)}
        ${feedback()}
        ${result.error ? '<button class="enroll-action enroll-alt" id="check-again"><span>重新检查绑定状态</span></button>' :
          '<p>认领后将连接这台机器人，然后进入「我的机器人」。</p><button class="enroll-action enroll-primary enroll-alt" id="claim"><span>确认认领</span></button>'}
        <button class="enroll-action enroll-alt" id="change-device"><span>${method === 'qr' ? '返回扫码' : '返回设备列表'}</span></button>`;
    } else if (method) {
      content = (method === 'qr' ? scannerScreen() : nearbyScreen()) +
        '<button class="enroll-action enroll-alt" id="change-method"><span>更换接入方式</span></button>';
    } else if (currentDevice) {
      const name = devices.find(device => device.sn === currentDevice.sn)?.name || 'RayDino';
      content = `<p class="kicker">我的机器人</p><h1>连接机器人</h1>
        <p class="intro">给已绑定的 RayDino 开机，然后连接。</p>
        ${deviceCard(name)}
        ${feedback()}
        <button class="enroll-action enroll-primary enroll-alt" id="reconnect"><span>连接机器人</span></button>`;
    } else {
      content = `<p class="kicker">首次使用</p><h1>连接机器人</h1>
        <p class="intro">给 RayDino 开机，再选择一种方式接入。</p>
        <img class="enroll-hero" src="../assets/robot-x3-green.png" alt="RayDino">
        ${feedback()}
        <div class="enroll-options">${Object.entries(methods).map(([id, option]) => `<button class="enroll-choice" data-method="${id}">
          ${icon(option.icon)}<span><strong>${option.title}</strong><small>${option.detail}</small></span>${icon('chevron')}</button>`).join('')}</div>`;
    }
    frame(content + `<div class="enroll-help"><p>当前账号 ${store.mask(user.phone)}</p><a class="enroll-link" href="account.html?mode=login">切换账号</a></div>`);
    if (method === 'qr' && !candidate) void startScanner();
  }

  function scannedDevice(payload) {
    try {
      const code = new URL(payload);
      if (code.protocol !== 'microx:' || code.hostname !== 'pair') return;
      return devices.find(device => device.token === code.searchParams.get('device'));
    } catch {
      return undefined;
    }
  }

  async function startScanner() {
    stopScanner();
    const version = scannerVersion;
    const video = document.getElementById('enroll-camera');
    const status = document.getElementById('scan-status');
    const retry = document.getElementById('retry-camera');
    retry.hidden = true;
    status.textContent = '正在打开摄像头…';
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof window.jsQR !== 'function') throw new Error('camera unavailable');
      const acquired = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (version !== scannerVersion) {
        acquired.getTracks().forEach(track => track.stop());
        return;
      }
      stream = acquired;
      video.srcObject = stream;
      await video.play();
      if (version !== scannerVersion) return;
      status.textContent = '正在寻找机身二维码…';
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      let lastScan = 0;

      function scan(time) {
        if (version !== scannerVersion) return;
        if (time - lastScan > 140 && video.videoWidth) {
          lastScan = time;
          const scale = Math.min(1, 600 / Math.max(video.videoWidth, video.videoHeight));
          const width = Math.round(video.videoWidth * scale);
          const height = Math.round(video.videoHeight * scale);
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          context.drawImage(video, 0, 0, width, height);
          const result = window.jsQR(context.getImageData(0, 0, width, height).data, width, height);
          if (result) {
            const device = scannedDevice(result.data);
            if (device) {
              candidate = device;
              bindingScreen();
              return;
            }
            status.textContent = '未识别到 RayDino 机身二维码，请对准贴纸重试。';
          }
        }
        scanFrame = requestAnimationFrame(scan);
      }
      scanFrame = requestAnimationFrame(scan);
    } catch {
      if (version !== scannerVersion) return;
      stopScanner();
      status.textContent = '摄像头无法开启，请检查浏览器权限。';
      retry.hidden = false;
    }
  }

  function completeClaim() {
    const result = store.claim(candidate.sn, methods[method].title);
    if (result.error) return bindingScreen();
    frame(`<p class="kicker">连接机器人 · 完成</p><h1>已认领并连接</h1>
      ${deviceCard(candidate.name)}
      <p>你现在可以和它对话、遥控或打开玩法。</p>
      <a class="enroll-action enroll-primary" href="index.html"><span>进入我的机器人</span></a>`);
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.accountTab) {
      login = button.dataset.accountTab === 'login';
      accountScreen();
      return;
    }
    if (button.hasAttribute('data-demo-account')) return enterApp();
    if (button.id === 'reconnect') {
      const device = store.owned();
      if (!device) return bindingScreen();
      const result = store.claim(device.sn, '重新连接');
      if (result.error) {
        document.getElementById('enroll-feedback').textContent = result.error;
        return;
      }
      location.replace('index.html');
      return;
    }
    if (button.dataset.method) {
      method = button.dataset.method;
      notice = '';
      bindingScreen();
    }
    if (button.dataset.pair) {
      candidate = devices.find(device => device.token === button.dataset.pair);
      bindingScreen();
    }
    if (button.id === 'retry-camera') void startScanner();
    if (button.id === 'check-again') bindingScreen();
    if (button.id === 'change-method' || button.id === 'change-device') {
      if (button.id === 'change-method') method = '';
      candidate = null;
      notice = '';
      bindingScreen();
    }
    if (button.id === 'claim') completeClaim();
  });

  window.addEventListener('pagehide', stopScanner);
  document.addEventListener('visibilitychange', () => {
    if (method !== 'qr' || candidate || !document.getElementById('enroll-camera')) return;
    if (document.hidden) stopScanner();
    else void startScanner();
  });
  if (binding) bindingScreen();
  else accountScreen();
})();

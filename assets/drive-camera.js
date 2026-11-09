let driveCameraOpen = true;
const driveCameraPose = {pan: 0, zoom: 1};

function driveCameraPanel(connected, sleeping) {
  const active = connected && !sleeping && driveCameraOpen;
  const message = !connected ? '连接小恐龙后查看画面' : sleeping ? '唤醒小恐龙后查看画面' : '打开摄像头后才能移动';
  return `
    <section class="drive-camera" aria-label="小恐龙摄像头">
      <header class="drive-camera-header">
        <div><h2>小恐龙摄像头</h2><span>前方视角 · 原型演示</span></div>
        ${connected && !sleeping ? `<button type="button" class="drive-camera-toggle" data-drive-camera><span>${active ? '关闭画面' : '打开画面'}</span></button>` : ''}
      </header>
      <div class="drive-camera-frame ${active ? 'is-previewing' : ''}">
        ${active ? `
          <div class="drive-camera-scene" aria-hidden="true" style="--camera-pan:${driveCameraPose.pan}%;--camera-zoom:${driveCameraPose.zoom}">
            <div class="camera-wall-left"></div><div class="camera-wall-right"></div>
            <div class="camera-floor"></div><div class="camera-rug"></div>
            <div class="camera-door"></div><div class="camera-console"><span></span></div>
            <div class="camera-plant"><span></span></div>
          </div>
          <span class="drive-camera-badge">演示画面</span>` : `<p>${message}</p>`}
      </div>
    </section>`;
}

function moveDriveCamera(direction) {
  const scene = document.querySelector('.drive-camera-scene');
  if (!scene) return;
  if (direction === 'left' || direction === 'right') {
    const step = direction === 'left' ? 7 : -7;
    driveCameraPose.pan = Math.max(-14, Math.min(14, driveCameraPose.pan + step));
  } else {
    const step = direction === 'forward' ? .1 : -.1;
    driveCameraPose.zoom = Math.max(.9, Math.min(1.4, driveCameraPose.zoom + step));
  }
  scene.style.setProperty('--camera-pan', driveCameraPose.pan + '%');
  scene.style.setProperty('--camera-zoom', driveCameraPose.zoom);
}

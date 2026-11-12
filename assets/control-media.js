const controlMedia = (() => {
  const labels = { camera: '摄像头', mic: '麦克风' };
  const active = {};
  const pending = new Set();
  let revision = 0;

  function panel() {
    return `<section class="control-panel local-media"><header class="cp-head"><h2>调试设备</h2></header>
      <div class="local-media-body">
        ${Object.entries(labels).map(([id, label]) => `<div class="local-media-row">
          <div><strong>${label}</strong><span data-media-state="${id}" role="status"></span></div>
          <button type="button" class="btn small" data-local-media="${id}"><span>开启${label}</span></button>
        </div>`).join('')}
        <video class="local-camera" data-local-camera autoplay muted playsinline hidden aria-label="本机摄像头画面"></video>
      </div></section>`;
  }

  function sync(id) {
    const button = document.querySelector(`[data-local-media="${id}"]`);
    if (!button) return;
    const busy = pending.has(id);
    button.disabled = busy;
    button.setAttribute('aria-pressed', String(Boolean(active[id])));
    button.firstElementChild.textContent = (active[id] ? '关闭' : '开启') + labels[id];
    document.querySelector(`[data-media-state="${id}"]`).textContent = busy ? '正在开启…' : active[id] ? '使用中' : '未开启';
    if (id === 'camera') {
      const video = document.querySelector('[data-local-camera]');
      video.srcObject = active.camera || null;
      video.hidden = !active.camera;
    }
  }

  function stop(id) {
    active[id]?.getTracks().forEach(track => track.stop());
    delete active[id];
    sync(id);
  }

  async function toggle(id) {
    if (active[id]) return stop(id);
    if (pending.has(id)) return;
    const request = revision;
    pending.add(id);
    sync(id);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: id === 'camera', audio: id === 'mic' });
      if (request !== revision) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      active[id] = stream;
      stream.getTracks().forEach(track => track.addEventListener('ended', () => {
        if (active[id] === stream) stop(id);
      }));
    } catch {
      if (request !== revision) return;
      pending.delete(id);
      sync(id);
      const state = document.querySelector(`[data-media-state="${id}"]`);
      if (state) state.textContent = '无法开启，请检查设备和浏览器权限。';
      return;
    }
    pending.delete(id);
    sync(id);
  }

  document.addEventListener('click', event => {
    const id = event.target.closest('[data-local-media]')?.dataset.localMedia;
    if (id) void toggle(id);
  });
  window.addEventListener('pagehide', () => {
    revision++;
    pending.clear();
    Object.keys(labels).forEach(stop);
  });

  return { panel, mount: () => Object.keys(labels).forEach(sync) };
})();

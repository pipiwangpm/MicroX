window.MicroXEnrollment = (() => {
  const key = 'microx-enrollment-review-v1';
  const activeKey = 'microx-enrollment-account-v1';
  const seeds = {
    users: [
      { id: 'MXU-1001', phone: '13800000001', created: '2026-11-10T01:10:00Z' },
      { id: 'MXU-1002', phone: '13800000002', created: '2026-11-10T02:30:00Z' }
    ],
    devices: [
      { sn: 'RD-260001', batch: 'RD-202611-A', added: '2026-11-10T01:00:00Z', owner: null, history: [] },
      { sn: 'RD-260002', batch: 'RD-202611-A', added: '2026-11-10T01:00:00Z', owner: 'MXU-1001',
        history: [{ type: 'App 认领', user: 'MXU-1001', at: '2026-11-10T01:15:00Z', actor: '用户本人', reason: '扫码接入' }] },
      { sn: 'RD-260003', batch: 'RD-202611-B', added: '2026-11-10T03:00:00Z', owner: null, history: [] }
    ]
  };

  function read() {
    return JSON.parse(localStorage.getItem(key)) ?? JSON.parse(JSON.stringify(seeds));
  }

  function save(data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  const current = () => read().users.find(user => user.id === sessionStorage.getItem(activeKey));
  const owned = () => {
    const user = current();
    return user && read().devices.find(device => device.owner === user.id);
  };
  const mask = phone => phone ? phone.slice(0, 3) + '****' + phone.slice(-4) : '—';
  const now = () => new Date().toISOString();

  function session(user, resetMobile = true) {
    sessionStorage.setItem(activeKey, user.id);
    if (resetMobile) localStorage.removeItem('microx-v2-mobile');
  }

  function signOut() {
    sessionStorage.removeItem(activeKey);
    localStorage.removeItem('microx-v2-mobile');
  }

  function register(phone) {
    const data = read();
    if (data.users.some(user => user.phone === phone)) return null;
    const user = { id: 'MXU-' + (1001 + data.users.length), phone, created: now() };
    data.users.unshift(user);
    save(data);
    return user;
  }

  function demoAccount(action) {
    const phone = action === 'register' ? '13900001111' : '13800000002';
    return read().users.find(user => user.phone === phone) || register(phone);
  }

  function check(sn, data = read()) {
    const user = current();
    const device = data.devices.find(item => item.sn === sn);
    if (!user) return { error: '请先登录 RaydiculousX 账号。' };
    if (!device) return { error: '这台机器人尚未入库，请联系客服确认设备信息。' };
    if (device.owner && device.owner !== user.id) {
      const previous = data.users.find(item => item.id === device.owner);
      return { error: '这台机器人已绑定账号 ' + mask(previous?.phone) + '，请联系原绑定人解绑后再试。', conflict: true };
    }
    if (data.devices.some(item => item.owner === user.id && item.sn !== sn)) {
      return { error: '当前账号已绑定一台 RayDino，请先在设备管理中解绑。' };
    }
    return { device, user };
  }

  function claim(sn, method) {
    const data = read();
    const result = check(sn, data);
    if (result.error) return result;
    if (!result.device.owner) {
      result.device.owner = result.user.id;
      result.device.history.unshift({ type: 'App 认领', user: result.user.id, at: now(), actor: '用户本人', reason: method });
      save(data);
    }
    const mobile = JSON.parse(localStorage.getItem('microx-v2-mobile') || '{}');
    localStorage.setItem('microx-v2-mobile', JSON.stringify({ ...mobile, connected: true, sleeping: false, running: null }));
    return result;
  }

  function release(sn, expectedOwner, source, reason) {
    const data = read();
    const device = data.devices.find(item => item.sn === sn);
    if (!expectedOwner || device?.owner !== expectedOwner) return '绑定关系已变化，请刷新后重试。';
    if (source === 'app' && current()?.id !== expectedOwner) return '请由当前绑定账号操作。';
    device.history.unshift({ type: source === 'admin' ? '后台代办解绑' : 'App 自助解绑', user: expectedOwner,
      at: now(), actor: source === 'admin' ? '平台运营（演示）' : '用户本人', reason });
    device.owner = null;
    save(data);
    return '';
  }

  return { key, read, current, owned, mask, session, signOut, demoAccount, check, claim, release };
})();

(() => {
  const store = MicroXEnrollment;
  const root = document.getElementById('app');
  const usersPage = params.get('view') === 'users';
  const id = params.get('id');
  const listUrl = usersPage ? '?view=users' : 'index.html';
  const heading = usersPage ? '用户管理' : '设备列表';
  const userUrl = id => '?view=users&id=' + encodeURIComponent(id);
  const deviceUrl = sn => '?id=' + encodeURIComponent(sn);
  const fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'short', hour12: false });
  const date = time => time ? fmt.format(new Date(time)) : '—';
  const link = (url, text) => `<a class="ops-link" href="${url}"><span>${esc(text)}</span></a>`;
  const button = (label, css = '', attributes = '') => `<button class="ops-button ${css}" ${attributes}><span>${label}</span></button>`;
  const chip = (label, css = '') => `<span class="ops-tag ${css}">${label}</span>`;
  const lines = { tangpa: '镋钯机器人', microx: 'RaydiculousX' };
  const networkLabels = { online: '在线', offline: '离线', unseen: '未上线' };
  const filterLabels = { '': '全部', bound: '已绑定', free: '未绑定' };
  const enterpriseDevices = [
    { sn: 'TP-DEMO-001', name: '展厅讲解机器人', tenant: '演示展厅', model: '镋钯基础版', network: 'online', battery: 76, fault: false },
    { sn: 'TP-DEMO-002', name: '工厂巡检机器人', tenant: '演示工厂', model: '镋钯基础版', network: 'offline', battery: null, fault: false },
    { sn: 'TP-DEMO-003', name: '园区接待机器人', tenant: '演示园区', model: '镋钯基础版', network: 'online', battery: 29, fault: true }
  ].map(device => ({ ...device, line: 'tangpa' }));
  const emptyFilters = () => ({ query: '', line: '', network: '', binding: '' });
  let filters = emptyFilters();
  let notice = '';

  function nav() {
    return `<aside class="ops-nav">
      <div class="ops-brand"><span class="ops-mark">${icon('robot')}</span><div><strong>镋钯管理平台</strong><small>成都人形 · 公司内部</small></div></div>
      <nav aria-label="后台菜单">
        <div class="ops-group">${icon('sliders')}<span>设备管理</span></div>
        <a href="index.html" ${!usersPage ? 'aria-current="page"' : ''}><span>设备列表</span></a>
        <div class="ops-group">${icon('user')}<span>RaydiculousX 业务</span></div>
        <a href="?view=users" ${usersPage ? 'aria-current="page"' : ''}><span>用户管理</span></a>
      </nav>
      <div class="ops-staff"><a href="../index.html"><span>返回原型总览</span>${icon('back')}</a></div>
    </aside>`;
  }

  function frame(content) {
    document.title = '镋钯管理平台 · ' + heading;
    const description = usersPage ? '查询 RaydiculousX App 注册账号及关联设备。' : '统一管理公司可接入平台的机器人，查看设备运行和归属。';
    root.innerHTML = `<div class="ops">${nav()}<div class="ops-workspace">
      <header class="ops-bar">
        <div class="ops-page-title"><h1>${heading}</h1><p>${description}</p></div>
        <div class="ops-identity"><div><strong>平台运营</strong><small>内部管理员 · 原型演示</small></div><span class="ops-avatar">运</span></div>
      </header>
      <main class="ops-main">${notice ? `<p role="status" class="ops-callout">${esc(notice)}</p>` : ''}${content}</main></div></div>`;
  }

  function table(headers, rows, empty = '暂无符合条件的记录。') {
    return `<div class="ops-table-wrap"><table class="ops-table"><thead><tr>${headers.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>
      <tbody>${rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('') :
        `<tr><td class="ops-empty" colspan="${headers.length}">${empty}</td></tr>`}</tbody></table></div>`;
  }

  const header = (title, sub, action = '') => `<header class="ops-head"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>${action}</header>`;
  const panel = (title, content, side = '') => `<section class="ops-card"><header class="ops-card-head"><h2>${title}</h2>${side}</header>${content}</section>`;
  const meta = fields => `<dl class="ops-meta">${fields.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;

  function selectField(label, field, values) {
    return `<label class="ops-field"><span>${label}</span><select name="${field}">
      ${Object.entries(values).map(([value, text]) => `<option value="${value}" ${filters[field] === value ? 'selected' : ''}>${text}</option>`).join('')}
    </select></label>`;
  }

  function filterForm() {
    return `<form class="ops-filter" id="ops-search">
      <label class="ops-field"><span>${usersPage ? '用户 ID / 注册手机号' : '设备名称 / SN'}</span>
        <input name="query" value="${esc(filters.query)}" placeholder="${usersPage ? '输入用户 ID 或手机号' : '输入设备名称或 SN'}" autocomplete="off"></label>
      ${usersPage ? selectField('绑定状态', 'binding', filterLabels) :
        selectField('产品线', 'line', { '': '全部产品线', ...lines }) +
        selectField('在线状态', 'network', { '': '全部状态', ...networkLabels })}
      ${button('查询', 'ops-search-button')}${button('重置', '', 'type="button" id="ops-reset"')}</form>`;
  }

  function userList(data) {
    const q = filters.query.toUpperCase();
    const result = data.users.map(user => ({ user, device: data.devices.find(device => device.owner === user.id) }))
      .filter(({ user, device }) => (user.id.includes(q) || user.phone.includes(q)) &&
        (!filters.binding || Boolean(device) === (filters.binding === 'bound')))
      .map(({ user, device }) => [link(userUrl(user.id), user.id), store.mask(user.phone), date(user.created),
        device ? link(deviceUrl(device.sn), device.sn) : '—', link(userUrl(user.id), '查看详情')]);
    return panel('注册用户', filterForm() +
      table(['用户 ID', '注册手机号', '注册时间', '绑定机器人', '操作'], result),
      `<span class="ops-count">共 ${result.length} 条</span>`);
  }

  const rayDinoTelemetrySamples = {
    'RD-260001': { network: 'online', battery: 82 },
    'RD-260002': { network: 'online', battery: 64 }
  };
  const microxDevice = device => ({
    ...device, line: 'microx', name: 'RayDino', model: 'RayDino',
    network: 'unseen', battery: null, fault: false, ...rayDinoTelemetrySamples[device.sn]
  });
  const networkBadge = device => chip(networkLabels[device.network], device.network === 'online' ? 'linked' : '');
  const showBattery = device => device.battery === null ? '—' : device.battery + '%';

  function summary(devices) {
    const stats = [
      ['设备总数', devices.length, 'robot', 'total'],
      ['当前在线', devices.filter(device => device.network === 'online').length, 'check', 'online'],
      ['离线数量', devices.filter(device => device.network === 'offline').length, 'signal', 'offline'],
      ['异常数量', devices.filter(device => device.fault).length, 'info', 'fault']
    ];
    return `<section class="ops-stats" aria-label="当前筛选设备统计">
      ${stats.map(([label, count, glyph, style]) => `<div class="ops-stat ${style}">
        <div><span>${label}</span><strong>${count}</strong></div><div class="ops-stat-icon">${icon(glyph)}</div>
      </div>`).join('')}
    </section>`;
  }

  function deviceCard(device) {
    const microx = device.line === 'microx';
    const picture = microx ? 'robot-x3-green.png' : 'tangpa-front.webp';
    return `<article class="ops-device">
      <div class="ops-device-header"><span class="ops-device-line">${lines[device.line]}</span><div>${networkBadge(device)}${device.fault ? chip('异常', 'danger') : ''}</div></div>
      <div class="ops-device-body">
        <div><h3>${esc(device.name)}</h3><p><span>型号</span> ${esc(device.model)}</p><p><span>SN</span> ${esc(device.sn)}</p></div>
        <img src="../assets/${picture}" alt="${esc(device.model)}">
      </div>
      <dl class="ops-device-facts">
        <div><dt>${microx ? '电量' : '所属租户'}</dt><dd>${microx ? showBattery(device) : esc(device.tenant)}</dd></div>
        <div><dt>${microx ? 'App 绑定' : '电量'}</dt><dd>${microx ? (device.owner ? '已绑定' : '待认领') : showBattery(device)}</dd></div>
      </dl>
      <a class="ops-device-open" href="${deviceUrl(device.sn)}">${icon('eye')}<span>查看详情</span></a>
    </article>`;
  }

  function deviceList(data) {
    const q = filters.query.toUpperCase();
    const all = [...data.devices.map(microxDevice), ...enterpriseDevices];
    const matches = all.filter(device => (!filters.line || device.line === filters.line) &&
      (!filters.network || device.network === filters.network) &&
      [device.sn, device.name, device.batch ?? ''].some(value => value.toUpperCase().includes(q)));
    return summary(matches) + filterForm() +
      `<div class="ops-list-tools"><span class="ops-count">共 ${matches.length} 台 · 未上线设备不计入离线</span>
        ${button('入库', 'ops-primary', 'type="button" aria-disabled="true"')}</div>
      ${matches.length ? `<section class="ops-device-grid" aria-label="设备列表">${matches.map(deviceCard).join('')}</section>` :
        '<div class="ops-card ops-empty">暂无符合条件的设备。</div>'}`;
  }

  function deviceDetail(data) {
    const device = data.devices.find(item => item.sn === id);
    if (!device) {
      const enterprise = enterpriseDevices.find(item => item.sn === id);
      if (!enterprise) return header('设备不存在', '请返回设备列表检查设备 SN。', link(listUrl, '返回设备列表'));
      return header(enterprise.name, '镋钯机器人 · 设备详情', link(listUrl, '返回设备列表')) +
        panel('设备信息', meta([['设备 SN', enterprise.sn], ['型号', enterprise.model], ['所属租户', enterprise.tenant],
          ['在线状态', networkBadge(enterprise)], ['异常状态', enterprise.fault ? chip('异常', 'danger') : '正常'], ['电量', showBattery(enterprise)]]));
    }
    const owner = data.users.find(item => item.id === device.owner);
    const bindTime = device.history.find(item => item.type === 'App 认领')?.at;
    const history = device.history.map(record => {
      const account = data.users.find(item => item.id === record.user);
      return [date(record.at), record.type, account ? link(userUrl(account.id), store.mask(account.phone)) : '—',
        esc(record.actor), esc(record.reason)];
    });
    return header(device.sn, 'RayDino · 设备档案', link(listUrl, '返回设备列表')) +
      panel('入库信息', meta([['设备 SN', esc(device.sn)], ['机型', 'RayDino'], ['产品线', lines.microx],
        ['入库批次', esc(device.batch)], ['入库时间', date(device.added)], ['在线状态', networkBadge(microxDevice(device))], ['电量', showBattery(microxDevice(device))]])) +
      panel('当前绑定', meta([['绑定状态', chip(owner ? '已绑定' : '未绑定', owner ? 'linked' : '')],
        ['绑定账号', owner ? link(userUrl(owner.id), store.mask(owner.phone)) : '—'], ['绑定时间', owner ? date(bindTime) : '—']]),
      owner ? button('代办解绑', 'ops-danger', 'id="proxy-release"') : '') +
      panel('绑定历史', table(['操作时间', '操作', '关联账号', '操作人', '原因 / 接入方式'], history, '这台机器人还没有绑定记录。'));
  }

  function userDetail(data) {
    const user = data.users.find(item => item.id === id);
    if (!user) return header('用户不存在', '请返回用户列表检查用户 ID。', link(listUrl, '返回列表'));
    const device = data.devices.find(item => item.owner === user.id);
    return header(user.id, 'RaydiculousX App · C 端账号', link(listUrl, '返回用户列表')) +
      panel('账号信息', meta([['用户 ID', user.id], ['注册手机号', store.mask(user.phone)],
        ['注册时间', date(user.created)]])) +
      panel('当前绑定机器人', table(['设备 SN', '机型', '绑定状态', '绑定时间'], device ?
        [[link(deviceUrl(device.sn), device.sn), 'RayDino', chip('已绑定', 'linked'),
          date(device.history.find(item => item.type === 'App 认领')?.at)]] : [], '该账号还没有绑定机器人。'));
  }

  function render() {
    const data = store.read();
    frame(usersPage ? (id ? userDetail(data) : userList(data)) : (id ? deviceDetail(data) : deviceList(data)));
  }

  function dialog(title, body, submit, action, danger = false) {
    const element = document.createElement('dialog');
    element.className = 'ops-dialog';
    element.setAttribute('aria-labelledby', 'ops-dialog-title');
    element.innerHTML = `<form novalidate><h2 id="ops-dialog-title">${title}</h2>${body}
      <p class="ops-error" role="alert"></p><div class="ops-actions">
        ${button('取消', '', 'type="button" data-ops-close')}${button(submit, danger ? 'ops-danger-fill' : 'ops-primary')}
      </div></form>`;
    root.append(element);
    element.querySelector('[data-ops-close]').onclick = () => element.close();
    element.addEventListener('close', () => element.remove());
    element.addEventListener('input', () => {
      element.querySelector('.ops-error').textContent = '';
    });
    element.querySelector('form').onsubmit = event => {
      event.preventDefault();
      const error = action(new FormData(event.currentTarget));
      if (error) {
        element.querySelector('.ops-error').textContent = error;
        return;
      }
      element.close();
      render();
    };
    element.showModal();
  }

  function proxyRelease() {
    const data = store.read();
    const device = data.devices.find(item => item.sn === id);
    const owner = data.users.find(user => user.id === device?.owner);
    if (!owner) return render();
    dialog('代办解除绑定', `<p>设备 <strong>${esc(device.sn)}</strong> · 绑定账号 <strong>${store.mask(owner.phone)}</strong></p>
      <p class="ops-muted">确认已核验申请。解绑后，原账号将失去设备访问和控制权限，其他账号可重新认领。</p>
      <label class="ops-field"><span>代办原因（必填）</span><textarea name="reason" rows="3" maxlength="200" autofocus></textarea></label>`,
    '确认解绑', fields => {
      const reason = fields.get('reason').trim();
      if (!reason) return '请填写代办原因。';
      const error = store.release(device.sn, owner.id, 'admin', reason);
      if (error) return error;
      notice = '已代办解绑。原账号访问权限已回收。';
      return '';
    }, true);
  }

  function applyFilters(form) {
    const fields = new FormData(form);
    filters = { ...emptyFilters(), ...Object.fromEntries(fields), query: fields.get('query').trim() };
    render();
  }

  root.addEventListener('change', event => {
    if (event.target.matches('#ops-search select')) {
      const name = event.target.name;
      applyFilters(event.target.form);
      root.querySelector(`select[name="${name}"]`)?.focus();
    }
  });

  root.addEventListener('submit', event => {
    if (event.target.id !== 'ops-search') return;
    event.preventDefault();
    applyFilters(event.target);
  });

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.id === 'ops-reset') {
      filters = emptyFilters();
      notice = '';
      render();
    }
    if (button?.id === 'proxy-release') proxyRelease();
  });

  window.addEventListener('storage', event => {
    if (event.key === store.key && !root.querySelector('dialog[open]') && !root.querySelector('#ops-search :focus')) render();
  });
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  render();
})();

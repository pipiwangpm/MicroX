const robotPlayStorage = 'microx-v2-mobile';

function installRobotPlay(id, name, refresh, storageKey = robotPlayStorage) {
  const device = readStore(storageKey, {installed: []});
  if (!device.connected) {
    connectionDialog(false, connected => {
      const current = readStore(storageKey, {});
      writeStore(storageKey, {...current, connected, sleeping: false});
      refresh();
    }, () => installRobotPlay(id, name, refresh, storageKey));
    return;
  }
  if (device.installed.includes(id)) {
    refresh();
    return;
  }
  confirmDialog('安装到小恐龙', '小恐龙将下载并安装「' + esc(name) + '」。安装完成后即可启动。', '确认安装', () => {
    modal('<h2 id="dialog-title">正在安装</h2><p role="status">小恐龙正在下载并安装玩法…</p><progress aria-label="安装进度"></progress>');
    const progressDialog = document.querySelector('.modal-wrap');
    setTimeout(() => {
      if (!progressDialog.isConnected) return;
      const current = readStore(storageKey, {installed: []});
      closeModal();
      if (!current.connected) {
        toast('机器人已断开，请连接后重试');
        return;
      }
      current.installed = [...new Set([...current.installed, id])];
      writeStore(storageKey, current);
      refresh();
      toast('已安装到小恐龙');
    }, 950);
  });
}

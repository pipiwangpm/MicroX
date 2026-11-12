(() => {
  const store = MicroXEnrollment;
  const account = store.current();
  const page = document.body.dataset.page;
  const device = store.owned();
  const connected = JSON.parse(localStorage.getItem('microx-v2-mobile') || '{}').connected;
  let entry = '';
  if (!account) entry = 'account.html';
  else if (page !== 'my' && (!device || (!connected && page !== 'device'))) entry = 'bind.html';
  if (entry) {
    document.documentElement.style.visibility = 'hidden';
    location.replace(entry);
    return;
  }

  if (device) {
    const verify = () => {
      if (store.owned()?.sn === device.sn) return;
      localStorage.removeItem('microx-v2-mobile');
      location.replace('bind.html?revoked=1');
    };
    window.addEventListener('storage', event => { if (event.key === store.key) verify(); });
    window.addEventListener('pageshow', verify);
  }
  if (page === 'my' && !device) {
    localStorage.removeItem('microx-v2-mobile');
  }
})();

window.ControlSession = (() => {
  const loginKey = 'raydiculousx-web-user';
  const modeKey = 'microx-work-mode';
  const connectionKey = 'raydiculousx-web-connected';
  const get = key => sessionStorage.getItem(key);

  function login() {
    sessionStorage.setItem(loginKey, 'web-user');
    reset();
  }

  function reset() {
    sessionStorage.removeItem(modeKey);
    sessionStorage.removeItem(connectionKey);
  }

  function select(mode) {
    sessionStorage.setItem(modeKey, mode);
    if (mode === 'real') sessionStorage.setItem(connectionKey, 'yes');
    else sessionStorage.removeItem(connectionKey);
  }

  function logout() {
    sessionStorage.removeItem(loginKey);
    reset();
    location.replace('start.html');
  }

  return {
    signedIn: () => Boolean(get(loginKey)),
    mode: () => get(modeKey),
    connected: () => get(connectionKey) === 'yes',
    disconnect: () => sessionStorage.removeItem(connectionKey),
    login, select, logout
  };
})();

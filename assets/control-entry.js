const entry = document.getElementById('entry');
const session = ControlSession;
const btn = (label, action, color = '') => `<button type="button" class="btn ${color}" data-act="${action}"><span>${label}</span></button>`;
function loginPage() {
 return `<section class="entry-login connect-panel"><span class="entry-caption">RaydiculousX Web</span><h1>登录开发者 Web</h1><form id="web-login"><label for="web-phone">手机号（+86）</label><input id="web-phone" type="tel" placeholder="请输入手机号" readonly><label for="web-code">短信验证码</label><div class="entry-login-code"><input id="web-code" placeholder="请输入验证码" readonly><button type="button" class="btn" disabled><span>获取验证码</span></button></div><button type="submit" class="btn orange"><span>登录</span></button></form></section>`;
}
function modePage() {
 return `<div class="entry-intro"><h1>选择调试方式</h1></div><div class="entry-options"><article><div class="entry-art physical"><img src="../assets/robot-x3-green.png" alt="实体 RayDino"><span>REAL ROBOT</span></div><div class="entry-card"><h2>实机调试</h2><p>通过蓝牙连接机器人，为机器人配置 Wi-Fi。</p>${btn('进入实机调试','real','orange')}</div></article><article><div class="entry-art virtual"><div class="entry-grid"></div><img src="../assets/robot-x3-green.png" alt="虚拟 RayDino"><span>SIMULATOR</span></div><div class="entry-card"><h2>模拟器</h2><p>在同一个场景中控制虚拟机器人、体验玩法。</p>${btn('进入模拟器','simulation')}</div></article></div>`;
}
function render(){entry.innerHTML=session.signedIn()?modePage():loginPage()}
entry.addEventListener('submit',event=>{if(event.target.id!=='web-login')return;event.preventDefault();session.login();render()});
document.addEventListener('click',event=>{if(!session.signedIn())return;const action=event.target.closest('[data-act]')?.dataset.act;if(action==='real'){session.disconnect();location.href='workbench.html?view=connection&fresh=1'}else if(action==='simulation'){session.select('simulation');location.href='simulator.html'}});
render();
window.addEventListener('pageshow',event=>{if(event.persisted)render()});

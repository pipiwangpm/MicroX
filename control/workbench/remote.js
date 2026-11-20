'use strict';
function rcHardware(id,op){if(!engGuard())return;const item=hardware.find(h=>h[0]===id);if(!item)return;const labels={record:'录音',play:id==='mic'?'回放':'播放',open:'打开',close:'关闭',read:'读取',off:'关闭',low:'低挡',mid:'中挡',high:'高挡',red:'红色',green:'绿色',blue:'蓝色',white:'白色'};log(`${item[1]}：${labels[op]}指令已下发`);s.hw[id]={command:op,label:labels[op],accepted:true,time:now()};hwPending=null;actPending=null;startJob(item[1]+' · '+labels[op],900,()=>{log(`${item[1]}：${labels[op]}指令已受理`);toast('指令已下发')})}
function rcAction(name){if(!engGuard())return;const move=['前进','后退','向左横移','向右横移','左转','右转'].includes(name);const p=engState().params;log(`${name}指令已下发${move?'，持续 '+p.secs+' s':''}`);s.acts[name]={command:name,...(name==='坐下/起立'?{skill:'sit_toggle'}:{}),accepted:true,time:now()};engState().body=move?'运动中':name;actPending=null;hwPending=null;startJob(name,move?p.secs*1000:900,()=>{engState().body='待机';log(move?`${name}定时结束，零速度指令已下发`:`${name}指令已受理`)} )}
handlers.rcStop=function(){if(!connected)return;cancelJob('遥控停止');engState().body='待机';log('遥控停止：零速度指令已下发');render()};
runHw=function(id){rcHardware(id,({mic:'record',speaker:'play',camera:'open',tof:'read',fan:'low',led:'red'})[id])};
runAct=rcAction;
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.rcHw)rcHardware(b.dataset.rcHw,b.dataset.rcOp);if(b.dataset.rcAction)rcAction(b.dataset.rcAction)});
const rcKeys=Object.fromEntries(Object.entries(rcShortcuts).map(([action,[label,code]])=>[code,action]));
Object.assign(rcKeys,{ArrowUp:'前进',ArrowDown:'后退',ArrowLeft:'左转',ArrowRight:'右转'});
const rcMovement=['前进','后退','向左横移','向右横移','左转','右转'];
let rcHeld=null;
function rcKeyTarget(e){return (typeof setupScreen!=='undefined'&&setupScreen!=='control')||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.target.isContentEditable||e.isComposing||e.ctrlKey||e.altKey||e.metaKey||document.querySelector('#modal-root')?.children.length}
document.addEventListener('keydown',e=>{if(rcKeyTarget(e))return;if(e.code==='Space'){if(!connected||e.repeat)return;e.preventDefault();rcHeld=null;handlers.rcStop();return}const command=rcKeys[e.code];if(!command)return;e.preventDefault();if(e.repeat||!ready())return;if(rcMovement.includes(command))rcHeld=e.code;rcAction(command);document.querySelector(`[data-rc-action="${command}"]`)?.classList.add('is-keydown')});
document.addEventListener('keyup',e=>{const command=rcKeys[e.code];if(command)document.querySelector(`[data-rc-action="${command}"]`)?.classList.remove('is-keydown');if(rcHeld===e.code){rcHeld=null;if(engState().body==='运动中')handlers.rcStop()}});
window.addEventListener('blur',()=>{if(rcHeld){rcHeld=null;handlers.rcStop()}});

workbenchRender();

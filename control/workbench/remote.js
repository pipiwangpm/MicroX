'use strict';
const rcProtocol=window.RayDinoRemote;
let rcRendering=false,rcLastVector='';
function rcAvailable(){return ready()&&(typeof setupScreen==='undefined'||setupScreen==='control')&&!$('#modal-root')?.children.length}
const rcController=new rcProtocol.Controller({
 available:rcAvailable,
 onChange(kind){if(kind==='input')rcProtocol.paint(rcController,document);else if(!rcRendering)render()},
 onSpeed(speed){engState().params.speed=speed;const field=$('#eng-speed');if(field)field.value=String(speed);save()},
 onCommand(command){
  if(!connected)return;
  const moving=command.type==='motion'&&(command.vx||command.vy||command.yaw);
  if(command.type==='action'){engState().body=command.label;s.acts[command.label]={command:command.action,target:command.target,accepted:true,time:now()};log(command.label+'指令已下发')}
  if(command.type==='complete'){engState().body='待机';log(rcProtocol.labels[command.action]+'已完成')}
  if(command.type==='motion'){const next=JSON.stringify(command);if(next!==rcLastVector){rcLastVector=next;engState().body=moving?'运动中':'待机';log(moving?'行走控制：vx='+command.vx.toFixed(2)+'，vy='+command.vy.toFixed(2)+'，转向='+command.yaw.toFixed(2):'行走输入已停止')}}
  if(command.type==='pose')s.acts['躯干控制']={...command,time:now()};
  if(command.type==='stop'){engState().body='待机';save()}
  if(command.type==='mode')log('切换为'+(command.mode==='walk'?'行走':'躯干')+'模式');
 }
});
wbMotion=function(){rcController.state.speed=engState().params.speed;rcController.state.turn=engState().params.turn;return rcProtocol.render(rcController)};
const rcBaseRender=workbenchRender;
workbenchRender=function(){rcRendering=true;try{if(!connected)rcController.reset();else if(!rcAvailable()&&(rcController.inputs.size||rcController.state.busy))rcController.stop(false);rcBaseRender()}finally{rcRendering=false}};
handlers.rcStop=()=>rcController.stop();
const rcBaseStop=handlers.stop;handlers.stop=()=>{rcController.stop(false);if(typeof setupScreen!=='undefined'&&setupScreen==='control'&&!busy){render();return}rcBaseStop()};
rcProtocol.bind({document,window,controller:rcController,active:()=>typeof setupScreen==='undefined'||setupScreen==='control',blocked:()=>!!$('#modal-root')?.children.length});
function rcHardware(id,op){if(!engGuard())return;rcController.stop(false);const item=hardware.find(h=>h[0]===id);if(!item)return;const labels={record:'录音',play:id==='mic'?'回放':'播放',open:'打开',close:'关闭',read:'读取',off:'关闭',low:'低挡',mid:'中挡',high:'高挡',red:'红色',green:'绿色',blue:'蓝色',white:'白色'};log(`${item[1]}：${labels[op]}指令已下发`);s.hw[id]={command:op,label:labels[op],accepted:true,time:now()};hwPending=null;actPending=null;startJob(item[1]+' · '+labels[op],900,()=>{log(`${item[1]}：${labels[op]}指令已受理`);toast('指令已下发')})}
runHw=function(id){rcHardware(id,({mic:'record',speaker:'play',camera:'open',tof:'read',fan:'low',led:'red'})[id])};
function rcAction(name){const id=Object.entries(rcProtocol.labels).find(([,label])=>label===name)?.[0];if(id)return rcController.action(id);return false}
runAct=rcAction;
document.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&!button.disabled&&button.dataset.rcHw)rcHardware(button.dataset.rcHw,button.dataset.rcOp)});
window.addEventListener('pagehide',()=>rcController.reset());
workbenchRender();

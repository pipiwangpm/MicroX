let simulatorRemote=null;
function installRayDinoSimulator(){
 if(!isPlaySimulation())return;
 const protocol=window.RayDinoRemote;
 window.RayDinoRemoteActive=true;
 const sync=()=>{
  const state=simulatorRemote.state;
  Object.assign(simRobot,{posture:state.posture,bent:state.bent,mouthClosed:state.mouthClosed,headYaw:state.headYaw,headPitch:state.headPitch,bodyYaw:state.bodyYaw});
  if(!state.busy)simRobot.action='';
  drawPlaySimulation();
 };
 simulatorRemote=new protocol.Controller({
  available:()=>true,blocked:()=>simSession.running,
  onChange(kind){sync();if(kind==='input')protocol.paint(simulatorRemote,document);else pcRender()},
  onCommand(command){
   if(command.type==='action'){
    if(command.action==='recover'||command.action==='init')Object.assign(simSession,{running:false,light:'',phone:false});
    const action=command.action==='sit'?command.target:command.action;
    Object.assign(simRobot,{action,actionStart:performance.now(),actionDuration:command.duration});
    simSession.events.unshift({time:new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}),message:command.label+'指令已下发'});
   }
   if(command.type==='motion'){
    const dt=.05,angle=simRobot.heading*Math.PI/180;
    simRobot.heading+=command.yaw*dt*180/Math.PI;
    simRobot.x=Math.max(-.24,Math.min(.24,simRobot.x+(command.vx*Math.sin(angle)+command.vy*Math.cos(angle))*dt/3));
    simRobot.y=Math.max(-.19,Math.min(.19,simRobot.y+(-command.vx*Math.cos(angle)+command.vy*Math.sin(angle))*dt/3));
    simDriveDirection=command.vx||command.vy||command.yaw?'remote':'';
   }
   if(command.type==='stop'){simRobot.action='';simDriveDirection='';Object.assign(simSession,{running:false,light:'',phone:false})}
   simSession.events=simSession.events.slice(0,20);
  }
 });
 renderDrivePanel=()=>protocol.render(simulatorRemote);
 simPosturePanel=()=>'';
 const previousDisabled=simDriveDisabled;
 simDriveDisabled=()=>isPlaySimulation()?(simSession.running||!!simulatorRemote.state.busy||simulatorRemote.state.posture==='sitting'):previousDisabled();
 protocol.bind({document,window,controller:simulatorRemote,active:()=>simFloatingPanel==='controls'});
 document.addEventListener('arena-reset',()=>{simulatorRemote.reset();sync();pcRender()});
}

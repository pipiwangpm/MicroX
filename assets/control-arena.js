import * as THREE from './vendor/three.module.min.js';

function createRobot() {
  const root = new THREE.Group();
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: .66 });
  const green = material(0x679b47);
  const pale = material(0x89b65d);
  const dark = material(0x272d29);
  const orange = material(0xe77a25);
  const cream = material(0xdcd4b5);
  const lens = material(0xffd85c);

  function box(parent, size, position, surface, bevel = .035) {
    const [width, height, depth] = size;
    const x = width / 2 - bevel;
    const y = height / 2 - bevel;
    const shape = new THREE.Shape();
    shape.moveTo(-x, -y);
    shape.lineTo(x, -y);
    shape.lineTo(x, y);
    shape.lineTo(-x, y);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1
    });
    geometry.translate(0, 0, bevel - depth / 2);
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  function disk(parent, radius, length, position, surface) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 32), surface);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(...position);
    parent.add(mesh);
  }

  const body = new THREE.Group();
  root.add(body);
  box(body, [.65, .27, .81], [0, .15, .05], green);
  box(body, [.51, .21, .54], [0, .35, .08], dark);
  box(body, [.35, .14, .36], [0, .22, .56], green).rotation.x = -.29;
  box(body, [.21, .51, .2], [0, .46, -.23], dark);

  const head = new THREE.Group();
  head.position.set(0, .75, -.26);
  body.add(head);
  box(head, [.61, .38, .74], [0, .14, -.13], green, .065);
  const jaw=new THREE.Group();
  jaw.position.set(0,-.05,.1);head.add(jaw);
  box(jaw, [.56, .15, .65], [0, 0, -.26], pale);
  box(head, [.43, .032, .59], [0, .015, -.16], dark, .009);
  box(head, [.23, .05, .19], [0, .34, -.06], orange, .012);
  box(head, [.18, .05, .023], [0, .19, -.503], dark, .007);
  for (const side of [-1, 1]) {
    disk(head, .127, .035, [side * .309, .19, .026], dark);
    disk(head, .088, .025, [side * .335, .19, .026], lens);
    disk(head, .068, .021, [side * .35, .19, .026], dark);
    disk(head, .067, .026, [side * .291, -.045, .087], cream);
  }

  const legs = [-1, 1].map(side => {
    const hip = new THREE.Group();
    const knee = new THREE.Group();
    const foot = new THREE.Group();
    hip.position.set(side * .29, 0, .11);
    knee.position.y = -.36;
    foot.position.y = -.34;
    body.add(hip);
    hip.add(knee);
    knee.add(foot);
    box(hip, [.23, .36, .22], [0, -.13, 0], dark);
    box(hip, [.16, .27, .26], [side * .09, -.14, 0], green);
    disk(knee, .103, .22, [0, 0, 0], dark);
    box(knee, [.15, .28, .16], [0, -.17, 0], dark);
    box(foot, [.25, .10, .36], [0, -.014, -.07], green);
    box(foot, [.26, .045, .39], [0, -.077, -.07], orange, .012);
    return { hip, knee, foot };
  });
  return { root, body, head, legs, jaw };
}

function createArena() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17211e);
  scene.fog = new THREE.Fog(0x17211e, 11, 23);
  scene.add(new THREE.HemisphereLight(0xf4f3e1, 0x4b6654, 2.1));
  const sun = new THREE.DirectionalLight(0xffe8ca, 2.35);
  sun.position.set(-4, 7, -4);
  scene.add(sun);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x25342e, roughness: .96 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.01;
  scene.add(floor, new THREE.GridHelper(36, 72, 0x678173, 0x40594c));
  const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    [[-3.4,-3.4],[3.4,-3.4],[3.4,3.4],[-3.4,3.4]].map(([x,z]) => new THREE.Vector3(x,.01,z))
  ), new THREE.LineBasicMaterial({ color: 0xd09a57 }));
  scene.add(border);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.43, 36),
    new THREE.MeshBasicMaterial({ color: 0x0b120e, transparent: true, opacity: .46, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);
  const light = new THREE.Mesh(new THREE.CircleGeometry(.14, 32), new THREE.MeshBasicMaterial({ color: 0xffcb62 }));
  light.rotation.x = -Math.PI / 2;
  light.position.y = .018;
  scene.add(light);
  const robot = createRobot();
  scene.add(robot.root);

  const camera = new THREE.PerspectiveCamera(37, 1, .05, 45);
  const center = new THREE.Vector3();
  const homeView = { yaw: .83, pitch: .38, zoom: 5.3 };
  const orbit = { ...homeView, follow: true };
  const prop=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.18),new THREE.MeshStandardMaterial({color:0xf3c76b,roughness:.6}));
  scene.add(prop);
  const gripPoint=new THREE.Vector3();
  let stage;
  let controls;
  let drag;
  let frame;
  let state = { x: 0, y: 0, heading: 0, posture: 'standing', moving: '', light: '' };

  function size() {
    const width = stage?.clientWidth || 1;
    const height = stage?.clientHeight || 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  const observer = new ResizeObserver(size);

  function draw(time) {
    const { x, y, heading, posture, moving } = state;
    robot.root.position.x += (x * 13 - robot.root.position.x) * .2;
    robot.root.position.z += (y * 15 - robot.root.position.z) * .2;
    robot.root.rotation.y = -THREE.MathUtils.degToRad(heading);
    shadow.position.set(robot.root.position.x, .009, robot.root.position.z);
    const action=state.action||'';
    const durations={sitting:1200,standing:1200,kick:1200,roll:2200,pick:2600};
    const progress=action?THREE.MathUtils.clamp((performance.now()-state.actionStart)/durations[action],0,1):0;
    const ease=t=>t*t*(3-2*t);
    let crouch=posture==='sitting'?1:0;
    if(action==='sitting')crouch=ease(progress);
    if(action==='standing')crouch=1-ease(progress);
    if(action==='pick')crouch=Math.sin(Math.PI*progress)*.95;
    const swing=moving?Math.sin(time/95)*.28:0;
    const kick=action==='kick'?Math.sin(Math.PI*progress)**2:0;
    const roll=action==='roll'?ease(progress):0;
    const tucked=action==='roll'?Math.sin(Math.PI*progress):crouch;
    const height=action==='roll'?.81+Math.sin(Math.PI*progress)*1.05:.81-crouch*.32+Math.abs(swing)*.03;
    robot.body.position.y+=(height-robot.body.position.y)*.16;
    // Rotate the articulated body around its center, then return to standing.
    robot.body.rotation.x=-roll*Math.PI*2;
    robot.head.rotation.x+=((-crouch*.35)-robot.head.rotation.x)*.17;
    robot.jaw.rotation.x=action==='pick'?Math.sin(Math.PI*progress)*-.38:0;
    robot.legs.forEach(({ hip, knee, foot }, index)=>{
      const legKick=index===0?kick:0;
      hip.rotation.x+=((-tucked*.95+swing*(index?-1:1)+legKick*1.2)-hip.rotation.x)*.2;
      knee.rotation.x+=((tucked*1.77+Math.abs(swing)*.55+legKick*.28)-knee.rotation.x)*.2;
      foot.rotation.x=-hip.rotation.x-knee.rotation.x;
    });
    const gripping=action==='pick'?(state.holding?progress<.5:progress>.5):state.holding;
    prop.visible=Boolean(state.holding||action==='pick');
    if(gripping){
      robot.head.updateWorldMatrix(true,false);
      gripPoint.set(0,-.12,-.56).applyMatrix4(robot.head.matrixWorld);
      prop.position.copy(gripPoint);
    }else{
      gripPoint.set(0,.1,-.9).applyAxisAngle(new THREE.Vector3(0,1,0),robot.root.rotation.y);
      prop.position.copy(gripPoint).add(robot.root.position);
    }
    light.visible = Boolean(state.light);
    light.position.set(state.light === 'left' ? -2.15 : 2.15, .018, -.2);

    center.x += ((orbit.follow ? robot.root.position.x : 0) - center.x) * .13;
    center.z += ((orbit.follow ? robot.root.position.z : 0) - center.z) * .13;
    center.y = .76;
    const distance = orbit.zoom * Math.cos(orbit.pitch);
    camera.position.set(center.x + distance * Math.sin(orbit.yaw), center.y + orbit.zoom * Math.sin(orbit.pitch),
      center.z - distance * Math.cos(orbit.yaw));
    camera.lookAt(center);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  }

  function syncFollow() {
    controls?.querySelector('[data-arena-follow]').setAttribute('aria-pressed', String(orbit.follow));
  }

  function resetCamera() {
    Object.assign(orbit, homeView, { follow: true });
    syncFollow();
  }

  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    orbit.yaw -= (event.clientX - drag.x) * .009;
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch + (event.clientY - drag.y) * .008, .16, 1.23);
    orbit.follow = false;
    drag.x = event.clientX;
    drag.y = event.clientY;
    syncFollow();
  });
  renderer.domElement.addEventListener('lostpointercapture', () => { drag = null; });
  renderer.domElement.addEventListener('wheel', event => {
    event.preventDefault();
    orbit.zoom = THREE.MathUtils.clamp(orbit.zoom * Math.exp(event.deltaY * .001), 2.8, 11);
  }, { passive: false });

  function mount(nextStage) {
    if (nextStage === stage) return;
    observer.disconnect();
    stage = nextStage;
    stage.classList.add('sim-arena');
    stage.innerHTML = `<div class="arena-toolbar" role="group" aria-label="仿真视角">
      <button type="button" data-arena-follow aria-pressed="true">跟随视角</button>
      <button type="button" data-arena-reset>重置场地</button>
    </div>`;
    controls = stage.querySelector('.arena-toolbar');
    controls.querySelector('[data-arena-follow]').onclick = () => {
      orbit.follow = !orbit.follow;
      syncFollow();
    };
    controls.querySelector('[data-arena-reset]').onclick = () => {
      resetCamera();
      stage.dispatchEvent(new Event('arena-reset', { bubbles: true }));
    };
    stage.append(renderer.domElement);
    syncFollow();
    observer.observe(stage);
    size();
  }

  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', event => {
    if (event.persisted) frame = requestAnimationFrame(draw);
  });
  frame = requestAnimationFrame(draw);
  return { mount, update: value => { state = value; } };
}

try {
  if (isPlaySimulation() && document.querySelector('.workspace-preview .viewport')) {
    window.controlArena = createArena();
    drawPlaySimulation();
  }
} catch (error) {
  console.warn('三维场地不可用', error);
}

# RaydiculousX 产品原型

[在线总览](https://pipiwangpm.github.io/MicroX/) · [官网和玩法广场](https://pipiwangpm.github.io/MicroX/website/) · [开发者 Web](https://pipiwangpm.github.io/MicroX/control/start.html) · [App](https://pipiwangpm.github.io/MicroX/mobile/account.html) · [管理后台](https://pipiwangpm.github.io/MicroX/admin/)

- 官网与 App 展示动作轮盘、光斑追踪和专注搭子。开发者 Web 提供动作轮盘、可安装玩法、仿真调试和无视频的键盘手动控制。
- 开发者 Web 登录后可选择实机或仿真。实机通过 USB／局域网连接，提供语音交互和玩法安装。仿真器同页提供虚拟 RayDino 的前进、后退、转向、坐下／起立、踢腿、前滚翻、蹲下夹东西和放下物品，以及玩法仿真和电脑摄像头／麦克风调试。
- 管理后台可筛选设备产品线、查看在线状态和绑定关系，以及在设备详情演示代办解绑。「入库」是统一入口占位。

这是公开的静态演示。登录、设备连接、实机操作和后台数据均为浏览器中的模拟流程。仿真调试设备通过浏览器权限调用本机摄像头和麦克风。浏览器扫码可以识别[样例二维码](demo/raydino-pairing.png)。

三维仿真场地参考 [Microduck Simulator](https://huggingface.co/spaces/pollen-robotics/microduck-simulator) 的场景和操控组织。拖动场地旋转视角，滚轮缩放，C 切换跟随视角，R 站起或坐下，WASD／方向键控制移动，空格停止。工具栏可重置场地。

RayDino 使用按产品外观搭建的简化三维关节模型，展示步态、姿态和玩法交互。后续可接入实际关节模型、物理参数和控制策略。场景渲染使用 Three.js，许可见 assets/vendor/three-LICENSE.txt。

App 浅色横屏遥控器和 Web 手动控制均提供身体动作入口。坐下时需先起立再移动，动作执行期间与移动和玩法启动互锁，停止按钮取消待完成动作。三维仿真展示踢腿、前滚翻和蹲下夹取物品的关节动画；这些为原型动画，不代表物理仿真或真实机器人已接入。


## Developer debugging flow (2026-11-20)

After login, choose **real-device debugging** or the **simulator**. Real-device debugging starts with Bluetooth pairing and Wi-Fi provisioning. Only a successful network connection exposes the three real-device sections: calibration, engineering maintenance, and plays.

- `control/start.html`: login and mode selection.
- `control/workbench.html`: onboarding when offline; calibration and remote control when online.
- `control/workbench.html?view=maintenance`: device name, network reprovisioning, CSV, OTA / firmware, logs, and records.
- `control/apps.html`: install and run real-device plays using the same connection.
- `control/simulator.html`: one 3D scene with floating control, play, device, and log panels. Older simulation home/controller/play/device links redirect here.

Real-device navigation contains only calibration, engineering maintenance, and plays. The former home, controller, and device-setting pages redirect into these sections. Top-level production actions (next robot, export, logout) are removed from the developer flow. Login never skips mode selection.

Wi-Fi passwords are never persisted or logged. Calibration records are isolated from the standalone prototype. Bluetooth, network provisioning, telemetry, commands, SN, and firmware operations use demonstration data; real hardware protocols are not connected. The camera modal shows an illustrative first-person scene. Joint IDs 1-15 are fixed prototype numbers pending actual bus mapping.

The workbench lives in `control/workbench/`. Shared navigation and floating-panel adaptation are in `assets/control-flow.js` and `assets/control-flow.css`; onboarding and host connection state are bridged in `control/workbench/platform.js`.


## Shared remote interaction rules

Both debugging modes use `assets/raydino-remote.js` for state, input handling, and UI. Initialize before ordinary remote commands. Walking mode maps W/S to forward/backward, A/D to lateral movement, and Q/E to turning. Trunk mode maps W/S to head pitch, A/D to head yaw, and Q/E to torso twist. M switches modes and ends old input. Releasing one input stops that channel while preserving any other held inputs.

Keys: 0 initialize; 1 sit/stand toggle; 2 left kick; 3 right kick; 4 forward roll; 5 bend/straighten; 6 mouth open/close; 7 recover; Space stop; H head neutral; B torso neutral. Recovery can interrupt an action. Sitting permits sit/stand and mouth controls, with recovery and stop remaining available. Normal action completion does not require recovery or show a success popup.

Pose release currently holds the last head/torso angle, with separate neutral controls. Angles, durations, initialization semantics, and action completion are prototype values pending hardware confirmation. The simulator visualizes independent head/torso motion, left/right kicks, bending, and mouth state. The real-device adapter records prototype commands and does not transmit to hardware.

Developer UI cleanup: SN binding is temporarily omitted from the testing view. Real-device walking speed is edited only in the advanced motion parameters; the simulator retains its speed slider.

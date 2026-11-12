# RaydiculousX 产品原型

[在线总览](https://pipiwangpm.github.io/MicroX/) · [官网和玩法广场](https://pipiwangpm.github.io/MicroX/website/) · [开发者 Web](https://pipiwangpm.github.io/MicroX/control/start.html) · [App](https://pipiwangpm.github.io/MicroX/mobile/account.html) · [管理后台](https://pipiwangpm.github.io/MicroX/admin/)

- 官网与 App 展示动作轮盘、光斑追踪和专注搭子。开发者 Web 提供动作轮盘、可安装玩法、仿真调试和无视频的键盘手动控制。
- 开发者 Web 登录后可选择实机或仿真。实机通过 USB／局域网连接，提供语音交互和玩法安装。仿真器同页提供虚拟 RayDino 的前进、后退、转向、坐下／起立、踢腿、前滚翻、蹲下夹东西和放下物品，以及玩法仿真和电脑摄像头／麦克风调试。
- 管理后台可筛选设备产品线、查看在线状态和绑定关系，以及在设备详情演示代办解绑。「入库」是统一入口占位。

这是公开的静态演示。登录、设备连接、实机操作和后台数据均为浏览器中的模拟流程。仿真调试设备通过浏览器权限调用本机摄像头和麦克风。浏览器扫码可以识别[样例二维码](demo/raydino-pairing.png)。

三维仿真场地参考 [Microduck Simulator](https://huggingface.co/spaces/pollen-robotics/microduck-simulator) 的场景和操控组织。拖动场地旋转视角，滚轮缩放，C 切换跟随视角，R 站起或坐下，WASD／方向键控制移动，空格停止。工具栏可重置场地。

RayDino 使用按产品外观搭建的简化三维关节模型，展示步态、姿态和玩法交互。后续可接入实际关节模型、物理参数和控制策略。场景渲染使用 Three.js，许可见 assets/vendor/three-LICENSE.txt。

App 浅色横屏遥控器和 Web 手动控制均提供身体动作入口。坐下时需先起立再移动，动作执行期间与移动和玩法启动互锁，停止按钮取消待完成动作。三维仿真展示踢腿、前滚翻和蹲下夹取物品的关节动画；这些为原型动画，不代表物理仿真或真实机器人已接入。

# Chrome 插件 - 页面备注与定时提醒

一个用于在网页上添加备注和设置定时提醒的 Chrome 插件。

## 更新日志

### 2024-12-19
- 开始时间输入框默认显示当前时间，并自动更新
- 倒计时显示单位改为分钟，保留一位小数
- 支持输入开始时间和结束时间，自动计算时间差
- 优化提醒效果：
  - 倒计时结束时标签栏闪烁持续30秒
  - 页面标题闪烁持续30秒
  - "时间到！"提醒30秒后自动消失
  - Mac系统通知持续10分钟

### 2024-12-24
- 修复合并按钮问题
- 新增倒计时功能：
  - 支持设置倒计时
  - 自动计算并显示目标时间
  - 多重提醒方式（系统通知、标签闪烁、声音）
- 修复页面刷新后锁定状态丢失的问题

### 2024-12-23
- 更新插件图标
- 新增页面备注功能：
  - 支持在页面任意位置添加备注
  - 备注可拖拽和调整大小
  - 多种预设位置选择
  - 备注内容持久化保存
- 新增页面锁定功能：
  - 一键锁定/解锁页面
  - 锁定状态持久化保存
  - 防止页面意外编辑或点击

### 2024-12-27
- 简化页面备注功能：
  - 移除位置选择功能
  - 备注固定显示在页面中心偏上位置
  - 保留拖拽调整位置功能
- 增强定时提醒功能：
  - 倒计时显示单位改为分钟，保留一位小数
  - 开始时间输入框默认显示当前时间，并自动更新
  - 倒计时结束时标签栏闪烁频率加快，颜色改为橙黄色
  - Mac系统通知显示备注内容，通知持续时间设置为10分钟

## 主要功能

1. 页面备注
   - 在任意网页添加备注信息
   - 支持自定义备注位置
   - 可拖拽调整备注框大小和位置

2. 定时提醒
   - 支持设置倒计时（以分钟为单位）
   - 自动计算并显示目标时间
   - 倒计时结束时多重提醒：
     - 系统通知
     - 标签栏闪烁
     - 声音提示

3. 页面锁定
   - 一键锁定页面内容
   - 防止意外编辑或点击
   - 锁定状态自动保存

## 使用说明

1. 添加备注
   - 点击插件图标
   - 输入备注内容
   - 选择显示位置
   - 点击"保存备注"

2. 设置定时
   - 输入开始时间（默认为当前时间）
   - 输入结束时间或持续时间
   - 系统自动计算倒计时
   - 倒计时结束时自动提醒

3. 锁定页面
   - 点击插件图标
   - 切换锁定开关
   - 锁定状态会自动保存

## 注意事项

- 页面刷新后会自动恢复之前的状态
- 系统通知需要浏览器权限
- 建议在Chrome浏览器最新版本使用

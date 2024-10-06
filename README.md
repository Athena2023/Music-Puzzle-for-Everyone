# Music-Puzzle-for-Everyone

此项目是一个音乐拼图游戏。用户可以上传音频文件，将其分割为多个音乐片段，然后通过游戏将这些片段正确排序。应用页面以中文提示和文本反馈为主，方便有视力障碍的用户使用。

## 功能描述

1. 用户可以上传一个音频文件，并指定想要分割的音频片段数量。
2. 系统会将音频分割为指定数量的片段，并通过游戏操作让用户应用并排序这些片段。
3. 游戏包含了一个正确排列所有片段的拼图功能，这个工作是在一个主页布局中进行的，通过移动、排序和调用这些片段来完成。
4. 此项目还包含了音频播放控件，包括播放、暂停、清除和跳转到指定时间的功能。

## 使用方式

1. 下载项目的所有文件。
2. 在本地主机上打开 `index.html`，为了应用最佳效果，请使用较新版本的浏览器。
3. 上传想要分割的音频文件，输入想要分割的片段数量（范围为 2 到 10）。
4. 点击“处理音频并开始游戏”按钮，开始分割音频。
5. 用户可以根据提示操作游戏，并使用左右箭头或按键来帮助操作应用。

## 快捷键说明

1. **Alt + P**: 播放拼图。
2. **Alt + R**: 重置拼图。
3. **空格键**: 停止所有音频。
4. **Alt + 1 到 9**: 选择对应的音乐片段。
5. **ArrowRight (右箭头)**: 移动焦点到下一个可交互元素。
6. **ArrowLeft (左箭头)**: 移动焦点到上一个可交互元素。
7. **Delete 或 Backspace**: 删除当前选中的拼图片段。
8. **F**: 快进 10 秒。
9. **B**: 快退 10 秒。
10. **J**: 跳转到指定时间。
11. **Enter (回车键)**: 播放或选择当前焦点的拼图片段。
12. **Alt + F**: 将焦点移动到左侧栏。
13. **Alt + J**: 将焦点移动到右侧栏。

## 文件详细描述

- **index.html**: 这是应用的主网页，包含上传音频、拼图区域和操作功能部分。
- **styles.css**: 指定了页面的样式，包括游戏界面的样式和操作元素的布局。
- **app.js**: 应用主要的功能代码，这里包括音频分割和游戏方法，帮助完成拼图游戏。

## 技术背景
- 这个游戏使用了 JavaScript 和 Web Audio API 实现音频分割和播放功能。
- 为了方便用户交互，使用了语音反馈功能，用户可通过中文语音反馈来获得提示。

## 运行设计和要求
- 请确保页面中指定的 CSS 和 JavaScript 文件存在并有效连接。
- 为了提供最佳的运行效果，请确保使用的浏览器支持 HTML5 和 Web Audio API。

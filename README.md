# Rime 皮肤编辑器

一个本地运行的 Rime 输入法皮肤编辑器，支持 Windows 小狼毫（Weasel）和 macOS 鼠须管（Squirrel）：

- 可视化编辑配色、字体、布局、候选编号，实时预览；预览框固定在页面上方，下滑调整参数时始终可见；
- 竖排预览按前端实际画法渲染：高亮条通栏、注释贴行尾、窗口宽度收紧到内容；
- 在两个前端之间复制皮肤（自动换算两端的边框/留白语义、字体名和缺失颜色）；
- 兼容鼠须管官方 wiki 的扁平写法（`preset_color_schemes/<id>`、`style/<key>` 补丁键）：既能读取，保存时也保持文件原有写法不改动；
- 每次保存前自动备份到 Rime 目录下的 `Rime皮肤编辑器备份/`，支持一键回退；
- 保存后可自动重新部署 Rime（Windows 端还会自动重启输入法服务，避免部署后输入卡死）。

## 启动

**方式一（推荐）：双击 `启动.bat`（Windows）/ `启动.command`（macOS）**

启动器会用 PowerShell（Windows）或 Python 3.7+（macOS）在 `127.0.0.1` 起一个仅本机可访问的本地服务，并自动打开浏览器。关闭那个窗口或网页即可退出。

**方式二：直接用 Chrome / Edge 打开 `index.html`**

首次使用时点击“选择文件夹”，授权浏览器读写你的 Rime 配置目录。（依赖浏览器的本地文件夹读写能力，需要 Chrome / Edge / Opera 等内核。）

## 指定 Rime 配置目录

- 编辑器放在 **Rime 配置目录里**使用时，无需任何配置，默认编辑上一级目录；
- 编辑器放在**任意其他位置**（独立安装）时，新建 `Rime目录.txt`（或 `RimeRoot.txt`）放在编辑器目录下，第一行写 Rime 配置目录的完整路径，例如：

  ```text
  D:\rime_data
  ```

  Windows 小狼毫的默认用户目录是 `%APPDATA%\Rime`；macOS 鼠须管是 `~/Library/Rime`。

## 文件结构

```text
启动.bat / 启动.command   一键启动脚本
index.html / styles.css   界面
src/                      编辑器逻辑（核心换算在 src/core.js）
local/                    本地启动器（PowerShell 与 Python 两个实现）
Rime目录.txt              独立安装时指向 Rime 配置目录（可选，不入库）
```

## 注意

- 保存皮肤会先自动备份；备份目录 `Rime皮肤编辑器备份/` 在 Rime 配置目录里，删除它将无法回退；
- 候选编号（`menu/alternative_select_labels`）是方案级全局设置，保存在对应方案的 `.custom.yaml` 里，不属于任何皮肤；
- 编辑器只读写 Rime 配置目录内的 yaml 和它自己的备份目录，不会访问其他路径。

## 本地测试

```bash
node --test test/
```

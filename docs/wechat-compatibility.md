# 微信兼容输出与验证

## 2.1.3 输出约定

“复制到公众号”和“公众号 HTML”共用 `buildWechatPayload`，先冻结当前预览内容，再进行公众号专用转换。阅读版 HTML 和 PDF 使用原有文档生成流程。

- 普通文字不写入自定义 `font-family`，采用微信阅读环境的字体。
- `text-align` 使用明确的左右、居中或两端对齐；普通文字行高使用随字号缩放的比例。
- 文字容器的渐变转换为首个渐变色的纯色背景。
- 代码转为允许换行的块容器，保留原文、空白、高亮，避免 `<pre>` 在窄屏截断。
- 数学公式转为三倍像素密度的 PNG，内嵌在 HTML 中；公式采用深色字与白色底，避免零高度 DOM 定位和移动端缺少公式字体。图片只包围公式实际内容，避免整行空白导致手机上过度缩小。原始预览、阅读版和 PDF 中的公式不变。
- 不添加规则豁免属性，不自动删除加粗，不修改原文来规避检测。

公式图片在微信编辑器中的接收、上传及发布效果还需线上实测，浏览器测试不能代替这一步。

## 官方校验复现

依据：[微信规范](https://developers.weixin.qq.com/doc/service/guide/product/plugin_spec.html)及[官方开源引擎](https://github.com/wechatjs/verify-article-structure-spec)。本次引擎版本为 0.2.16，提交为 `fa69e37341c86bfec4c8c533845910511e534c0c`。

在项目之外检出该版本，进入其 `cli` 目录安装依赖并执行 `node build-browser.mjs`。然后在 Format Hub 运行：

```sh
npm run check:wechat -- --engine /absolute/path/to/cli/dist/verify-article-structure.browser.js --out release/wechat-audit-2.1.3
```

此命令使用隔离的 Electron/Chromium 加载官方原始浏览器引擎，输出用户段落 × 8 个主题、默认示例 × 8 个主题，以及默认公众号 HTML 共 17 份样本与 `results.json`。使用引擎默认 375、585、677px 屏宽。不读取个人应用草稿，不操作系统剪贴板。

退出码 0 表示官方原始报告全通过，1 表示报告含告警，2 表示执行失败。**不会把已知误报偷偷改成通过。** 官方开源引擎和微信线上检测是否完全一致未验证。

## 2.1.3 检查结果

- 本地 13 项回归检查通过，覆盖草稿、渲染、复制与导出一致性、公式图片像素和尺寸、用户原文保真等。
- 官方 17 份样本复测：此前的 `height`、`pre`、`width`、`darkmode-no-gradient` 提示已消除；当前只剩 `line-height` 类提示。
- 用户段落每主题 1 条；默认完整示例每主题 9 条；默认公众号 HTML 同为 9 条。原始报告因此仍返回退出码 1。

### 已确认的行高误报

用户段落中的普通文字和加粗分属不同矩形片段。[官方 layout.ts](https://github.com/wechatjs/verify-article-structure-spec/blob/fa69e37341c86bfec4c8c533845910511e534c0c/cli/engine/layout.ts#L279) 将 `Range.getClientRects().length` 直接作为行数，再用文字包围盒高度除以它。

此前对照实测：585px 屏宽下，字号 16px、行距 28px，实际 3 行，却得到 6 个矩形片段，导致 74÷6 被误判小于 16×0.95。删除加粗后，实际行距与行数不变，但片段数降为 3，检测通过。恢复像素行高和使用最简 `p + strong` 仍会报错。因此改变行高单位并不是该提示的根因修复。

示例中剩余提示集中在含加粗、脚注、时间标签和列表标记的混合行内内容。不能据此笼统忽略未来的所有行高告警，需结合原始报告与真实几何测量分别判断。当前保留内容与格式，不承诺微信后台零提示。

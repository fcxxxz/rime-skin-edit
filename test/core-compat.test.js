'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// core.js 是浏览器脚本（无模块导出），直接求值加载；
// 顶层 const 保留在 eval 作用域里，函数通过闭包引用它们。
const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');
(0, eval)(coreSource);

// 官方 wiki 的扁平写法样例
const FLAT_SAMPLE = [
  'patch:',
  '  preset_color_schemes/luna:',
  '    name: 朧月',
  '    author: 依純',
  '    text_color: 0x959595',
  '    candidate_text_color: 0x959595',
  '    back_color: 0x420000',
  '    border_color: 0x420000',
  '    hilited_candidate_text_color: 0xFFFFFF',
  '    hilited_candidate_back_color: 0x420000',
  '    comment_text_color: 0x595959',
  '  style/color_scheme: luna',
  '',
].join('\n');

// 扁平配色键 + 嵌套 style 的混合写法
const MIXED_SAMPLE = [
  'patch:',
  '  preset_color_schemes/wechat:',
  '    name: "微信"',
  '    author: zsakvo',
  '    back_color: 0xFFFFFF',
  '    hilited_candidate_back_color: 0x75B100',
  '    hilited_candidate_text_color: 0xFFFFFF',
  '    font_face: PingFangSC',
  '    font_point: 16',
  '  style:',
  '    color_scheme: wechat',
  '    font_point: 14',
  '',
].join('\n');

// 编辑器自己的嵌套写法
const NESTED_SAMPLE = [
  'patch:',
  '  preset_color_schemes:',
  '    win11light:',
  '      name: "秃秃推荐／Win11Light"',
  '      back_color: 0xF9F9F9',
  '      candidate_text_color: 0x000000',
  '  style:',
  '    color_scheme: win11light',
  '    font_point: 15',
  '',
].join('\n');

const rgba = (r, g, b, a = 255) => ({ r, g, b, a });

test('解析纯扁平写法：官方 wiki 样式能列出皮肤', () => {
  const parsed = parseSquirrelConfig(FLAT_SAMPLE);
  assert.equal(parsed.skins.length, 1);
  assert.equal(parsed.skins[0].id, 'luna');
  assert.equal(parsed.skins[0].displayName, '朧月');
  assert.equal(parsed.activeSkinId, 'luna');
});

test('解析混合写法：扁平配色键 + 嵌套 style 也能列出皮肤', () => {
  const parsed = parseSquirrelConfig(MIXED_SAMPLE);
  assert.deepEqual(parsed.skins.map((skin) => skin.id), ['wechat']);
  assert.equal(parsed.activeSkinId, 'wechat');
});

test('扁平文件保存皮肤保持扁平写法', () => {
  const parsed = parseSquirrelConfig(FLAT_SAMPLE);
  const skin = { ...parsed.skins[0], displayName: '朧月·改' };
  const output = updateSquirrelConfig(FLAT_SAMPLE, skin, { makeActive: true });
  assert.match(output, /^ {2}preset_color_schemes\/luna:$/m);
  assert.doesNotMatch(output, /^ {2}preset_color_schemes:$/m);
  assert.doesNotMatch(output, /^ {2}style:$/m);
  assert.match(output, /^ {2}style\/color_scheme: luna$/m);
  // 保存结果能重新解析，改动生效
  const reparsed = parseSquirrelConfig(output);
  assert.equal(reparsed.skins[0].displayName, '朧月·改');
  assert.equal(reparsed.activeSkinId, 'luna');
});

test('扁平文件新建皮肤跟随扁平写法', () => {
  const skin = {
    platform: 'squirrel',
    id: 'mint',
    displayName: '薄荷',
    author: 'test',
    colors: {
      back: rgba(0xEE, 0xF6, 0xEE),
      text: rgba(0x24, 0x24, 0x24),
      hilitedCandidateBack: rgba(0x66, 0xBB, 0x6A),
      hilitedCandidateText: rgba(0xFF, 0xFF, 0xFF),
    },
    layout: {},
  };
  const output = updateSquirrelConfig(FLAT_SAMPLE, skin, {});
  assert.match(output, /^ {2}preset_color_schemes\/mint:$/m);
  assert.doesNotMatch(output, /^ {2}preset_color_schemes:$/m);
});

test('混合写法各归各位：扁平皮肤写扁平、嵌套皮肤写嵌套、style 保持嵌套', () => {
  const parsed = parseSquirrelConfig(MIXED_SAMPLE);
  const flatOutput = updateSquirrelConfig(MIXED_SAMPLE, parsed.skins[0], {});
  assert.match(flatOutput, /^ {2}preset_color_schemes\/wechat:$/m);
  assert.doesNotMatch(flatOutput, /^ {2}preset_color_schemes:$/m);
  assert.doesNotMatch(flatOutput, /^ {2}style\/font_point: /m);

  const nestedSkin = {
    platform: 'squirrel',
    id: 'win11light',
    displayName: 'Win11Light',
    colors: { back: rgba(0xF9, 0xF9, 0xF9) },
    layout: {},
    source: { file: 'squirrel.custom.yaml', path: 'patch.preset_color_schemes.win11light' },
  };
  const nestedOutput = updateSquirrelConfig(MIXED_SAMPLE, nestedSkin, {});
  assert.match(nestedOutput, /^ {2}preset_color_schemes:$/m);
  assert.match(nestedOutput, /^ {4}win11light:$/m);
});

test('嵌套写法行为不变（回归）', () => {
  const parsed = parseSquirrelConfig(NESTED_SAMPLE);
  assert.equal(parsed.skins[0].id, 'win11light');
  const output = updateSquirrelConfig(NESTED_SAMPLE, parsed.skins[0], { makeActive: true });
  assert.match(output, /^ {2}preset_color_schemes:$/m);
  assert.match(output, /^ {4}win11light:$/m);
  assert.doesNotMatch(output, /^ {2}preset_color_schemes\//m);
  assert.match(output, /^ {4}color_scheme: win11light$/m);
});

test('切换皮肤：扁平文件写 style/color_scheme，嵌套文件写 style 对象', () => {
  const flatOutput = updateActiveSkinConfig(FLAT_SAMPLE, 'squirrel', 'luna', {});
  assert.match(flatOutput, /^ {2}style\/color_scheme: luna$/m);
  assert.doesNotMatch(flatOutput, /^ {2}style:$/m);

  const nestedOutput = updateActiveSkinConfig(NESTED_SAMPLE, 'squirrel', 'win11light', {});
  assert.match(nestedOutput, /^ {4}color_scheme: win11light$/m);
  assert.doesNotMatch(nestedOutput, /^ {2}style\//m);
});

test('删除皮肤：扁平与嵌套位置都清理，仅当激活指针指向它时移除', () => {
  const flatOutput = deleteSquirrelSkinConfig(FLAT_SAMPLE, 'luna');
  assert.doesNotMatch(flatOutput, /luna/);

  const mixedOutput = deleteSquirrelSkinConfig(MIXED_SAMPLE, 'wechat');
  assert.doesNotMatch(mixedOutput, /preset_color_schemes\/wechat/);
  assert.doesNotMatch(mixedOutput, /color_scheme: wechat/);

  const nestedOutput = deleteSquirrelSkinConfig(NESTED_SAMPLE, 'win11light');
  assert.doesNotMatch(nestedOutput, /win11light/);
  // 未指向被删皮肤的其他 style 字段保留
  assert.match(nestedOutput, /^ {4}font_point: 15$/m);
});

test('空 patch 上新建皮肤默认嵌套写法（既有行为）', () => {
  const skin = {
    platform: 'squirrel',
    id: 'new_skin',
    displayName: '新皮肤',
    colors: { back: rgba(0xFF, 0xFF, 0xFF) },
    layout: {},
  };
  const output = updateSquirrelConfig('patch:\n', skin, {});
  assert.match(output, /^ {2}preset_color_schemes:$/m);
  assert.match(output, /^ {4}new_skin:$/m);
});

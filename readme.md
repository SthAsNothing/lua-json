# `lua-json`

[![Version](https://img.shields.io/npm/v/lua-json.svg)](https://www.npmjs.com/package/lua-json)

## 描述（Describe）

由js编写，将 Lua 表与 Json 格式相互转换。

Convert Lua tables to and from Json.

## 复制原因（Fork reason）

### 2026/03/18

使用原版过程中发现，若Json中存在K为"nil"的键值对时，将 Json 格式转为 Lua 后，nil 未被 "['"  "']" 包裹。

即：format({ "nil":0 }) // => 'return { nil = 0 }' 会造成报错。   即便真在Lua环境中，以字符串nil为键，正确格式也应当为"return { ['nil'] = 0}"

将在后续尝试修复。（吐槽下： 拿'nil'当键的游戏公司也是人才）


## Usage

```js
const { format, parse } = require('lua-json')

format({ x: 1 }) // 'return { x = 1 }'
parse('return { x = 1 }') // { x: 1 }
```

## API

```ts
type Json = null | boolean | number | string | Json[] | { [_: string]: Json }

format(
  value: Json, // 输入：标准 JSON 数据（JS 数据）
  options?: {   // 可选配置：格式化规则
    eol: string = '\n',          // 换行符，默认 \n
    singleQuote: boolean = true, // 字符串是否用单引号，默认 true
    spaces: null | number | string = 2, // 缩进空格数，默认 2
  }
): string // 输出：Lua 代码字符串

parse(value: string): Json
```

## TODO

- More formatting options à la [prettier](https://prettier.io/docs/en/options.html): `printWidth` (!), `trailingComma`, `bracketSpacing`.

## Install

```bash
npm install https://github.com/SthAsNothing/lua-json.git
```

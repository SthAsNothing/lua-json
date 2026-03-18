# `lua-json`

[![Version](https://img.shields.io/npm/v/lua-json.svg)](https://www.npmjs.com/package/lua-json)

Convert Lua tables to and from JSON.

将 Lua 表与 JSON 格式相互转换。

## Install（安装）

```sh
yarn add lua-json
```

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

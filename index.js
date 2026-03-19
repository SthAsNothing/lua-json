const { isNull, isBoolean, isNumber, isString, isArray, isObject, isEmpty, fromPairs, keys, map, repeat } = require('lodash')
const { parse: parseLua } = require('luaparse')

const formatLuaString = (string, singleQuote) => (
  singleQuote ? `'${string.replace(/'/g, "\\'")}'` : `"${string.replace(/"/g, '\\"')}"`
)

// 仅用于将 JS 特殊值映射到 Lua 关键字
const valueKeys = { false: 'false', true: 'true', null: 'nil' }

// Lua 保留关键字列表
const luaKeywords = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function', 'goto', 'if',
  'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then', 'true', 'until', 'while'
]);

const formatLuaKey = (string, singleQuote) => {
  // 1. 先检查是否为 JS 特殊值 (null, true, false)
  if (valueKeys[string] !== undefined) {
    return `[${valueKeys[string]}]`;
  }
  // 2. 再检查是否为 Lua 保留关键字，如果是，则必须用 ["key"] 格式
  if (luaKeywords.has(string)) {
    return `[${formatLuaString(string, singleQuote)}]`;
  }
  // 3. 最后，检查是否为合法标识符
  if (string.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)) {
    return string;
  }
  // 4. 其他所有情况（包含特殊字符、空格等）都用 ["key"] 格式
  return `[${formatLuaString(string, singleQuote)}]`;
};


const format = (value, options = { eol: '\n', singleQuote: true, spaces: 2 }) => {
  options = options || {}
  const eol = (options.eol = isString(options.eol) ? options.eol : '\n')
  options.singleQuote = isBoolean(options.singleQuote) ? options.singleQuote : true
  options.spaces = isNull(options.spaces) || isNumber(options.spaces) || isString(options.spaces) ? options.spaces : 2

  const rec = (value, i = 0) => {
    if (isNull(value)) {
      return 'nil'
    }
    if (isBoolean(value) || isNumber(value)) {
      return value.toString()
    }
    if (isString(value)) {
      // --- 修改开始 ---
      // 检查字符串是否包含换行符
      if (value.includes('\n')) {
        // 如果包含换行符，则使用 Lua 的多行字符串语法 [[ ]]
        // 并移除首尾多余的换行符以保持整洁
        let cleanValue = value.replace(/^\n+|\n+$/g, '');
        return `[[${cleanValue}]]`;
      } else {
        // 否则，使用原来的格式化函数
        return formatLuaString(value, options.singleQuote)
      }
      // --- 修改结束 ---
    }
    if (isArray(value)) {
      if (isEmpty(value)) { return '{}' }
      if (options.spaces) {
        const spaces = isNumber(options.spaces) ? repeat(' ', options.spaces * (i + 1)) : repeat(options.spaces, i + 1)
        const spacesEnd = isNumber(options.spaces) ? repeat(' ', options.spaces * i) : repeat(options.spaces, i)
        return `{${eol}${value.map(e => `${spaces}${rec(e, i + 1)},`).join(eol)}${eol}${spacesEnd}}`
      }
      return `{${value.map(e => `${rec(e, i + 1)},`).join('')}}`
    }
    if (isObject(value)) {
      if (isEmpty(value)) { return '{}' }
      if (options.spaces) {
        const spaces = isNumber(options.spaces) ? repeat(' ', options.spaces * (i + 1)) : repeat(options.spaces, i + 1)
        const spacesEnd = isNumber(options.spaces) ? repeat(' ', options.spaces * i) : repeat(options.spaces, i)
        return `{${eol}${keys(value).map(key => `${spaces}${formatLuaKey(key, options.singleQuote)} = ${rec(value[key], i + 1)},`).join(eol)}${eol}${spacesEnd}}`
      }
      return `{${keys(value).map(key => `${formatLuaKey(key, options.singleQuote)}=${rec(value[key], i + 1)},`).join('')}}`
    }
    throw new Error(`can't format ${typeof value}`)
  }
  return `return${options.spaces ? ' ' : ''}${rec(value)}`
}

const luaAstToJson = (ast) => {
  if (['NilLiteral', 'BooleanLiteral', 'NumericLiteral', 'StringLiteral'].includes(ast.type)) {
    return ast.value
  }
  if (ast.type === 'UnaryExpression' && ast.operator === '-') {
    return -luaAstToJson(ast.argument)
  }
  if (ast.type === 'Identifier') {
    return ast.name
  }
  if (['TableKey', 'TableKeyString'].includes(ast.type)) {
    return {
      __internal_table_key: true,
      key: luaAstToJson(ast.key),
      value: luaAstToJson(ast.value),
    }
  }
  if (ast.type === 'TableValue') {
    return luaAstToJson(ast.value)
  }
  if (ast.type === 'TableConstructorExpression') {
    if (ast.fields[0] && ast.fields[0].key) {
      const object = fromPairs(
        map(ast.fields, (field) => {
          const { key, value } = luaAstToJson(field)
          return [key, value]
        }),
      )
      return isEmpty(object) ? [] : object
    }
    return map(ast.fields, (field) => {
      const value = luaAstToJson(field)
      return value.__internal_table_key ? [value.key, value.value] : value
    })
  }
  if (ast.type === 'LocalStatement') {
    const values = ast.init.map(luaAstToJson)
    return values.length === 1 ? values[0] : values
  }
  if (ast.type === 'ReturnStatement') {
    const values = ast.arguments.map(luaAstToJson)
    return values.length === 1 ? values[0] : values
  }
  if (ast.type === 'Chunk') {
    return luaAstToJson(ast.body[0])
  }
  throw new Error(`can't parse ${ast.type}`)
}

const parse = (value) => luaAstToJson(parseLua(value, { comments: false }))

module.exports = {
  format,
  parse,
}

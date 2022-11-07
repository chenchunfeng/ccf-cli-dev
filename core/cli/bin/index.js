#! /usr/bin/env node

const importLocal = require('import-local')

if (importLocal(__filename)) {
  require('npmlog').info('提示', '正在使用当前项目中 ccf-cli-dev 的版本')
} else {
  // 使用全局下的脚手架命令
  require('../lib')(process.argv.slice(2))
}
#! /usr/bin/env node
const yargs = require('yargs/yargs')
const dedent = require('dedent')
const { hideBin } = require('yargs/helpers')
// 解析参数
const arg = hideBin(process.argv)
// 调用 yargs 构造函数 传入一个参数进行解析  然后调用 argv  完成初始化过程
const command = yargs(arg)
command.usage("Usage:test-cli [command] <options>") // 打印在命令行最前面
  // .strict() // 开启严格模式 命令错误时 会出现 Unknown argument: xxx 的提示
  .demandCommand(1, "A command is required. Pass --help to see all available commands and options.")
  .alias("h", "help") // -h --help
  .alias("v", "version") // -v --version
  // .wrap(100) // 命令行中的宽度发生了变化
  .wrap(command.terminalWidth()) // 宽度100%
  // .epilogue("this is footer")
  .epilogue(dedent(`   When a command fails, all logs are written to lerna-debug.log in the current working directory.
  For more information, find our manual at https://github.com/lerna/lerna
`))
  .options({
    debug: {
      type: 'boolean',
      describe: "bootstrap debug moe",
      alias: "d"
    }
  })
  .option("registry", {
    type: 'string',
    describe: "define global registry",
    alias: "r",
    hidden: false
  })
  // 配置 分组
  .group(['debug', "version"],'Dev Options')
  .group(['registry'],'Extra Options')
  // 配置 命令，当执行 init [name] 命令的时候一系列的行为
  .command('init [name]', 'Do init a project',(yargs)=>{
    yargs
      .option('name',{
        type: 'string',
        describe: 'Name of a project',
        alias: 'n'
      })
  },(argv)=>{
    console.log(argv)
  })
  // 配置 命令的第二种方法
  .command({
    command: 'list',
    aliases: ['ls','ll','la'],
    describe: 'List local packages',
    builder: (yargs)=>{},
    handler: (argv)=>{
      console.log(123, argv)
    }
  })
  .argv // 可以解析参数

// console.log(command)
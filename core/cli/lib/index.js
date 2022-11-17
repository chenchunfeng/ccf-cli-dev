'use strict';

module.exports = cli;

const path = require('path');

// 版本号比较
const semver = require('semver');
// 打印文本颜色
const colors = require('colors/safe');
// 引入user-home 跨操作系统获取用户主目录
const userHome = require('user-home');
// 检查目录是否存在
const pathExists = require('path-exists').sync;
const commander = require('commander');



const log = require('@ccf-cli-dev/log');
const init = require('@ccf-cli-dev/init')
const constant = require('./const');
const pkg = require('../package.json');

const program = new commander.Command();


function cli() {
    try {
        checkPackageVersion();
        checkNodeVersion();
        checkRoot();
        checkUserHome();
        checkInputArgs();
        checkEnv();
        checkLastVersion();
        registerCommand();
    } catch (error) {
        log.error(error.message);
    }
}

/**
 * 读取package.json里面的版本号，并打印
 */
function checkPackageVersion() {
    log.success('当前的脚手架版本:', pkg.version);
}

/**
 * 判断当前node版本是大于等于minVersion
 */
function checkNodeVersion() {
  // 获取当前 node 版本号
  const currentVersion = process.version;
  // 获取最低 node 版本号
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  // 对比最低 node 版本号
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`当前 node 版本：${currentVersion}，最低 node 版本：${lowestVersion}，请升级 node`));
  }
}

/**
 * 检查 root 等级并自动降级
 */
function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck();
}

/**
 * 用户主目录是否存在
 */
function checkUserHome() {
    // 如果主目录不存在,抛出异常
    if (!userHome || !pathExists(userHome)) {
      throw new Error(colors.red('当前登录用户主目录不存在'));
    }
  }
/**
 * 格式化入参，并判断是否开启debug
 */
let args;
function checkInputArgs() {
    const minimist = require('minimist');
    args = minimist(process.argv.slice(2));
    // checkDebugArgs();
}

/**
 * 检查是否有debug参数, 并设置log level
 */
function checkDebugArgs() {
    const level = args.debug ? 'verbose' : 'info'
    log.level = level;
    process.env.LOG_LEVEL = level
}

/**
 * 检查是否有环境变量配置文件，有的话写入process.ENV
 */
function checkEnv() {
    const dotenv = require('dotenv');
    const envPath = path.resolve(userHome, '.env');
    if (pathExists(envPath)) {
        dotenv.config({
            path: envPath,
        });
    }
    // 创建默认的环境变量配置
    createDefaultConfig();
}

function createDefaultConfig() {
    const homePath = process.env.CLI_HOME || constant.DEFAULT_CLI_HOME
    process.env.CLI_HOME_PATH = path.join(userHome, homePath);
}

/**
 * 通过对比https://registry.npmjs.org/模块名，返回
 */
 async function checkLastVersion() {
    const { getLastVersion } = require('@ccf-cli-dev/get-npm-info');
    const currentVersion = pkg.version;
    const npmName = pkg.name;

    const lastVersion = await getLastVersion(currentVersion, npmName);
    if (lastVersion && semver.gt(lastVersion, pkg.version)) {
        log.warn(colors.red(`请升级版本，最新版本：${lastVersion}，升级命令：npm i ${npmName} -g`));
    }
}

/**
 * 注意命令
 */
function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])   // 设置 usage 的 name
        .usage('<command> [options]')    // 设置 usage 的 message
        .version(pkg.version, '-v, --version')    // 设置 Version 命令 
        .option('-d, --debug', '是否开启调试', false);    // 创建 debug 命令 ， 第三个参数：是否默认开启
    
    // 注册命令
    program
        .command('init [projectName]')
        .description('初始化')
        .option('-f, --force', '是否强制初始化项目')
        .action(init);

    // 开启debug监听
    program.on('option:debug', function() {
        process.env.LOG_LEVEL = program._optionValues.debug ? 'verbose' : 'info';
        log.level = process.env.LOG_LEVEL;
        // 测试开启debug
        log.verbose('开启debug')
    })

    // 对未知命令监听
    program.on('command:*', function(obj) {
        const availableCommands = program.commands.map(cmd => cmd.name());
        console.log(colors.red('未知的命令：' + obj[0]));
        if (availableCommands.length > 0) {
            console.log(colors.red('可用命令：' + availableCommands.join(',')));
            program.outputHelp();
        }
    });
    program.parse(process.argv);
    
    // 如果不输出任何命令或选项，输出帮忙文档 新版本不需要
    if (program.args && program.args.length < 1) {
        program.outputHelp();
        // 输出空行
        console.log()
    }
}
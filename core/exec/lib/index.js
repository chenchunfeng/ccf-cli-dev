'use strict';

// 外部依赖放上面
const path = require('path');

// 内部依赖放下面
const log = require('@ccf-cli-dev/log');
const Package = require('@ccf-cli-dev/package');
const { exec: spawn } = require('@ccf-cli-dev/utils');

const SETTINGS = {
  init: '@ccf-cli-dev/init',
  publish: '@ccf-cli-dev/publish',
};
const CACHE_DIR = 'dependencies';



async function exec(...args) {
  // TODO
  let storeDir, pkg;
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);
  const cmdObj = args[args.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = 'latest';


  // 不使用本地包
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, 'node_modules');
    log.verbose('storeDir', storeDir);
    // 实例化package类
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }

  const rootFile = pkg.getRootFilePath();
  log.verbose('rootFile', rootFile);
  if (!rootFile) return
  // 调用加载到的包
  // rootFile &&  require(rootFile).call(null, Array.from(arguments));

  // 在node子进程中调用
  try {
    const args = Array.from(arguments);
    const cmd = args[args.length - 1];
    const o = Object.create(null);
    // 过滤属性
    Object.keys(cmd).forEach(key => {
      if (cmd.hasOwnProperty(key) &&
        !key.startsWith('_') &&
        key !== 'parent') {
        o[key] = cmd[key];
      }
    });
    args[args.length - 1] = o;

    const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
    const child = spawn('node', ['-e', code], {
      cwd: process.cwd(),
      // 不需要监听，直接输出结果到父进程
      stdio: 'inherit',
    });
    child.on('error', e => {
      log.error(e.message);
      process.exit(1);
    });
    child.on('exit', e => {
      log.verbose('命令执行成功:' + e);
      process.exit(e);
    });
  } catch (e) {
    log.error(e.message);
  }




}


module.exports = exec;
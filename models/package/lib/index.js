'use strict';


const path = require('path');
const fse = require('fs-extra');
const pkgDir = require('pkg-dir').sync;
const pathExists = require('path-exists').sync;
const npminstall = require('npminstall');

const { isObject, formatPath } = require('@ccf-cli-dev/utils');
const { getNpmLatestVersion, getDefaultRegistry } = require('@ccf-cli-dev/get-npm-info');

class Package {
    constructor(options) {
        if (!options) {
            throw new Error('Package 类的参数不能为空!');
        }
        if (!isObject(options)) {
            throw new Error('Package 类的参数必须是对象类型!');
        }

        this.targetPath = options.targetPath;
        this.storeDir = options.storeDir;
        this.packageName = options.packageName;
        this.packageVersion = options.packageVersion;
        // 缓存路径的前缀
        this.cacheFilePathPrefix = this.packageName.replace('/', '_');
    }

    // 判断缓存目录是否存在
    async exists() {
    if (this.storeDir) {
        // 获取具体版本号
        await this._prepare();
        return pathExists(this._cacheFilePath);
      } else {
        // 查看本地路径是否存在
        return pathExists(this.targetPath);
      }
    }

    // 更新缓存目录下的包
    async update() {
        await this._prepare();
        const latestVersion = await getNpmLatestVersion(this.packageName);
        // 查询本地是否已经是最新版本
        const localPath = this._getSpecificFilePath(latestVersion);
        const isLocalLatestVersion = pathExists(localPath);
        // 如果不是最新版本 安装最新版本
        if (!isLocalLatestVersion) {
            await npminstall({
                root: this.targetPath, // 包安装路径
                storeDir: this.storeDir, // 包依赖安装路径
                register: getDefaultRegistry(), // 设置 npm 源
                pkgs: [
                    // 要安装的包信息
                    {
                        name: this.packageName,
                        version: latestVersion,
                    },
                ],
            });
        } else {
            this.packageVersion = latestVersion;
        }
    }

    // 安装最新的包在缓存目录
    async install() {
        await this._prepare();
        return npminstall({
          root: this.targetPath, // 模块路径
          storeDir: this.storeDir, // 模块安装位置
          register: getDefaultRegistry(), // 设置 npm 源
          pkgs: [
            // 要安装的包信息
            {
              name: this.packageName,
              version: this.packageVersion,
            },
          ],
        });
    }

    // 获取缓存目录下包的入口文件路径
    getRootFilePath() {
        function _getRootFile(targetPath) {
            // 1. 获取package.json所在目录
            const dir = pkgDir(targetPath);
            if (dir) {
              // 2. 读取package.json
              const pkgFile = require(path.resolve(dir, 'package.json'));
              // 3. 寻找main/lib
              if (pkgFile && pkgFile.main) {
                // 4. 路径的兼容(macOS/windows)
                return formatPath(path.resolve(dir, pkgFile.main));
              }
            }
            return null;
        }
        if (this.storeDir) {
            return _getRootFile(this._cacheFilePath);
        } else {
            return _getRootFile(this.targetPath);
        }
    }

    // 确保缓存目录存在
    async _prepare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            fse.mkdirpSync(this.storeDir);
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName);
        }
    }

    //获取当前模块缓存路径
    get _cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
    }

    // 获取指定版本缓存路径
    _getSpecificFilePath(packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`);
    }

}

module.exports = Package;

'use strict';


const Command = require('@ccf-cli-dev/command');
const log = require('@ccf-cli-dev/log');

const fs = require('fs');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const { spinnerStart, sleep } = require('@ccf-cli-dev/utils');

const getProjectTemplate = require('./getProjectTemplate');


const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = !!this._argv[1].force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }

    async exec() {
        try {
            // 1 准备阶段
            const projectInfo = await this.prepare();
            if (projectInfo) {
                this.projectInfo = projectInfo;
                log.verbose('projectInfo', projectInfo)
                // 2 下载模板
                // await this.downloadTemplate();
                // 3 安装模板
            }
        } catch (error) {
            log.error(error)
        }
    }

    async prepare() {
        // 0. 判断项目模板是否存在
        const template = await getProjectTemplate();
        if (!template || template.length === 0) {
            throw new Error('项目模板不存在');
        }
        this.template = template;
        // 当前目录  也可以使用path.resolve('.')
        // 注意跟 __dirname的区别
        const localPath = process.cwd();
        // 1.判断目录是否为空
        const isEmpty = this.isDirEmpty(localPath);
        // 有文件，但不是强制创建时，需要提示有文件存在， 是否继续创建
        if (!isEmpty) {
            if (!this.force) {
                // 询问用户是继续
                const { isContinue } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'isContinue',
                        message: '当前文件夹内容不为空,是否在此继续创建项目?',
                        default: false,
                    },
                ]);
                if (!isContinue) return false
            }

            // 确认删除
            const { isDelete } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'isDelete',
                    message: '是否清空当前目录下的文件?',
                    default: false,
                },
            ]);
            if (isDelete) {
                // 清空当前目录 fse.removeSync会清空文件夹
                fse.emptyDirSync(localPath);
            }
        }
        // 3.选择创建项目或者组件
        // 4.获取项目的基本信息 return Object
        return this.getProjectInfo();


    }
    /**
       * @description: 下载模板
       *  1.通过项目模板API获取项目模板信息
       *  1.1 通过egg.js搭建一套后端系统 ccf-cli-dev-server
       *  1.2 通过npm存储项目模板 (vue-cli/vue-element-admin两套模板)
       *  1.3 将项目模板信息存储到 mongodb 数据库中
       *  1.4 通过 egg.js 获取 mongodb 中的数据并且通过 API 返回
       * @param {*}
       * @return {*}
       */
    async downloadTemplate() {
        // 获取模板名称
        const { projectTemplate } = this.projectInfo;
        // 根据名称匹配到模板信息
        const templateInfo = this.template.find(item => item.npmName === projectTemplate);
        // 拼接路径
        const homePath = process.env.CLI_HOME_PATH;
        const targetPath = path.resolve(homePath, 'template');
        const storeDir = path.resolve(homePath, 'template', 'node_modules');
        const { npmName, version } = templateInfo;
        this.templateInfo = templateInfo;
        // 创建一个 Package
        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version,
        });
        // 检查 package 是否存在
        if (!await templateNpm.exists()) {
            // 安装
            const spinner = spinnerStart('正在下载模板...');
            await sleep();
            try {
                await templateNpm.install();
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    log.success('下载模板成功');
                    this.templateNpm = templateNpm;
                }
            }
        } else {
            // 更新
            const spinner = spinnerStart('正在更新模板...');
            await sleep();
            try {
                await templateNpm.update();
            } catch (e) {
                throw e;
            } finally {
                spinner.stop(true);
                if (await templateNpm.exists()) {
                    log.success('更新模板成功');
                    this.templateNpm = templateNpm;
                }
            }
        }
    }

    /**
     * @description 判断目录是否为空
     * @params path: string
     * @return boolean
     */
    isDirEmpty(path) {
        let fileList = fs.readdirSync(path);
        fileList = fileList.filter(file => {
            return !file.startsWith('.') && !['node_modules'].includes(file)
        })

        return !fileList || fileList.length === 0
    }
    /**
     * @description: 选择创建项目或者组件 获取项目的基本信息 return Object
     * @param {*}
     * @return {*} 项目的基本信息
     */
    async getProjectInfo() {
        const info = {};
        // 选择创建项目或者组件;
        const { type } = await inquirer.prompt({
            type: 'list',
            message: '请选择初始化类型',
            name: 'type',
            default: TYPE_PROJECT,
            choices: [
                {
                    name: '项目',
                    value: TYPE_PROJECT,
                },
                {
                    name: '组件',
                    value: TYPE_COMPONENT,
                },
            ],
        });
        log.verbose('type', type);
        const title = type === TYPE_PROJECT ? '项目' : '组件';
        // 获取项目的基本信息;
        if (type === TYPE_COMPONENT) {
        }
        if (type === TYPE_PROJECT) {
            const o = await inquirer.prompt([
                {
                    type: 'input',
                    message: '请输入项目名称',
                    name: 'project',
                    validate: (a) => {
                        const reg =
                            /^[a-zA-Z]+([-][a-zA-Z0-9]|[_][a-zA-Z0-9]|[a-zA-Z0-9])*$/;
                        if (reg.test(a)) {
                            return true;
                        }



                        return '要求英文字母开头,数字或字母结尾,字符只允许使用 - 以及 _ ';
                    },
                },
                {
                    type: 'input',
                    message: '请输入项目版本号',
                    name: 'version',
                    default: '1.0.0',
                    validate: (a) => {
                        return !!semver.valid(a) || '请输入合法的版本号';
                    },
                    filter: (a) => {
                        if (!!semver.valid(a)) {
                            return semver.valid(a);
                        }
                        return a;
                    },
                },
                {
                    type: 'list',
                    name: 'projectTemplate',
                    message: `请选择${title}模板`,
                    choices: this.createTemplateChoices(),
                }
            ]);
            console.log('🚀🚀 ~ InitCommand ~ o', o);
        }
        return info;
    }

    createTemplateChoices() {
        return this.template.map(item => ({
            value: item.npmName,
            name: item.name,
        }));
    }


}

function init(argv) {
    return new InitCommand(argv);
}


module.exports = init;
module.exports.InitCommand = InitCommand;
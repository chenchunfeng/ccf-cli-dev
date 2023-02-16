'use strict';

module.exports = {
    isObject,
    formatPath,
    exec,
    sleep,
    spinnerStart,
};

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}


const path = require('path');
function formatPath(p) {
    if (p && typeof p === 'string') {
        // 当时系统分割符
        const sep = path.sep;
        if (sep === '/') {
            return p;
        } else {
            return p.replace(/\\/g, '/');
        }
    }
}

function exec(command, args, options) {
    const win32 = process.platform === 'win32';

    const cmd = win32 ? 'cmd' : command;
    const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

    return require('child_process').spawn(cmd, cmdArgs, options || {});
}


function sleep(timeout = 1000) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

function spinnerStart(msg, spinnerString = '|/-\\') {
    const Spinner = require('cli-spinner').Spinner;
    const spinner = new Spinner(msg + ' %s');
    spinner.setSpinnerString(spinnerString);
    spinner.start();
    return spinner;
}
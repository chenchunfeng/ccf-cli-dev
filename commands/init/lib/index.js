'use strict';


const Command = require('@ccf-cli-dev/command');
const log = require('@ccf-cli-dev/log');


class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = !!this._cmd.force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
      }
}
function init(argv) {
    console.log('init', argv);
    return new InitCommand(argv);
}


module.exports = init;
module.exports.InitCommand = InitCommand;
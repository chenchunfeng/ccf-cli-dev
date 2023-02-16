const request = require('@ccf-cli-dev/request');

module.exports = function () {
  return request({
    url: '/project/template',
  });
};

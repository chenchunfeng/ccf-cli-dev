'use strict';

const axios = require('axios');

const log = require('@ccf-cli-dev/log');

const BASE_URL = process.env.CCF_CLI_BASE_URL ? process.env.CCF_CLI_BASE_URL :
    'http://www.xxxx.com';

const request = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
});

log.verbose('BASE_URL', BASE_URL);

request.interceptors.response.use(
    response => {
        return response.data;
    },
    error => {
        return Promise.reject(error);
    }
);

module.exports = request;

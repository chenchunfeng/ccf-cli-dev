'use strict';

const axios = require('axios');
const semver = require('semver')
const urlJoin = require('url-join');




async function getLastVersion(baseVersion, npmName, registry) {
    const versions = await getVersions(npmName, registry);
    const lastVersion = handleVersions(baseVersion, versions);
    return lastVersion;
}

async function getVersions(npmName, registry) {
    const data = await getNpmInfo(npmName, registry);
    return data.versions ? Object.keys(data.versions) : [];
}

function getNpmInfo(npmName, registry) {
    if (!npmName) return null;

    return axios.get(getUrl(registry, npmName)).then(res => {
        return res.status === 200 ? res.data: {};
    }).catch(e => {
        return Promise.reject(e)
    })
}

function getUrl(sourceType = 'tao', npmName) {
    const typeMap = {
        'npm': 'https://registry.npmjs.org/',
        'tao': 'https://registry.npmmirror.com/'
    }
    return urlJoin(typeMap[sourceType], npmName)
}

/**
 * 
 * @param {*} baseVersion 
 * @param {*} versions 
 * @description 过滤并排序，获取最新版本号
 */ 
function handleVersions(baseVersion, versions) {
    const list =  versions
        .filter(version => semver.satisfies(version, `>${baseVersion}`))
        .sort((a, b) => semver.gt(b, a) ? 1 : -1);
    return list[0]
}

module.exports = {
    getLastVersion,
    getVersions,
    getNpmInfo 
};


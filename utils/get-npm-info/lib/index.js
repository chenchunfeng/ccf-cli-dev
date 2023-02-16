'use strict';

const axios = require('axios');
const semver = require('semver')
const urlJoin = require('url-join');




async function getNpmSemverVersion(baseVersion, npmName, registry) {
    const versions = await getNpmVersions(npmName, registry);
    const lastVersion = handleVersions(baseVersion, versions);
    return lastVersion;
}

async function getNpmLatestVersion(npmName, registry) {
    const versions = await getNpmVersions(npmName, registry);
    if (versions) {
        return versions.sort((a, b) => semver.gt(b, a))[0];
    }
    return null;
}

async function getNpmVersions(npmName, registry) {
    try {
        const data = await getNpmInfo(npmName, registry);
        return data.versions ? Object.keys(data.versions) : [];
    } catch (e) {
        console.log('getNpmVersions', e)
    }

}

function getNpmInfo(npmName, registry) {
    if (!npmName) return null;

    return axios.get(getUrl(registry, npmName)).then(res => {
        return res.status === 200 ? res.data : {};
    }).catch(e => {
        return Promise.reject(e)
    })
}

function getUrl(isOriginal = false, npmName) {
    return urlJoin(getDefaultRegistry(isOriginal), npmName)
}

function getDefaultRegistry(isOriginal = false) {
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}

/**
 * 
 * @param {*} baseVersion 
 * @param {*} versions 
 * @description 过滤并排序，获取最新版本号
 */
function handleVersions(baseVersion, versions) {
    const list = versions
        .filter(version => semver.satisfies(version, `>${baseVersion}`))
        .sort((a, b) => semver.gt(b, a) ? 1 : -1);
    return list[0]
}

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion,
    getDefaultRegistry,
    getNpmLatestVersion,
};


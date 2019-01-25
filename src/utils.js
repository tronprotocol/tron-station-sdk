const TronWeb = require("tronweb");
const nets = require("./nets.js");
const _ = require("lodash");

const NET = {
    MAIN: "main",
    TEST: "test"
};

function configureNet(net) {
    let tronweb;
    let defaultAddress;
    let isMain = false;

    switch (net) {
        case NET.MAIN:
            tronweb = new TronWeb(
                nets.main.fullNode,
                nets.main.solidityNode,
                nets.main.eventServer
            );
            defaultAddress = nets.main.defaultAddress;
            isMain = true;
            break;
        case NET.TEST:
            tronweb = new TronWeb(
                nets.test.fullNode,
                nets.test.solidityNode,
                nets.test.eventServer
            );
            defaultAddress = nets.test.defaultAddress;
            break;
        default:
            throw new Error("Invalid net");
    }

    this.tronweb = tronweb;
    this.defaultAddress = defaultAddress;

    return {
        tronweb: tronweb,
        defaultAddress: defaultAddress,
        isMain: isMain
    }
}

function convertSun(amount) {
    return parseFloat(amount / 1000000);
}

async function getChainParameterByName(parameter) {
    const params = await this.tronweb.trx.getChainParameters();
    const proposal = _.filter(params, ["key", parameter])[0];
    return proposal["value"];
}

async function getResourceByName(resource) {
    const resources = await this.tronweb.trx.getAccountResources(this.defaultAddress);
    if (resources === undefined) throw new Error("Error getting resource");
    return resources[resource];
}

async function getChainParametersByName(parameters) {
    const params = await this.tronweb.trx.getChainParameters();

    let object = {};
    for (let i = 0; i < parameters.length; i++) {
        const proposal = _.filter(params, ["key", parameters[i]])[0];
        object[parameters[i]] = proposal["value"];
    }

    return object;
}

async function getResourcesByName(resources, address) {
    if (address === undefined || !(this.tronweb.utils.crypto.isAddressValid(address))) address = this.defaultAddress;
    const accountResources = await this.tronweb.trx.getAccountResources(address);
    if (accountResources === undefined) throw new Error("Error getting resource");

    let object = {};
    for (let i = 0; i < resources.length; i++) {
        object[resources[i]] = accountResources[resources[i]];
    }

    return object;
}

function filterData(value) {
    return value === undefined ? 0 : value;
}

function hexStringToBytes(str) {
    let pos = 0;
    let len = str.length;
    if (len % 2 !== 0) {
        return null;
    }
    len /= 2;
    let hexA = [];
    for (let i = 0; i < len; i++) {
        let s = str.substr(pos, 2);
        let v = parseInt(s, 16);
        hexA.push(v);
        pos += 2;
    }
    return hexA;
}

module.exports = {
    configureNet,
    convertSun,
    getChainParameterByName,
    getResourceByName,
    filterData,
    getChainParametersByName,
    getResourcesByName,
    hexStringToBytes
};
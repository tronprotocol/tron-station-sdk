const utils = require("./utils.js");
const _ = require("lodash");

class TronStation {
    constructor(tronweb, isMain) {
        if(!tronweb)
            throw new Error('Expected instance of TronWeb');
        if (isMain === undefined || !(typeof isMain === "boolean"))
            throw new Error('Invalid value for isMain');

        this.tronweb = tronweb;
        this.defaultAddress = tronweb.defaultAddress;
        this.isMain = isMain;
        this.defaultTotalEnergyLimit = 50000000000;
    }

    async getChainParameters() {
        return this.tronweb.trx.getChainParameters();
    }

    async getResource(address) {
        if (!(this.tronweb.utils.crypto.isAddressValid(address))) throw new Error("Invalid address");
        return this.tronweb.trx.getAccountResources(address);
    }

    async calculateFrozenEnergy(amount) {
        if (amount === undefined) throw new Error("Invalid amount");
        amount = utils.convertSun(amount);
        if (isNaN(amount) || amount <= 0) throw new Error("Amount must be greater than zero");

        const totalEnergyWeight = await utils.getResourceByName("TotalEnergyWeight");
        let totalEnergyLimit = this.defaultTotalEnergyLimit;
        let paramValue = await utils.getChainParameterByName("getTotalEnergyLimit");
        if (paramValue !== undefined) totalEnergyLimit = paramValue;

        return (amount * totalEnergyLimit) / totalEnergyWeight;
    }

    async calculateBurnEnergy(amount) {
        if (amount === undefined) throw new Error("Invalid amount");
        if (isNaN(amount) || amount <= 0) throw new Error("Amount must be greater than zero");

        let energyFee = await utils.getChainParameterByName("getEnergyFee");
        if (energyFee === undefined) throw new Error("Error getting chain parameter");

        return amount / energyFee;
    }

    async calculateMaxEnergyLimit(address, feeLimit) {
        if (!(this.tronweb.utils.crypto.isAddressValid(address))) throw new Error("Invalid address");
        if (isNaN(feeLimit) || feeLimit <= 0) throw new Error("Fee limit must be greater than zero");
        if (feeLimit > 1000000000) throw new Error("Max fee limit has a max limit of 1000000000 sun");

        const account = await this.tronweb.trx.getAccount(address);
        if (account.balance === undefined) account.balance = 0;

        const parameters = ["getTotalEnergyLimit", "getEnergyFee"];
        const params = await utils.getChainParametersByName(parameters);

        const totalEnergyLimit = utils.filterData(params.getTotalEnergyLimit);
        const energyFee = utils.filterData(params.getEnergyFee);

        const resources = ["EnergyLimit", "EnergyUsed", "TotalEnergyWeight"];
        const accountResources = await utils.getResourcesByName(resources, address);
        const energyLimit = utils.filterData(accountResources.EnergyLimit);
        const energyUsed = utils.filterData(accountResources.EnergyUsed);
        const totalEnergyWeight = utils.filterData(accountResources.TotalEnergyWeight);

        const ratio = totalEnergyLimit / totalEnergyWeight;
        const accountTrxEnergy = (utils.filterData(account.balance) / energyFee);
        const accountTotalEnergy = energyLimit + accountTrxEnergy - energyUsed;
        const feeLimitEnergy = (feeLimit * ratio);

        let maxEnergyLimit;
        if (energyLimit > feeLimitEnergy) {
            maxEnergyLimit = Math.min(accountTotalEnergy, feeLimitEnergy);
        } else {
            maxEnergyLimit = accountTotalEnergy;
        }

        return {
            accountEnergy: energyLimit,
            accountEnergyUsed: energyUsed,
            accountTrxEnergy: accountTrxEnergy,
            accountTotalEnergy: accountTotalEnergy,
            feeLimit: feeLimit,
            feeLimitEnergy: feeLimitEnergy,
            maxEnergyLimit: maxEnergyLimit
        }
    }

    async calculateFrozenBandwidth(amount) {
        if (amount === undefined) throw new Error("Invalid amount");
        amount = utils.convertSun(amount);
        if (isNaN(amount) || amount <= 0) throw new Error("Amount must be greater than zero");

        const resources = ["TotalNetLimit", "TotalNetWeight"];
        const accountResources = await utils.getResourcesByName(resources);
        const totalEnergyLimit = utils.filterData(accountResources.TotalNetLimit);
        const totalEnergyWeight = utils.filterData(accountResources.TotalNetWeight);

        const bp = (amount * totalEnergyLimit) / totalEnergyWeight;
        return {
            bp: bp
        }
    }

    async getAccountBandwidth(address) {
        if (!(this.tronweb.utils.crypto.isAddressValid(address))) throw new Error("Invalid address");

        const account = await this.tronweb.trx.getAccount(address);
        if (account.balance === undefined) account.balance = 0;

        const resources = ["freeNetLimit", "freeNetUsed", "NetLimit", "NetUsed"];
        const accountResources = await utils.getResourcesByName(resources, address);

        const balance = utils.filterData(account.balance);
        const freebp = utils.filterData(accountResources.freeNetLimit);
        const freebpUsed = utils.filterData(accountResources.freeNetUsed);
        const accountbp = utils.filterData(accountResources.NetLimit);
        const accountbpUsed = utils.filterData(accountResources.NetUsed);
        const totalbp = freebp + accountbp - freebpUsed - accountbpUsed;

        return {
            balance: balance,
            freebp: freebp,
            freebpUsed: freebpUsed,
            accountbp: accountbp,
            accountbpUsed: accountbpUsed,
            totalbp: totalbp
        }
    }

    async getSrVoteRewardList() {
        const srs = await this.tronweb.trx.listSuperRepresentatives();
        let data = [];
        let rewardList = [];
        let totalVotes = _.sumBy(srs, sr => {
            return sr.voteCount;
        });

        let totalVoteReward = 16 * 20 * 60 * 24;
        let totalBlockReward = 2 * totalVoteReward;
        let srAmount = this.isMain ? 27 : srs.length;

        await Promise.all(
            srs.map(async sr => {
                let object = {};
                const account = await this.tronweb.trx.getAccount(sr.address);
                object.rank = 0;
                if (account.account_name !== undefined) {
                    object.name = this.tronweb.utils.bytes.bytesToString(utils.hexStringToBytes(account.account_name));
                } else {
                    object.name = sr.url;
                }

                object.url = sr.url;
                object.address = sr.address;
                object.votes = utils.filterData(sr.voteCount);
                object.percentage = (100 * (object.votes / totalVotes));
                object.role = "";
                object.voteReward = Math.ceil(totalVoteReward * (object.votes / totalVotes));
                object.blockReward = Math.ceil(totalBlockReward / srAmount);
                object.totalReward = object.voteReward + object.blockReward;
                data.push(object);
            })
        );

        data = _.sortBy(data, d => {
            return d.votes * -1;
        });

        data.map((sr, index) => {
            if (index < 27) {
                sr.rank = index + 1;
                sr.role = "sr";
                rewardList.push(sr);
            } else {
                sr.blockReward = 0;
                sr.totalReward = sr.voteReward;
                sr.rank = index + 1;
                sr.role = "candidate";
                rewardList.push(sr);
            }
        });

        return {
            totalVotes: totalVotes,
            rewardList: rewardList
        }
    }

    async calculateSrReward(votes, srAddress) {
        let addedVotes = parseFloat(utils.filterData(votes).toString());
        if (isNaN(addedVotes) || addedVotes <= 0) throw new Error("Votes must be greater than zero");

        srAddress = this.tronweb.address.toHex(srAddress);

        const object = await this.getSrVoteRewardList();
        let rewardList = object.rewardList;
        if (rewardList === undefined || rewardList.length === 0) throw new Error("Error getting reward list");

        const sortedList = [];

        const totalVotes = object.totalVotes + addedVotes;
        const result = _.filter(rewardList, item => item.address === srAddress);
        const totalVoteReward = 16 * 20 * 60 * 24;

        let sr;
        if (result !== undefined && result.length > 0) {
            sr = result[0];
            sr.votes = sr.votes + addedVotes;
            sr.totalVotes = totalVotes;
            sr.percentage = ((100 * sr.votes) / totalVotes);
            sr.voteReward = Math.ceil(totalVoteReward * (sr.votes / totalVotes));
        } else {
            sr = {
                rank: 0,
                name: "New Candidate",
                url: "N/A",
                address: "N/A",
                role: "candidate",
                votes: addedVotes,
                totalVotes: totalVotes,
                percentage: ((100 * addedVotes) / totalVotes),
                voteReward: Math.ceil(totalVoteReward * (addedVotes / totalVotes)),
                blockReward: 0,
                totalReward: Math.ceil(totalVoteReward * (addedVotes / totalVotes))
            };
            rewardList.push(sr);
        }

        rewardList = _.sortBy(rewardList, d => {
            return d.votes * -1;
        });

        rewardList.map((sr, index) => {
            if (index < 27) {
                sr.rank = index + 1;
                sr.role = "sr";
                sortedList.push(sr);
            } else {
                sr.blockReward = 0;
                sr.totalReward = sr.voteReward;
                sr.rank = index + 1;
                sr.role = "candidate";
                sortedList.push(sr);
            }
        });

        let newSr = _.filter(sortedList, item => item.address === "N/A");
        if (newSr !== undefined && newSr.length !== 0) {
            newSr = newSr[0];
            if (newSr.rank <= 27) {
                newSr.name = "New SR";
                let totalBlockReward = 2 * totalVoteReward;
                let srAmount = this.isMain ? 27 : srs.length;
                newSr.blockReward = Math.ceil(totalBlockReward / srAmount);
                newSr.totalReward = Math.ceil(newSr.voteReward + newSr.blockReward);
                sr = newSr;
            }
        }

        return sr;
    }
}

module.exports = TronStation;
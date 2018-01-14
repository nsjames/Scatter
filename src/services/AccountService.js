import {KeyPair, LocalStream, NetworkMessage, KeyPairAccount} from 'scattermodels'
import {InternalMessageTypes} from '../messages/InternalMessageTypes';
import Eos from 'eosjs';
import ecc from 'eosjs-ecc';

const CREATOR = 'inita';
const INITIAL_STAKE = 1;
export class AccountService {

    static findAccounts(keyPair){
        return new Promise((resolve, reject) => {
            this.getAccounts(keyPair).then(multires => {
                let accounts = [];
                multires.filter(x => x).map((account) => {
                    account.permissions.map(permissions => {
                        accounts.push({name:account.account_name, auth:permissions.perm_name, keys:permissions.required_auth.keys.map(x => x.key)});
                    });
                });
                accounts = accounts.filter(x => x.keys.indexOf(keyPair.publicKey) > -1);
                resolve(accounts.map(account => KeyPairAccount.fromJson({name:account.name, authority:account.auth})))
            }).catch(e => {
                console.log(e);
                resolve([])
            });
        });
    }

    static getAccounts(keyPair){
        return new Promise((resolve, reject) => {
            let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint()});
            eos.getKeyAccounts(keyPair.publicKey).then(res => {
                if(!res.hasOwnProperty('account_names')){ resolve([]); return false; }
                Promise.all(res.account_names.map(name => eos.getAccount(name).catch(e => resolve([])))).then(multires => {
                    resolve(multires)
                }).catch(e => {
                    console.log(e);
                    resolve([])
                });
            }).catch(e => {
                console.log(e);
                resolve([])
            });
        });
    }

    static getBalance(accountName, eos){
        return new Promise((resolve, reject) => {
            eos.getAccount(accountName)
                .then(x => resolve(x.eos_balance))
                .catch(e => resolve(0))
        })
    }

    static async createAccount(keyPair, desiredName){

        // TODO IMPORTANT: Do this outside of the extension.
        // There's no way to keep scatter's private key which is needed for creation private in this context.

        //TODO Handle multiple approved networks
        return await new Promise((resolve, reject) => {
            const selfStaking = keyPair.selfStake;
            const stakerName = selfStaking ? keyPair.selfStakeAccountName : CREATOR;
            const stakerKey = selfStaking ? keyPair.selfStakePrivateKey : '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
            let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint(), keyProvider:stakerKey});

            eos.newaccount({
                creator: stakerName,
                name: desiredName,
                owner: keyPair.publicKey,
                active: keyPair.publicKey,
                recovery: stakerName,
                deposit: `${INITIAL_STAKE} EOS`
            }).then(newAccount => {
                if(selfStaking) keyPair.reclaimed = true;
                keyPair.accounts = [
                    KeyPairAccount.fromJson({name:desiredName, authority:'active'}),
                    KeyPairAccount.fromJson({name:desiredName, authority:'owner'})
                ];
                resolve(newAccount.transaction_id);
            }).catch(e => {
                console.log("ERROR", e)
                if(e.indexOf('account_name_exists_exception') > -1){ reject('exists'); return false; }
                else if(e.indexOf('Invalid character') > -1){
                    let character = e.split('Invalid Character:')[1].split(' ')[1];
                    reject('invalid_character: '+character);
                    return false;
                }
                reject(false)
            })


        })
    }

    static getWalletTransactions(wallet, eosOnly = true, network = null){
        function exp2unix(trx){ return + new Date(trx.transaction.expiration) }
        return new Promise((resolve, reject) => {
            let networkedAccounts = wallet.networkAccountMap(network);

            Promise.all(Object.keys(networkedAccounts).map(endpoint => {
                const accounts = networkedAccounts[endpoint].reduce((a,b) => a.concat(b), []);
                return Promise.all(accounts.map(account => this.getTransactions(account, endpoint, eosOnly)))
            })).then(trxs => {
                const flattened = trxs.reduce((a,b) => a.concat(b), []).reduce((a,b) => a.concat(b), []);
                const sorted = flattened.sort((a,b) => exp2unix(a) < exp2unix(b) ? 1 : -1);
                resolve(sorted);
            })
        });
    }

    static getTransactions(account_name, endpoint, eosOnly = true){
        return new Promise((resolve, reject) => {
            Eos.Localnet({httpEndpoint:endpoint}).getTransactions({account_name})
                .then(result => {
                    let transactions = result.transactions.map(x => {x.account = account_name; return x})
                    if(eosOnly) transactions = transactions.filter(x => x.transaction.messages.map(m => m.code).reduce((a,b) => a.concat(b), []).indexOf('eos') > -1)
                    else transactions = transactions.filter(x => x.transaction.messages.map(m => m.code).reduce((a,b) => a.concat(b), []).indexOf('eos') === -1);
                    resolve(transactions)
                })
                .catch(e => resolve([]))
        });
    }

    // Let it be known, Scatter takes a fee for opening accounts.
    // Scatter will stake the initial contribution and then take double back on first transfer.
    // This ensures that there will always be money in holding for new accounts to be created.
    static reclaim(account, privateKey, network){
        return new Promise((resolve, reject) => {
            if(!account || !account.name.length || !privateKey.length) { resolve(false); return false; }
            let eos = Eos.Localnet({httpEndpoint: network.toEndpoint(), keyProvider: privateKey});
            eos.transfer({from: account.name, to: CREATOR, amount: INITIAL_STAKE*2, memo: 'Scatter account stake reclaim'}, {})
                .then(x => resolve(true))
                .catch(x => resolve(false));
        })
    }

}
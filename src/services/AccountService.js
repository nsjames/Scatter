import {KeyPair, LocalStream, NetworkMessage, KeyPairAccount} from 'scatterhelpers'
import {InternalMessageTypes} from '../messages/InternalMessageTypes';
import Eos from 'eosjs';

const CREATOR = 'inita';
const INITIAL_STAKE = 1;
export class AccountService {

    static findAccount(keyPair){
        return new Promise((resolve, reject) => {
            this.getAccount(keyPair).then(multires => {
                let accounts = [];
                multires.filter(x => x).map((account) => {
                    account.permissions.map(permissions => {
                        accounts.push({name:account.account_name, auth:permissions.perm_name, keys:permissions.required_auth.keys.map(x => x.key)});
                    });
                });
                accounts = accounts.filter(x => x.keys.indexOf(keyPair.publicKey) > -1);
                resolve(accounts.map(account => KeyPairAccount.fromJson({name:account.name, authority:account.auth})))
            }).catch(e => resolve([]));
        });
    }

    static getAccount(keyPair){
        return new Promise((resolve, reject) => {
            let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint()});
            eos.getKeyAccounts(keyPair.publicKey).then(res => {
                if(!res.hasOwnProperty('account_names')){ resolve([]); return false; }
                Promise.all(res.account_names.map(name => eos.getAccount(name).catch(e => console.log("Error getting account: ", e)))).then(multires => {
                    resolve(multires)
                }).catch(e => resolve([]));
            }).catch(e => resolve([]));
        });
    }

    static async createAccount(keyPair, desiredName){
        // TODO IMPORTANT: Do this outside of the extension.
        // There's no way to keep scatter's private key which is needed for creation private in this context.

        //TODO Handle multiple approved networks
        return await new Promise((resolve, reject) => {
            let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint(), keyProvider:'5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'});

            eos.newaccount({
                creator: CREATOR,
                name: desiredName,
                owner: keyPair.publicKey,
                active: keyPair.publicKey,
                recovery: CREATOR,
                deposit: `${INITIAL_STAKE} EOS`
            }).then(newAccount => {
                keyPair.accounts = [
                    KeyPairAccount.fromJson({name:desiredName, authority:'active'}),
                    KeyPairAccount.fromJson({name:desiredName, authority:'owner'})
                ];
                resolve(newAccount.transaction_id);
            }).catch(e => {
                if(e.indexOf('account_name_exists_exception') > -1){
                    reject('exists');
                    return false;
                }
                else if(e.indexOf('Invalid character') > -1){
                    let character = e.split('Invalid Character:')[1].split(' ')[1];
                    reject('invalid_character: '+character);
                    return false;
                }
                reject(false)
            })
        })
    }

    //TODO: These only work with table based contracts and not EOS
    // static getBalances(keyPair){
    //     return new Promise((resolve, reject) => {
    //         let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint()});
    //         let accountNames = keyPair.accounts.map(x => x.name).reduce((a,b) => a.indexOf(b) > -1 ? a : a.concat(b), []);
    //         Promise.all(accountNames.map(name => this.getBalance(name, eos)))
    //             .then(bals => resolve(bals.reduce((a,b) => a+b, 0)))
    //     })
    // }
    //
    // static getBalance(accountName, eos){
    //     return new Promise((resolve, reject) => {
    //         //TODO: Switch to real eos for production
    //         eos.getTableRows({json:true, table:'eos', code:'eos', scope:accountName})
    //             .then(x => resolve(x.rows.length ? x.rows[0].balance : 0))
    //             .catch(e => resolve(0))
    //     })
    // }

    //TODO: There is no way to get an accounts balance as of now, doing really bad stuff to get it.
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static getKeyPairBalance(keyPair){
        return new Promise((resolve, reject) => {
            let accountNames = keyPair.accounts.map(x => x.name).reduce((a,b) => a.indexOf(b) > -1 ? a : a.concat(b), []);
            Promise.all(keyPair.accounts.map(account => this.recurseEosTrxTillNoneLeft(account.name, keyPair.network.toEndpoint()))).then(trxs => {
                const flattened = trxs.reduce((a,b) => a.concat(b), []).reduce((a,b) => a.concat(b), []);
                const messages = flattened.map(x => x.transaction.messages).reduce((a,b) => a.concat(b), []);
                const input = messages.filter(x => accountNames.indexOf(x.data.to) > -1).map(x => x.data.amount).reduce((a,b) => a+b, 0);
                const output = messages.filter(x => accountNames.indexOf(x.data.from) > -1).map(x => x.data.amount).reduce((a,b) => a+b, 0);
                resolve(input - output);
            })
        });
    }

    static recurseEosTrxTillNoneLeft(account_name, endpoint, acc = [], originalResolver = null){
        return new Promise((resolve, reject) => {
            if(originalResolver === null) originalResolver = resolve;
            Eos.Localnet({httpEndpoint:endpoint}).getTransactions({account_name, skip_seq:acc.length})
                .then(result => {
                    let transactions = result.transactions
                    transactions = transactions.filter(x => x.transaction.messages.map(m => m.code).reduce((a,b) => a.concat(b), []).indexOf('eos') > -1);
                    if(!transactions.length) originalResolver(acc)
                    else this.recurseEosTrxTillNoneLeft(account_name, endpoint, acc.concat(transactions), originalResolver)
                })
                .catch(e => originalResolver(acc))
        });
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////








    static getWalletTransactions(wallet, eosOnly = true){
        function exp2unix(trx){ return + new Date(trx.transaction.expiration) }
        return new Promise((resolve, reject) => {
            let networkedAccounts = wallet.networkAccountMap();

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
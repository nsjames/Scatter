import {KeyPair, LocalStream, NetworkMessage, KeyPairAccount} from 'scatterhelpers'
import {InternalMessageTypes} from '../messages/InternalMessageTypes';
import Eos from 'eosjs';

const CREATOR = 'inita';
// const INITIAL_STAKE = 0.0001;
const INITIAL_STAKE = 1;
export class AccountService {

    static findAccount(keyPair){
        return new Promise((resolve, reject) => {
            let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint()});
            eos.getKeyAccounts(keyPair.publicKey).then(res => {
                if(!res.hasOwnProperty('account_names')){ resolve([]); return false; }
                Promise.all(res.account_names.map(name => eos.getAccount(name).catch(e => console.log("Error getting account: ", e)))).then(multires => {
                    let accounts = [];
                    multires.filter(x => x).map((account) => {
                        account.permissions.map(permissions => {
                            accounts.push({name:account.account_name, auth:permissions.perm_name, keys:permissions.required_auth.keys.map(x => x.key)});
                        });
                    });
                    accounts = accounts.filter(x => x.keys.indexOf(keyPair.publicKey) > -1);
                    resolve(accounts.map(account => KeyPairAccount.fromJson({name:account.name, authority:account.auth})))
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

    // Let it be known, Scatter takes a fee for opening accounts.
    // Scatter will stake the initial contribution and then take double back on first transfer.
    // This ensures that there will always be money in holding for new accounts to be created.
    static reclaim(account, privateKey, network){
        return new Promise((resolve, reject) => {
            if(!account || !account.name.length || !privateKey.length) { resolve(false); return false; }

            let eos = Eos.Localnet({httpEndpoint: network.toEndpoint(), keyProvider: privateKey});

            //TODO FOR PRODUCTION: Change to real eos transfer
            // eos.transfer({from: account.name, to: CREATOR, amount: INITIAL_STAKE*2, memo: 'Scatter account stake reclaim'}, {});

            eos.contract('currency')
                .then(currency => currency.transfer(account.name, CREATOR, INITIAL_STAKE*2)
                    .then(x => {console.log(x);resolve(true)})
                    .catch(x => resolve(false)))
                .catch(x => resolve(false))
        })
    }

}
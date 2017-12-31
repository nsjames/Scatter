import Eos from 'eosjs'
import {KeyPairAccount} from '../models/keypair-account';

let eos = Eos.Testnet();
export class EOSService {

    static getAccountsFromPublicKey(publicKey){
        console.log("Searching for accounts for: " + publicKey)
        return new Promise((resolve, reject) => {
            eos.getKeyAccounts(publicKey).then(res => {
                if(!res.hasOwnProperty('account_names')){ resolve([]); return false; }
                Promise.all(res.account_names.map(name => eos.getAccount(name))).then(multires => {
                    let accounts = [];
                    multires.filter(x => x).map(account => {
                        account.permissions.map(permissions => {
                            accounts.push({name:account.account_name, auth:permissions.perm_name, keys:permissions.required_auth.keys.map(x => x.key)});
                        });
                    });
                    accounts = accounts.filter(x => x.keys.indexOf(publicKey) > -1);
                    resolve(accounts.map(account => KeyPairAccount.fromJson({name:account.name, authority:account.auth})))
                }).catch(e => {
                    console.log("Error getting accounts from public key: ", e);
                    resolve([]);
                });
            });
        })
    }

}
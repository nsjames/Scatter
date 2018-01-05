import {KeyPair, LocalStream, NetworkMessage, KeyPairAccount} from 'scatterhelpers'
import {InternalMessageTypes} from '../messages/InternalMessageTypes';
import Eos from 'eosjs';

const CREATOR = 'inita';
export class AccountService {

    static findAccount(keyPair){
        return new Promise((resolve, reject) => {
            let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint()});
            eos.getKeyAccounts(keyPair.publicKey).then(res => {
                if(!res.hasOwnProperty('account_names')){ resolve([]); return false; }
                Promise.all(res.account_names.map(name => eos.getAccount(name).catch(e => console.log("Inner error: ", e)))).then(multires => {
                    let accounts = [];
                    multires.filter(x => x).map((account) => {
                        account.permissions.map(permissions => {
                            accounts.push({name:account.account_name, auth:permissions.perm_name, keys:permissions.required_auth.keys.map(x => x.key)});
                        });
                    });
                    accounts = accounts.filter(x => x.keys.indexOf(keyPair.publicKey) > -1);
                    resolve(accounts.map(account => KeyPairAccount.fromJson({name:account.name, authority:account.auth})))
                }).catch(e => {
                    console.log("Error getting accounts from public key: ", e);
                    resolve([]);
                });
            });
        })
    }

    static async createAccount(keyPair, desiredName){
        // TODO IMPORTANT: Do this outside of the extension.
        // There's no way to keep scatter's private key which is needed for creation private in this context.

        console.log(keyPair.network.toEndpoint());


        //TODO Handle multiple approved networks
        return await new Promise((resolve, reject) => {
            let eos = Eos.Localnet({httpEndpoint:keyPair.network.toEndpoint(), keyProvider:'5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'});

            eos.newaccount({
                creator: CREATOR,
                name: desiredName,
                owner: keyPair.publicKey,
                active: keyPair.publicKey,
                recovery: CREATOR,
                deposit: '0.0001 EOS'
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
                reject(false)
            })
        })
    }

    static async reclaim(keyPair){
        return await new Promise((resolve, reject) => {
            let account = keyPair.accounts.find(x => !x.reclaimed)
            if(account) {
                LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, keyPair.publicKey)).then(privateKey => {
                    let eos = Eos.Localnet({httpEndpoint: keyPair.network.toEndpoint(), keyProvider: privateKey});

                    //TODO: Change to real eos transfer
                    // eos.transfer({from: account, to: 'testacc', amount: 0.0001, memo: 'Scatter account stake reclaim'}, {});

                    eos.contract('currency')
                        .then(currency => currency.transfer(account.name, CREATOR, 100)
                        .then(x => resolve(true))
                        .catch(x => resolve(false)))
                        .catch(x => resolve(false))
                }).catch(x => resolve(false))
            } else resolve(false);
        })
    }

}
import Eos from 'eosjs'
import {KeyPairAccount} from 'scattermodels';


const config = {
    httpEndpoint: 'http://192.168.56.101:8888'
};

let eos = Eos.Testnet(config);
export class EOSService {

    // TODO: There's an issue with testnet that it sometimes rejects requests.
    // For important stuff like this is might be worthwhile to hit the endpoint
    // a few times to verify that there is indeed nothing there.
    static getAccountsFromPublicKey(publicKey){
        console.log("Searching for accounts for: " + publicKey)
        console.log(eos);
        return new Promise((resolve, reject) => {
            eos.getKeyAccounts(publicKey).then(res => {
                if(!res.hasOwnProperty('account_names')){ resolve([]); return false; }
                Promise.all(res.account_names.map(name => eos.getAccount(name).catch(e => console.log("Inner error: ", e)))).then(multires => {
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
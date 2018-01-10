import Eos from 'eosjs';
import {LocalStream, NetworkMessage} from 'scatterhelpers';
import {InternalMessageTypes} from '../messages/InternalMessageTypes';
import {AccountService} from './AccountService';

export class TransferService {

    static send(from, to, quantity, network, fromPublicKey){
        quantity = quantity*10000;

        return new Promise((resolve, reject) => {
            function err(msg){ window.ui.pushError('Unable To Send', msg) }

            if(!from || !from.length){ err('Sender is invalid.'); reject(false); return false; }
            if(!to || !to.length){ err('Recipient is invalid.'); reject(false); return false; }
            if(!quantity){ err('You must send at least 0.0001'); reject(false); return false; }
            if(!network ||!fromPublicKey || !fromPublicKey.length) { err('Something bad has happened.'); reject(false); return false; }


            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, fromPublicKey)).then(privateKey => {
                console.log('privateKey', privateKey, privateKey === null, !privateKey.length)

                let eos = Eos.Localnet({httpEndpoint: network.toEndpoint(), keyProvider: privateKey});
                AccountService.getBalance(from, eos).then(balance => {
                    if(balance < quantity){
                        err(`Insufficient Funds: ${balance}`);
                        reject(false);
                        return false;
                    }
                    // Since we have the ability, let's make sure the recipient exists
                    eos.getAccount(to).then(res => {
                        eos.transfer({from, to, amount:quantity, memo: ''}, {})
                            .then(x => {resolve(x)})
                            .catch(x => {err('Could not complete transfer'); reject(false)})
                    }).catch(e => { err(`The account ${to} does not seem to exist on ${network.name}@${network.host}`); reject(false); })
                }).catch(e => { err('Error getting balance for '+from); console.log(e); reject(false); })
            }).catch(e => { err('There was a problem decrypting the private key for ' + from); console.log(e); reject(false); })




        })
    }

}
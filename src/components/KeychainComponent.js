import {ScatterData} from '../models/scatter';
import {LocalStream} from '../streams/LocalStream';
import {Wallet} from '../models/wallet';
import {EOSKeygen} from '../cryptography/EOSKeygen';
import {PasswordHasher} from '../cryptography/PasswordHasher'
import {KeyPair} from '../models/keypair'
import {KeyPairAccount} from '../models/keypair-account'
import {Keychain} from '../models/keychain';
import {EOSService} from '../services/EOSService'


const KeychainComponent = {
    template:require('../partials/keychain.html'),

    data() {
        return {
            listStates:{HISTORY:'history', DOMAINS:'domains', CHOOSE_WALLET:'choose_wallet'},
            listState:'history',
            listItems:[],

            wallets:Vue.prototype.scatterData.data.keychain.wallets,
            openedWallet:Vue.prototype.scatterData.data.keychain.getOpenWallet(),

            generatingNewKey:false,
            newKeyPair:KeyPair.placeholder(),
            preEditedWallet:Wallet.placeholder()
        };
    },
    methods: {
        setData:function(obj){ console.log("Setting data: ", obj); },

        lock:function(){
            LocalStream.send({msg:'lock'}).then(locked => {
                Vue.prototype.scatterData = ScatterData.fromJson(locked);
                this.$router.push({name:'auth'});
            })
        },

        selectListState:function(state){ this.listState = state; },
        selectingWallet:function(){ return this.listState === this.listStates.CHOOSE_WALLET; },
        toggleSelectingWallet:function(){ this.selectListState(this.selectingWallet() ? this.listStates.HISTORY : this.listStates.CHOOSE_WALLET); },
        selectWallet:function(name){
            console.log(`Opening wallet ${name}`)
            LocalStream.send({msg:'open', name}).then(response => {
                console.log("Response?: ", response)
                //TODO: Error handling
                if(!response) {
                    console.log(`There was an issue opening this wallet: ${name}`);
                    return false;
                }

                Vue.prototype.scatterData = ScatterData.fromJson(response);
                this.openedWallet = Vue.prototype.scatterData.data.keychain.getOpenWallet();
                this.wallets = Vue.prototype.scatterData.data.keychain.wallets;
                this.listState = this.listStates.HISTORY;
            })
        },

        createNewWallet:function(){

            this.openedWallet = Wallet.newWallet();
        },


        // Editing a wallet ------------------------------------
        // -----------------------------------------------------
        edit:function(){
            this.preEditedWallet = this.openedWallet.clone();
            LocalStream.send({msg:'keychain'}).then(response => {
                //TODO: Error handling
                if(!response) {
                    console.log("There was an issue decrypting the wallet")
                    return false;
                }

                let wallet = response.data.keychain.wallets.find(x => x.uniqueKey === this.openedWallet.uniqueKey);
                this.openedWallet.keyPairs = wallet.keyPairs.map(x => KeyPair.fromJson(x));
                this.openedWallet.edit();
            })

        },

        importPrivateKey:function(){
            let keyPair = this.newKeyPair.clone();
            //TODO: Error handling
            if(!EOSKeygen.validPrivateKey(keyPair.privateKey)) {
                alert("invalid private key")
                return false;
            }
            keyPair.publicKey = EOSKeygen.privateToPublic(keyPair.privateKey);
            if(this.openedWallet.hasKey(keyPair.publicKey)) {
                alert("key already exists in wallet")
                return false;
            }

            EOSService.getAccountsFromPublicKey(keyPair.publicKey).then(keyPairAccounts => {
                keyPair.setAccounts(keyPairAccounts);
                this.openedWallet.keyPairs.push(keyPair);
                this.newKeyPair = KeyPair.placeholder();
            })
        },

        generateNewKey:function(){
            this.newKeyPair = EOSKeygen.generateKeys();
            if(!this.openedWallet.keyPairs.length) this.openedWallet.default = this.newKeyPair.publicKey;
            this.openedWallet.keyPairs.push(this.newKeyPair);
            this.newKeyPair = KeyPair.placeholder();
        },

        saveWallet:function(){
            //TODO: Error handling
            if(!this.openedWallet.name.length){
                alert("Wallet must have a name");
                return false;
            }

            if(!this.openedWallet.keyPairs.filter(x => !x.removed).length){
                alert("Wallet must have at least one key");
                return false;
            }

            if(this.wallets.filter(x => x.uniqueKey !== this.openedWallet.uniqueKey && x.name === this.openedWallet.name).length){
                alert("Wallet must have unique names");
                return false;
            }

            if(this.wallets.length) this.wallets = this.wallets.filter(x => x.uniqueKey !== this.preEditedWallet.uniqueKey);
            this.wallets.push(this.openedWallet);

            let scatter = Vue.prototype.scatterData.clone();
            scatter.data.keychain.wallets = this.wallets;

            ScatterData.update(scatter).then(saved => {
                Vue.prototype.scatterData = ScatterData.fromJson(saved);
                this.wallets = Vue.prototype.scatterData.data.keychain.wallets;
                this.openedWallet = this.wallets.find(x => x.lastOpened);
                this.openedWallet.stopEditing();
            })


        },
        cancelEditing:function(){
            //TODO: Error checking
            if(!this.wallets.length) {
                alert("You need at least one wallet");
                return false;
            }

            if(this.openedWallet.uniqueKey !== this.wallets.find(x => x.lastOpened).uniqueKey) this.openedWallet = this.wallets.find(x => x.lastOpened);
            else this.openedWallet = this.preEditedWallet;
        }
    }

};

module.exports = KeychainComponent;
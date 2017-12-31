import {ScatterData} from '../models/scatter';
import {LocalStream} from '../streams/LocalStream';
import {Wallet} from '../models/wallet';
import {EOSKeygen} from '../cryptography/EOSKeygen';
import {PasswordHasher} from '../cryptography/PasswordHasher'
import {KeyPair} from '../models/keypair'
import {KeyPairAccount} from '../models/keypair-account'


const KeychainComponent = {
    template:require('../partials/keychain.html'),

    data() {
        return {
            listState:'history',
            listItems:[],

            wallets:Vue.prototype.scatterData.data.keychain.wallets || [],
            openedWallet:Vue.prototype.scatterData.data.keychain.wallets[0] || Wallet.newWallet(),

            generatingNewKey:false,
            newKeyPair:KeyPair.placeholder(),
            preEditedWallet:Wallet.placeholder()
        };
    },
    methods: {
        setData:function(obj){ console.log("Setting data: ", obj); },

        toggleListState:function(){ this.listState = this.listState === 'history' ? 'domains' : 'history' },
        lock:function(){
            console.log("Locking");
            LocalStream.send({msg:'lock'}).then(locked => {
                console.log("LOCKED?: ", locked)
                Vue.prototype.scatterData = ScatterData.fromJson(locked);
                this.$router.push({name:'auth'});
            })
        },


        // Editing a wallet ------------------------------------
        // -----------------------------------------------------
        edit:function(){
            this.preEditedWallet = this.openedWallet.clone();
            this.openedWallet.edit();
        },
        cancel:function(){
            this.openedWallet = this.preEditedWallet;
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

            // TODO: Get accounts..

            this.openedWallet.keyPairs.push(keyPair);
            this.newKeyPair = KeyPair.placeholder();
        },

        generateNewKey:function(){
            this.newKeyPair = EOSKeygen.generateKeys();
            if(!this.openedWallet.keyPairs.length) this.openedWallet.default = this.newKeyPair.publicKey;

            // TODO: Remove for production, just UI testing
            // if(this.openedWallet.keyPairs.length < 1) this.newKeyPair.accounts.push(KeyPairAccount.fromJson({name:'Test', authority:'Owner'}))
            // if(this.openedWallet.keyPairs.length < 2) this.newKeyPair.accounts.push(KeyPairAccount.fromJson({name:'Test', authority:'Active'}))

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

            this.openedWallet.prepareForSaving();
            if(this.wallets.length) this.wallets = this.wallets.filter(x => x.name !== this.preEditedWallet.name);
            this.wallets.push(this.openedWallet);

            ScatterData.update(Vue.prototype.scatterData).then(saved => {
                console.log("Saved: ", saved)
                this.wallets = Vue.prototype.scatterData.data.keychain.wallets;
                this.openedWallet = this.wallets.filter(x => x.name === this.openedWallet.name)[0];
                this.openedWallet.stopEditing();
            })


        }
    }

};

module.exports = KeychainComponent;
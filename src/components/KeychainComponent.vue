<template>
    <section class="keychain-component">




        <section v-if="!openedWallet.editing">
            <section class="dashboard">
                <section class="dup">
                    <figure class="lock" v-on:click="lock"><i class="fa fa-unlock-alt"></i></figure>
                    <figure class="edit" v-on:click="edit"><i class="fa fa-pencil"></i></figure>
                    <figure class="wallet-name" v-on:click="toggleSelectingWallet">{{openedWallet.name}}</figure>
                    <figure class="wallet-keys">{{openedWallet.keyPairs.length}} keys</figure>
                    <section class="send-recv">
                        <figure>Send</figure>
                        <figure>Recv</figure>
                    </section>
                </section>

                <section class="ddown">
                    <section class="fifty">
                        <p class="blue"><b>EOS</b><span>{{openedWallet.balance}}</span></p>
                        <p><b>USD</b><span>{{openedWallet.balance * openedWallet.lastKnownConversionRate}}</span></p>
                    </section>
                    <section class="fifty">
                        <section class="list-switch" :class="{'active':listState==='history'}" v-on:click="selectListState('history')"><i class="fa fa-history"></i></section>
                        <section class="list-switch" :class="{'active':listState==='domains'}" v-on:click="selectListState('domains')"><i class="fa fa-globe"></i></section>
                    </section>
                </section>
            </section>


            <section class="data-list" v-if="!selectingWallet()">

                <section v-if="listItems.length">
                    <section class="item event" v-for="listItem in listItems">
                        <figure class="fifty">
                            <figure class="title">May 22nd, 2017</figure>
                            <figure class="sub-title">forseen.com</figure>
                        </figure>
                        <figure class="fifty">
                            <figure class="coin">EOS</figure>
                            <figure class="amount">0.004854</figure>
                        </figure>
                    </section>
                </section>

                <section v-if="!listItems.length">
                    <section class="no-items" v-if="listState==='history'">
                        <figure class="title">No transactions could be found for this wallet..</figure>
                        <figure class="sub-title">Send tokens to a key in this account.</figure>
                    </section>
                    <section class="no-items" v-if="listState==='domains'">
                        <figure class="title">You have not granted any domains access to any wallets.</figure>
                        <figure class="sub-title">Once you start browsing websites integrated with Scatter you will be able to moderate their access to your wallets.</figure>
                    </section>
                </section>


            </section>

            <section class="data-list" v-if="selectingWallet()">
                <section class="item wallet" v-on:click="createNewWallet">
                    <figure class="name">Create a new wallet</figure>
                    <figure class="key">You can have multiple wallets, each with multiple keys and authorities.</figure>
                </section>
                <section class="item wallet" v-on:click="selectWallet(wallet.name)" v-for="wallet in wallets">
                    <figure class="keys"><i class="fa fa-key"></i>{{wallet.keyPairs.length}}</figure>
                    <figure class="name">{{wallet.name}} </figure>
                </section>
            </section>




        </section>






        <section v-if="openedWallet.editing">
            <section class="dashboard">
                <section class="dup editing">
                    <input placeholder="Name your wallet" class="wallet-name" v-model="openedWallet.name" />
                </section>

                <section class="ddown editing">
                    <scatter-button text="Cancel" is-red="true" is-half="true" v-on:clicked="cancelEditing"></scatter-button>
                    <scatter-button text="Save" is-half="true" v-on:clicked="saveWallet"></scatter-button>
                </section>
            </section>

            <section class="data-list">

                <section class="item editing" v-for="keyPair in openedWallet.keyPairs">
                    <section v-if="!keyPair.removed">
                        <section class="keypair-accounts">

                            <section class="authority" v-if="keyPair.getHighestAuthority() !== 'No account found'" :class="{'warn':keyPair.hasOwnerAuthority()}">
                                {{keyPair.getHighestAuthority()}}
                                <figure class="info" v-if="keyPair.accounts.length">
                                    <i class="fa fa-info"></i>
                                    <section class="box">
                                        <section class="account" v-for="account in keyPair.accounts">
                                            <figure class="auth" :class="{'is-owner':account.authority.toLowerCase() === 'owner'}">{{account.authority}}</figure>
                                            <figure class="name">{{account.name}}</figure>
                                        </section>
                                    </section>
                                </figure>
                            </section>

                            <section class="authority" v-else>
                                <input class="account-name-input" v-model="keyPair.tempName" placeholder="Name this account" />
                            </section>



                            <figure class="action-button" v-on:click="openedWallet.setDefaultKeyPair(keyPair)" :class="{'active':openedWallet.defaultPublicKey === keyPair.publicKey}">Default</figure>
                            <figure class="action-button" v-on:click="keyPair.remove()">Delete</figure>
                        </section>
                        <figure class="public-key">
                            <i class="fa fa-key"></i>
                            {{truncateKey(keyPair.publicKey)}}
                        </figure>
                    </section>
                    <section v-if="keyPair.removed">
                        <section class="keypair-accounts">
                            <figure class="deleted">{{truncateKey(keyPair.publicKey)}}</figure>
                            <figure class="action-button" v-on:click="keyPair.revertRemoval()">Revert Deletion</figure>
                        </section>
                    </section>
                </section>


                <section class="edit-wallet-actions">
                    <scatter-button text="Generate New Key" v-on:clicked="generateNewKey"></scatter-button>

                    <figure class="line"></figure>
                    <section class="input-container">
                        <figure class="icon"><i class="fa fa-key"></i></figure>
                        <input class="with-icon" placeholder="Private Key" type="password" v-model="newKeyPair.privateKey" />
                    </section>

                    <scatter-button text="Import" v-on:clicked="importPrivateKey"></scatter-button>
                </section>
            </section>
        </section>



    </section>
</template>
<script>
    import Vue from 'vue';
    import {Keychain, KeyPair, Wallet, ScatterData, LocalStream, NetworkMessage} from 'scattermodels'
    import {EOSKeygen} from '../cryptography/EOSKeygen'
    import {InternalMessageTypes} from '../messages/InternalMessageTypes';
    import {AccountService} from '../services/AccountService';

    export default {
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
                LocalStream.send(NetworkMessage.signal(InternalMessageTypes.LOCK)).then(locked => {
                    Vue.prototype.scatterData = ScatterData.fromJson(locked);
                    this.$router.push({name:'auth'});
                })
            },

            selectListState:function(state){ this.listState = state; },
            selectingWallet:function(){ return this.listState === this.listStates.CHOOSE_WALLET; },
            toggleSelectingWallet:function(){ this.selectListState(this.selectingWallet() ? this.listStates.HISTORY : this.listStates.CHOOSE_WALLET); },
            createNewWallet:function(){ this.openedWallet = Wallet.newWallet(); },
            selectWallet:function(name){
                LocalStream.send(NetworkMessage.payload(InternalMessageTypes.OPEN, name)).then(response => {
                    //TODO: Error handling
                    if(!response) {
                        alert(`There was an issue opening this wallet: ${name}`);
                        return false;
                    }

                    Vue.prototype.scatterData = ScatterData.fromJson(response);
                    this.openedWallet = Vue.prototype.scatterData.data.keychain.getOpenWallet();
                    this.wallets = Vue.prototype.scatterData.data.keychain.wallets;
                    this.listState = this.listStates.HISTORY;
                })
            },



            edit:function(){
                this.preEditedWallet = this.openedWallet.clone();
                LocalStream.send(NetworkMessage.signal(InternalMessageTypes.KEYCHAIN)).then(response => {
                    //TODO: Error handling
                    if(!response) {
                        alert("There was an issue decrypting the wallet")
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

                keyPair.network = Vue.prototype.scatterData.data.settings.currentNetwork.clone();
                console.log(keyPair, Vue.prototype.scatterData.data.settings)
                AccountService.findAccount(keyPair).then(keyPairAccounts => {
                    if(!keyPairAccounts.length) {
                        // TODO Error handling
                        alert('Imported keys must already be associated with an account');
                        this.newKeyPair = KeyPair.placeholder();
                        return false;
                    }

                    keyPair.setAccounts(keyPairAccounts);
                    keyPair.reclaimed = true;
                    this.openedWallet.keyPairs.push(keyPair);
                    this.newKeyPair = KeyPair.placeholder();
                })
            },

            generateNewKey:function(){
                //TODO Error handling

                if(this.wallets.concat(this.openedWallet).find(x => x.hasUnreclaimedKey())){
                    alert('You must pay back your account fees before creating another key.')
                    return false;
                }
                this.newKeyPair = EOSKeygen.generateKeys();
                this.newKeyPair.network = Vue.prototype.scatterData.data.settings.currentNetwork.clone();
                if(!this.openedWallet.keyPairs.length) this.openedWallet.defaultPublicKey = this.newKeyPair.publicKey;
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

                let newKeyPair = this.wallets.concat(this.openedWallet).map(x => x.keyPairs).reduce((a,b) => a.concat(b), []).find(key => !key.accounts.length);
                console.log('new key pair?', newKeyPair)
                let accountCreated = null;
                if(newKeyPair){
                    if(!newKeyPair.hasOwnProperty('tempName') || !newKeyPair.tempName || !newKeyPair.tempName.length){
                        alert('New accounts must be named');
                        return false;
                    }
                    accountCreated = AccountService.createAccount(newKeyPair, newKeyPair.tempName);
                } else accountCreated = new Promise((res,rej) => res(''));


                accountCreated
                    .then(trx_id => {
                        let scatter = Vue.prototype.scatterData.clone();

                        if(this.wallets.length) scatter.data.keychain.wallets = this.wallets.filter(x => x.uniqueKey !== this.preEditedWallet.uniqueKey);
                        scatter.data.keychain.wallets.push(this.openedWallet);

                        ScatterData.update(scatter).then(saved => {
                            Vue.prototype.scatterData = ScatterData.fromJson(saved);
                            this.wallets = Vue.prototype.scatterData.data.keychain.wallets;
                            this.openedWallet = this.wallets.find(x => x.lastOpened);
                            this.openedWallet.stopEditing();
                        })
                    })
                    .catch(err => {
                        //TODO: Error handling
                        if(err === 'exists') alert('This account name already exists');
                        else console.log(err);
                        return false;
                    });
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
</script>
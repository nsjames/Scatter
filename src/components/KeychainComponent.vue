<template>
    <section class="keychain-component">




        <section v-if="!openedWallet.editing">
            <section class="dashboard">
                <section class="dup">
                    <figure class="lock" v-on:click="lockKeychain"><i class="fa fa-unlock-alt"></i></figure>
                    <figure class="edit" v-on:click="edit"><i class="fa fa-pencil"></i></figure>
                    <figure class="wallet-name" v-on:click="toggleSelectingWallet">{{openedWallet.name}}</figure>
                    <figure class="wallet-keys">{{openedWallet.keyPairsInNetwork(currentNetwork).length}} of {{openedWallet.keyPairs.length}} keys on {{currentNetwork.name}}</figure>
                    <section class="send-recv">
                        <router-link :to="{name:'send'}">Send</router-link>
                    </section>
                </section>

                <section class="ddown">
                    <section class="fifty">
                        <p class="blue"><b>EOS</b><span>{{openedWallet.networkBalance(currentNetwork) | money | truncdec(4)}}</span></p>
                        <p><b>USD</b><span>{{openedWallet.networkBalance(currentNetwork) * 10.88 | money | truncdec(2)}}</span></p>
                    </section>
                    <section class="fifty">
                        <section class="list-switch" :class="{'active':listState===listStates.HISTORY}" v-on:click="selectListState(listStates.HISTORY)"><i class="fa fa-history"></i></section>
                        <section class="list-switch" :class="{'active':listState===listStates.CONTRACTS}" v-on:click="selectListState(listStates.CONTRACTS)"><i class="fa fa-globe"></i></section>
                    </section>
                </section>
            </section>

            <section class="data-list" v-if="!selectingWallet()">
                <section v-if="listItems.length">
                    <section class="item event" v-for="item in listItems">
                        <figure class="fifty">
                            <figure class="sub-title">
                                <i>{{item.transaction.messages[0].data.from}}</i>
                                <i>to</i>
                                <i>{{item.transaction.messages[0].data.to}}</i>
                            </figure>
                            <figure class="title">{{item.transaction.expiration | expiration}}</figure>
                            <figure class="sub-title trx-id">{{item.transaction_id}}</figure>
                            <figure class="sub-title trx-id"><b>{{item.transaction.messages[0].data.memo}}</b></figure>
                        </figure>
                        <figure class="fifty" v-if="isEosTransfer(item)">
                            <figure class="amount" :class="{'spent':wasSpent(item)}">{{wasSpent(item) ? '-' : '+'}}{{ item | transactionSum }}</figure>
                            <figure class="coin">EOS</figure>
                        </figure>

                        <figure class="fifty" v-else>
                            <figure class="coin" v-for="code in transactionNames(item)">{{code}}</figure>
                        </figure>
                    </section>
                </section>

                <section v-if="!listItems.length">
                    <section class="no-items" v-if="listState===listStates.HISTORY">
                        <figure class="title">No EOS transfers could be found for this wallet..</figure>
                        <figure class="sub-title">Send or Receive tokens to a key in this account.</figure>
                    </section>
                    <section class="no-items" v-if="listState===listStates.CONTRACTS">
                        <figure class="title">No Contract transactions could be found for this wallet..</figure>
                        <figure class="sub-title">Once you start browsing websites integrated with Scatter you will see contract transactions here.</figure>
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
                    <scatter-button text="Cancel" is-red="true" v-bind:is-half="this.wallets.length" v-if="this.wallets.length" v-on:clicked="cancelEditing"></scatter-button>
                    <scatter-button text="Save" v-bind:is-half="this.wallets.length" v-on:clicked="saveWallet"></scatter-button>
                </section>
            </section>

            <section class="data-list">

                <section class="item editing" v-for="keyPair in openedWallet.keyPairs">
                    <section v-if="!keyPair.removed">
                        <section class="keypair-accounts">

                            <section class="authority" v-if="keyPair.getHighestAuthority() !== 'No account found'" :class="{'warn':keyPair.hasOwnerAuthority()}">
                                {{keyPair.getHighestAuthorityName()}}
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


                            <figure class="action-button" v-on:click="removeKeyPair(keyPair)">Delete</figure>
                            <figure class="action-button" v-if="!keyPair.accounts.length" :class="{'active':keyPair.selfStake}" v-on:click="keyPair.selfStake = !keyPair.selfStake">Self Stake</figure>

                            <section class="authority self-staking" v-if="keyPair.selfStake && !keyPair.accounts.length">
                                <input class="account-name-input" v-model="keyPair.selfStakePrivateKey" type="password" placeholder="Staker Private Key" />
                                <input class="account-name-input" v-model="keyPair.selfStakeAccountName" placeholder="Name of Staking Account" />
                            </section>
                        </section>
                        <figure class="public-key">
                            <i class="fa fa-money" style="width:15px;"></i>
                            {{keyPair.balance | money}}
                        </figure>
                        <figure class="network">
                            <i class="fa fa-globe" style="width:15px;"></i>
                            <b>{{`${keyPair.network.name} `}}</b>
                            ({{keyPair.network.unique()}})
                        </figure>
                    </section>
                    <section v-if="keyPair.removed">
                        <section class="keypair-accounts">
                            <figure class="deleted">{{keyPair.truncateKey()}}</figure>
                            <figure class="action-button" v-on:click="keyPair.revertRemoval()">Revert Deletion</figure>
                        </section>
                    </section>
                </section>


                <section class="edit-wallet-actions">
                    <scatter-button text="Generate New Key" v-on:clicked="generateNewKey"></scatter-button>

                    <figure class="line"></figure>
                    <section class="input-container">
                        <figure class="icon"><i class="fa fa-key"></i></figure>
                        <input class="with-icon" placeholder="Private Key" type="password" v-model="importingKey.privateKey" />
                    </section>

                    <scatter-button text="Import" v-on:clicked="importPrivateKey"></scatter-button>
                </section>
            </section>
        </section>



    </section>
</template>
<script>
    import Vue from 'vue';
    import {Keychain, KeyPair, Wallet, ScatterData, LocalStream, NetworkMessage} from 'scatterhelpers'
    import {EOSKeygen} from '../cryptography/EOSKeygen'
    import {InternalMessageTypes} from '../messages/InternalMessageTypes';
    import {AccountService} from '../services/AccountService';

    const listStates = {HISTORY:'history', CONTRACTS:'contracts', CHOOSE_WALLET:'choose_wallet'};
    export default {
        data() {
            return {
                listStates,
                listState:listStates.HISTORY,
                listItems:[],

                wallets:Vue.prototype.scatterData.data.keychain.wallets,
                openedWallet:Vue.prototype.scatterData.data.keychain.getOpenWallet(),

                currentNetwork:Vue.prototype.scatterData.data.settings.currentNetwork,

                generatingNewKey:false,
                importingKey:KeyPair.placeholder(),
                preEditedWallet:Wallet.placeholder()
            };
        },
        mounted(){
            this.fetchBalances();

            // TODO: Not sure if we want to do this so often for production.
            setInterval(() => {
                this.fetchBalances();
            }, 10000);


            this.selectListState(this.listStates.HISTORY);
        },
        methods: {
            fetchBalances:function(){
                this.openedWallet.keyPairs.map(kp => AccountService.getAccounts(kp).then(res => kp.balance = res.map(x => Number(x.eos_balance.replace("EOS", ""))).reduce((a, b) => a+b, 0)));
            },
            lockKeychain:function(){
                LocalStream.send(NetworkMessage.signal(InternalMessageTypes.LOCK)).then(locked => {
                    Vue.prototype.scatterData = ScatterData.fromJson(locked);
                    this.$router.push({name:'auth'});
                })
            },
            selectListState:function(state){
                this.listState = state;
                this.listItems = [];
                if(this.listState === this.listStates.HISTORY) this.getTransactions();
                else if (this.listState === this.listStates.CONTRACTS) this.getTransactions(false);
            },
            getTransactions:function(eosOnly = true){
                AccountService.getWalletTransactions(this.openedWallet, eosOnly, this.currentNetwork).then(res => {
                    this.listItems = res;
                })
            },
            selectingWallet:function(){ return this.listState === this.listStates.CHOOSE_WALLET; },
            toggleSelectingWallet:function(){ this.selectListState(this.selectingWallet() ? this.listStates.HISTORY : this.listStates.CHOOSE_WALLET); },
            createNewWallet:function(){ this.openedWallet = Wallet.newWallet(); },
            selectWallet:function(name){
                LocalStream.send(NetworkMessage.payload(InternalMessageTypes.OPEN, name)).then(response => {
                    if(!response) {
                        window.ui.pushError('Wallet Error', `There was an issue opening the wallet named ${name}`);
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
                window.ui.waitFor(
                    LocalStream.send(NetworkMessage.signal(InternalMessageTypes.KEYCHAIN)).then(response => {
                        if(!response) {
                            window.ui.pushError('Decryption Error', `There was an issue decrypting the wallet named ${name}`);
                            return false;
                        }

                        let wallet = response.data.keychain.wallets.find(x => x.uniqueKey === this.openedWallet.uniqueKey);
                        this.openedWallet.keyPairs = wallet.keyPairs.map(x => KeyPair.fromJson(x));
                        this.openedWallet.edit();
                        this.fetchBalances();
                    })
                )
            },
            removeKeyPair:function(keyPair){
                if(!keyPair.reclaimed && keyPair.accounts.length){
                    window.ui.pushError('Error Removing Account', `You cannot remove accounts that have yet to be reclaimed.`);
                    return false;
                }

                keyPair.remove()
            },
            importPrivateKey:function(){
                let keyPair = this.importingKey.clone();

                if(!EOSKeygen.validPrivateKey(keyPair.privateKey)) {
                    window.ui.pushError('Invalid Private Key', `It looks like the key you are trying to import is invalid.`);
                    return false;
                }

                keyPair.publicKey = EOSKeygen.privateToPublic(keyPair.privateKey);
                if(this.openedWallet.hasKey(keyPair.publicKey, this.currentNetwork)) {
                    window.ui.pushError('Key Already Exists', `The key you are trying to import already exists in this wallet.`);
                    return false;
                }

                keyPair.network = Vue.prototype.scatterData.data.settings.currentNetwork.clone();
                window.ui.waitFor(
                    AccountService.findAccounts(keyPair).then(keyPairAccounts => {
                        if(!keyPairAccounts.length) {
                            window.ui.pushError('Non Associated Key', `Imported keys must already be associated with an account.`);
                            this.importingKey = KeyPair.placeholder();
                            return false;
                        }

                        keyPair.setAccounts(keyPairAccounts);
                        keyPair.reclaimed = true;
                        this.openedWallet.keyPairs.push(keyPair);
                        this.importingKey = KeyPair.placeholder();
                    })
                )
            },
            generateNewKey:function(){
                if(this.wallets.concat(this.openedWallet).find(x => x.hasUnreclaimedKey())){
                    window.ui.pushError('Unreclaimed Account', `You must pay back the account stake we've already supplied you before creating another account.`);
                    return false;
                }

                let newKeyPair = EOSKeygen.generateKeys();
                newKeyPair.network = Vue.prototype.scatterData.data.settings.currentNetwork.clone();
                this.openedWallet.keyPairs.push(newKeyPair);
            },
            saveWallet:function(){
                if(!this.openedWallet.name.length){
                    window.ui.pushError('Error Saving Wallet', `Wallet must have a name.`);
                    return false;
                }

                if(!this.openedWallet.keyPairs.filter(x => !x.removed).length){
                    window.ui.pushError('Error Saving Wallet', `Wallet must have at least one account.`);
                    return false;
                }

                if(this.wallets.filter(x => x.uniqueKey !== this.openedWallet.uniqueKey && x.name === this.openedWallet.name).length){
                    window.ui.pushError('Error Saving Wallet', `Wallet must have unique names.`);
                    return false;
                }

                let newKeyPair = this.wallets.concat(this.openedWallet).map(x => x.keyPairs).reduce((a,b) => a.concat(b), []).find(key => !key.accounts.length && !key.removed);
                let accountCreated = null;
                if(newKeyPair){
                    if(!newKeyPair.hasOwnProperty('tempName') || !newKeyPair.tempName || !newKeyPair.tempName.length){
                        window.ui.pushError('Error Saving Wallet', `New accounts must be named.`);
                        return false;
                    }

                    if(!this.validateAccountName(newKeyPair.tempName)){
                        return false;
                    }

                    accountCreated = AccountService.createAccount(newKeyPair, newKeyPair.tempName);
                } else accountCreated = new Promise((res,rej) => res(''));


                window.ui.waitFor(
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
                            if(err === 'exists') window.ui.pushError('Error Saving Wallet', `This account name already exists.`);
                            else window.ui.pushError('Error Saving Wallet', err);
                            // TODO: Invalid char
                            return false;
                        })
                )
            },
            cancelEditing:function(){
                this.openedWallet.editing = false;
//                if(this.openedWallet.uniqueKey !== this.wallets.find(x => x.lastOpened).uniqueKey) this.openedWallet = this.wallets.find(x => x.lastOpened);
//                else
                    this.openedWallet = this.preEditedWallet;
            },
            wasSpent:function(trx){
                const accountNames = this.openedWallet.keyPairs
                    .map(x => x.accounts.map(a => a.name))
                    .reduce((a,b) => a.concat(b), [])
                    .reduce((a,b) => a.indexOf(b) > -1 ? a : a.concat(b), []);
                let messageTos = trx.transaction.messages.filter(x => Object.keys(x.data).indexOf('amount') > -1).map(m => m.data.to);
                return messageTos.map(name => accountNames.indexOf(name) > -1).filter(x => x).length !== trx.transaction.messages.length;
            },
            isEosTransfer:function(trx){
                return this.transactionNames(trx).indexOf('eos') > -1
            },
            transactionNames:function(trx){
                return trx.transaction.messages.map(x => x.code).reduce((a,b) => a.indexOf(b) > -1 ? a : a.concat(b), []);
            },
            validateAccountName:function(name){
                function err(){ window.ui.pushError('Account Name Error', 'Account names must be at least 2 characters long and are limited to the letters a-z ( lowercase ) and the numbers 1-5. If the account name is 13 characters long the last character is limited to a-j') }
                if(name.length < 2){ err(); return false; }
                if(!/(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)/g.test(name)) { err(); return false; }
                return true;
            }
        },
        filters: {
            transactionSum:function(trx){
                return trx.transaction.messages
                    .filter(x => Object.keys(x.data).indexOf('amount') > -1)
                    .map(m => m.data.amount).reduce((a,b) => a+b,0)/10000;
            }
        }

    };
</script>
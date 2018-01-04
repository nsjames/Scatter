<template>
    <section>
        <section class="top"></section>
        <section class="bottom tool-bar"></section>
        <figure class="logo settings">Scatter</figure>

        <section class="request-auth">
            <section class="network">
                <figure class="name" :title="network.name">{{network.name}}</figure>
                <figure class="host" :title="network.host">{{network.host}}</figure>
            </section>



            <!-- INFO SECTION -->
            <!-- Custom template for standard transfers -->
            <section class="info standard" v-if="isStandardCurrencyTransfer()">
                <figure class="symbol">EOS</figure>
                <figure class="title">Currency Transfer</figure>
                <figure class="quantity">{{transaction.messages[0].data.quantity}}</figure>

                <section>
                    <figure class="prop-bubble">{{transaction.messages[0].data.from}}</figure>
                    <figure class="prop-divider">to</figure>
                    <figure class="prop-bubble blue-only force-right">{{transaction.messages[0].data.to}}</figure>
                </section>
            </section>

            <!-- Generic template for custom contracts -->
            <section class="info" v-else>
                <figure class="domain">{{permission.domain}}</figure>
                <figure class="title">{{permission.name}}</figure>
                <figure class="description">{{permission.description}}</figure>
                <figure class="warning">Never trust the name and description alone, validate the contract below and the network above. Always know what you are signing.</figure>
            </section>




            <section class="wallet-placeholder" v-if="selectingKeyPair"></section>
            <section class="wallet-select" :class="{'selecting':selectingKeyPair}">
                <section class="selected" v-on:click="toggleSelectingKeyPair">
                    <section class="wallet">
                        <figure class="name">{{selectedWallet.name}}</figure>
                        <figure class="symbol">EOS</figure>
                        <figure class="quantity">{{selectedWallet.balance}}</figure>
                        <figure class="key" v-if="!selectedKeyPair.accounts.length">{{selectedKeyPair.publicKey.substr(0,6)}}.....{{selectedKeyPair.publicKey.substr(-4)}}</figure>
                        <figure class="key" v-else>
                            <span v-for="acc in selectedKeyPair.accounts" :class="{'owner':acc.authority==='owner'}">
                                {{`${acc.name}@${acc.authority}`}}
                            </span>
                        </figure>
                    </section>
                    <figure class="arrow"><i class="fa fa-caret-down"></i></figure>
                </section>
                <section class="wallets">
                    <section class="wallet" v-for="wallet in wallets">
                        <figure class="name">{{wallet.name}}</figure>
                        <section class="key-pairs">
                            <section class="key-pair" v-on:click="selectKeyPair(keyPair, wallet)" v-for="keyPair in wallet.keyPairs">
                                <figure class="symbol">EOS</figure>
                                <figure class="quantity">{{wallet.balance}}</figure>
                                <figure class="key" v-if="!keyPair.accounts.length">{{keyPair.publicKey.substr(0,6)}}.....{{keyPair.publicKey.substr(-4)}}</figure>
                                <figure class="key" v-else>
                                    <span v-for="acc in keyPair.accounts" :class="{'owner':acc.authority==='owner'}">
                                        {{`${acc.name}@${acc.authority}`}}
                                    </span>
                                </figure>
                            </section>
                        </section>
                    </section>
                </section>
            </section>

            <section class="actions">
                <figure class="action blue" v-on:click="accept">Approve</figure>
                <figure class="action red" v-on:click="deny">Deny</figure>
            </section>

            <section class="transaction">
                <section class="header">
                    <figure class="title">Transaction Structure</figure>
                    <section class="formats">
                        <figure class="format" v-on:click="toggleStructureType" :class="{'active':structureType ==='props'}">PROPS</figure>
                        <figure class="format" v-on:click="toggleStructureType" :class="{'active':structureType ==='json'}">JSON</figure>
                    </section>
                </section>

                <section class="contract-action">
                    <figure class="prop-bubble">{{transaction.messages[0].code}}</figure>
                    <figure class="prop-bubble blue-only">{{transaction.messages[0].type}}</figure>
                </section>

                <section class="contract-props" v-if="structureType === 'props'">
                    <recursive-list v-bind:kvmap="transaction.data"></recursive-list>
                </section>

                <section class="contract-json" v-if="structureType === 'json'">
                    <pre><code>{{transaction.data}}</code></pre>
                </section>
            </section>
        </section>

    </section>
</template>
<script>
    import Vue from 'vue';
    import {AuthenticationService} from '../../services/AuthenticationService';
    import {LocalStream, NetworkMessage, Wallet, KeyPair} from 'scatterhelpers'

    export default {
        props: ['responder', 'network', 'transaction', 'permission', 'allowedAccounts'],
        data() {
            return {
                structureType:'props',

                wallets:[],
                selectedKeyPair:KeyPair.placeholder(),
                selectedWallet:Wallet.placeholder(),
                selectingKeyPair:false
            }
        },
        methods: {
            accept:function(){ this.respond(this.selectedKeyPair); },
            deny:function() { this.respond(false); },
            selectKeyPair:function(keyPair, wallet){
                this.selectedKeyPair = keyPair;
                this.selectedWallet = wallet;
                this.selectingKeyPair = false;
            },
            toggleSelectingKeyPair:function(){ this.selectingKeyPair = !this.selectingKeyPair; },
            toggleStructureType:function(){ this.structureType = (this.structureType === 'props') ? 'json' : 'props'; },
            respond:function(keyOrFalse){ this.responder(keyOrFalse); setTimeout(() => window.close(), 40); },

            json2KeyValue:function(json, map = []){
                if(typeof json !== 'object') return json;
                let obj = Object.assign({}, json);
                let kv = {key:Object.keys(json)[0], value:this.json2KeyValue(json[Object.keys(json)[0]])}
                delete obj[Object.keys(json)[0]];

            },

            isStandardCurrencyTransfer:function(){
                return true;
//                return  this.transaction.messages[0].code === 'currency' &&
//                        this.transaction.messages[0].type === 'transfer' &&
//                        Object.keys(this.transaction.data).length === 3
            }
        },
        mounted(){
            window.onunload = () => this.responder(false);

            if(this.allowedAccounts && this.allowedAccounts.length) {
                let acc = this.allowedAccounts.map(z => `${z.account}::${z.permission}`);

                function allowedKeyPair(keyPair) {
                    return keyPair.accounts.map(z => `${z.name}::${z.authority}`).filter(z => acc.indexOf(z) > -1).length
                }

                function allowedWallet(wallet) {
                    return wallet.keyPairs.filter(x => allowedKeyPair(x)).length
                }

                let allowed = Vue.prototype.scatterData.data.keychain.wallets.map(x => x.clone())
                    .filter(wallet => allowedWallet(wallet)).map(x => x.clone());

                allowed.map(x => x.keyPairs = x.keyPairs.filter(x => allowedKeyPair(x)))

                this.selectedKeyPair = allowed[0].keyPairs[0];
                this.selectedWallet = allowed[0];
                this.wallets = allowed;
            } else {
                this.wallets = Vue.prototype.scatterData.data.keychain.wallets;
                this.selectedKeyPair = Vue.prototype.scatterData.data.keychain.getOpenWallet().getDefaultKeyPair();
                this.selectedWallet = Vue.prototype.scatterData.data.keychain.getOpenWallet();
            }
        }
    };
</script>

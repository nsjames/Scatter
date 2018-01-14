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
            <section v-if="wallets.length">
                <section class="info standard" v-if="isStandardCurrencyTransfer()">
                    <figure class="symbol">EOS</figure>
                    <figure class="title">Currency Transfer</figure>
                    <figure class="quantity">{{transaction.messages[0].data.quantity}}</figure>

                    <section>
                        <figure class="prop-bubble">{{(transaction.messages[0].data.from === '[scatter]') ? selectedKeyPair.getHighestAuthorityName() : transaction.messages[0].data.from }}</figure>
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
            </section>



            <section class="black-over" :class="{'dark':selectingKeyPair}"></section>
            <section class="wallet-placeholder" :class="{'show':selectingKeyPair}"></section>
            <section class="wallet-select" v-if="wallets.length" :class="{'selecting':selectingKeyPair}">
                <section class="selected" v-on:click="toggleSelectingKeyPair">
                    <section class="wallet">
                        <figure class="name">{{selectedWallet.name}}</figure>
                        <figure class="symbol">EOS</figure>
                        <figure class="quantity">{{selectedWallet.balance}}</figure>
                        <figure class="key">
                            <span :class="{'owner':selectedKeyPair.getHighestAuthority()==='owner'}">
                                {{`${selectedKeyPair.getHighestAuthorityName()}@${selectedKeyPair.getHighestAuthority()}`}}
                            </span>
                        </figure>
                    </section>
                    <figure class="arrow"><i class="fa fa-caret-down"></i></figure>
                </section>
                <section class="wallets">
                    <section class="wallet" v-for="wallet in wallets">
                        <figure class="name">{{wallet.name}}</figure>
                        <section class="key-pairs">
                            <section class="key-pair" v-on:click="selectKeyPair(keyPair, wallet)" v-for="keyPair in wallet.keyPairsInNetwork(network)">
                                <figure class="symbol">EOS</figure>
                                <figure class="quantity">{{wallet.balance}}</figure>
                                <figure class="key" v-if="!keyPair.accounts.length">{{keyPair.truncateKey()}}</figure>
                                <figure class="key" v-else>
                                    <span v-for="acc in keyPair.accounts" :class="{'owner':acc.authority==='owner'}">
                                        {{`${acc.name}@${acc.authority}`}}
                                        <!--{{acc.print()}}-->
                                    </span>
                                </figure>
                            </section>
                        </section>
                    </section>
                </section>
            </section>
            <section class="info no-account" v-else>
                <figure class="title">The website is trying to get you to sign a transaction with an account/network that you do not have in your wallet.</figure>
                <figure class="description">This could be happening because you deleted an account/network from your wallet yet the website still has a reference to you owning it.</figure>
            </section>

            <section class="actions">
                <figure class="action blue" v-if="wallets.length" v-on:click="accept">Approve</figure>
                <figure class="action red" :class="{'full':!wallets.length}" v-on:click="deny">Deny</figure>
            </section>

            <section class="transaction" v-if="wallets.length">
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
                    <recursive-list v-bind:kvmap="transaction.messages[0].data" v-bind:selected-key-pair="selectedKeyPair"></recursive-list>
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
    import {LocalStream, NetworkMessage, Wallet, KeyPair} from 'scattermodels'

    export default {
        props: ['responder', 'network', 'transaction', 'permission', 'allowedAccounts'],
        data() {
            return {
                structureType:'props',

                wallets:[],
                selectedKeyPair:KeyPair.placeholder(),
                selectedWallet:Wallet.placeholder(),
                selectingKeyPair:false,
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
            console.log(this.allowedAccounts);
            if(this.allowedAccounts && this.allowedAccounts.length) {
                console.log(this);
                let acc = this.allowedAccounts.map(z => `${z.account}::${z.permission}`);

                const allowedKeyPair = (keyPair) => {
                    return keyPair.accounts.map(z => `${z.name}::${z.authority}`).filter(z => acc.indexOf(z) > -1).length
                }

                const allowedWallet = (wallet) => {
                    return wallet.keyPairsInNetwork(this.network).filter(x => allowedKeyPair(x)).length
                }

                let allowed = Vue.prototype.scatterData.data.keychain.wallets.map(x => x.clone())
                    .filter(wallet => allowedWallet(wallet)).map(x => x.clone());

                allowed.map(x => x.keyPairs = x.keyPairs.filter(x => allowedKeyPair(x)))

                this.selectedKeyPair = allowed[0].keyPairs[0];
                this.selectedWallet = allowed[0];
                this.wallets = allowed;
            } else {
                const keychain = Vue.prototype.scatterData.data.keychain;
                this.wallets = keychain.wallets.filter(x => x.keyPairsInNetwork(this.network).length);
                const openWallet = (this.wallets.map(x => x.name).indexOf(keychain.getOpenWallet().name) > -1) ? keychain.getOpenWallet()
                    : (this.wallets.length) ? this.wallets[0] : null;
                this.selectedWallet = openWallet;
                this.selectedKeyPair = openWallet.keyPairsInNetwork(this.network)[0] || null;
            }
        }
    };
</script>

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

            <section class="info standard" v-if="wallets.length">
                <figure class="symbol">ID</figure>
                <figure class="title">Identity Request</figure>
                <figure class="description">
                    Websites can use your identity for transferring you funds, registering an account in your name
                    and various other things.
                    <b class="warning">Identities can <u>not</u> be used to sign transactions for you.</b>
                </figure>
                <br><br>

                <section>
                    <figure class="prop-bubble">identity</figure>
                    <figure class="prop-divider">for</figure>
                    <figure class="prop-bubble blue-only force-right">{{(location.replace("http://", "").replace("https://", "") + '/').split('/')[0]}}</figure>
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
                <figure class="title">The website is trying to get you to provide an identity for a network that you do not belong to.</figure>
                <figure class="description">Check the network on the top right of this window and make sure you have an account there.</figure>
            </section>

            <section class="actions">
                <figure class="action blue" v-if="wallets.length" v-on:click="accept">Approve</figure>
                <figure class="action red" :class="{'full':!wallets.length}" v-on:click="deny">Deny</figure>
            </section>
        </section>

    </section>
</template>
<script>
    import Vue from 'vue';
    import {AuthenticationService} from '../../services/AuthenticationService';
    import {LocalStream, NetworkMessage, Wallet, KeyPair} from 'scattermodels'

    export default {
        props: ['responder', 'network', 'location'],
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
            respond:function(keyOrFalse){ this.responder(keyOrFalse); setTimeout(() => window.close(), 40); },
            selectKeyPair:function(keyPair, wallet){
                this.selectedKeyPair = keyPair;
                this.selectedWallet = wallet;
                this.selectingKeyPair = false;
            },
            toggleSelectingKeyPair:function(){ this.selectingKeyPair = !this.selectingKeyPair; },
            toggleStructureType:function(){ this.structureType = (this.structureType === 'props') ? 'json' : 'props'; },
        },
        mounted(){
            window.onunload = () => this.responder(false);

            const keychain = Vue.prototype.scatterData.data.keychain;
            this.wallets = keychain.wallets.filter(x => x.keyPairsInNetwork(this.network).length);
            const openWallet = (this.wallets.map(x => x.name).indexOf(keychain.getOpenWallet().name) > -1) ? keychain.getOpenWallet()
                : (this.wallets.length) ? this.wallets[0] : null;
            this.selectedWallet = openWallet;
            this.selectedKeyPair = openWallet.keyPairsInNetwork(this.network)[0] || null;
        }
    };
</script>

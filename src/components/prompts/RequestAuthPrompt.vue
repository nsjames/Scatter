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

            <section class="info">
                <figure class="domain">{{permission.domain}}</figure>
                <figure class="title">{{permission.name}}</figure>
                <figure class="description">{{permission.description}}</figure>
                <figure class="warning">Never trust the name and description alone, validate the contract below and the network above. Always know what you are signing.</figure>
            </section>

            <section class="wallet-select">
                <section class="selected">
                    <section class="wallet">
                        <figure class="name">My main wallet</figure>
                        <figure class="quantity">1,234.0123</figure>
                        <figure class="symbol">EOS</figure>
                        <figure class="key">{{selectedKeyPair.publicKey.substr(0,6)}}.....{{selectedKeyPair.publicKey.substr(-4)}}</figure>
                    </section>
                    <figure class="arrow"><i class="fa fa-caret-down"></i></figure>
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
                    <figure class="prop-bubble">{{transaction.message.code}}</figure>
                    <figure class="prop-bubble blue-only">{{transaction.message.type}}</figure>
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
    import {LocalStream, NetworkMessage} from 'scatterhelpers'

    export default {
        props: ['responder', 'network', 'transaction', 'permission'],
        data() {
            return {
                structureType:'props',
                wallets:Vue.prototype.scatterData.data.keychain.wallets,
                selectedKeyPair:Vue.prototype.scatterData.data.keychain.getOpenWallet().getDefaultKeyPair()
            }
        },
        methods: {
            accept:function(){ this.respond(true); },
            deny:function() { this.respond(false); },
            toggleStructureType:function(){ this.structureType = (this.structureType === 'props') ? 'json' : 'props'; },
            respond:function(truthy){ this.responder(truthy); setTimeout(() => window.close(), 40); },

            json2KeyValue:function(json, map = []){
                if(typeof json !== 'object') return json;
                let obj = Object.assign({}, json);
                let kv = {key:Object.keys(json)[0], value:this.json2KeyValue(json[Object.keys(json)[0]])}
                delete obj[Object.keys(json)[0]];

            }
        },
        mounted(){
            window.onunload = () => this.responder(false);

//            this.network.subscribe().then(res => {
//                console.log(res);
//            })
        }
    };
</script>

<template>
    <section class="request-auth">

        <section v-if="!sent">
            <section class="info">
                <figure class="symbol">EOS</figure>
                <figure class="title">Currency Transfer</figure>
            </section>


            <section class="black-over" :class="{'dark':selectingKeyPair}"></section>
            <section class="wallet-placeholder" :class="{'show':selectingKeyPair}"></section>
            <section class="wallet-select" style="padding: 0 30px 10px;" v-if="wallets.length" :class="{'selecting':selectingKeyPair}">
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
                            <section class="key-pair" v-on:click="selectKeyPair(keyPair, wallet)" v-for="keyPair in wallet.keyPairs">
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

            <section class="info" style="margin-top:0; padding-top:0;">
                <scatter-input icon="fa-money" placeholder="Quantity" type="number" input-text="0.00" v-on:changed="updateQuantity"></scatter-input>
                <scatter-input icon="fa-address-book-o" placeholder="To: ( Account Name )" type="text" v-on:changed="updateTo"></scatter-input>
            </section>

            <section class="actions" style="margin-top:30px;">
                <figure class="action blue" v-if="wallets.length" v-on:click="send">Send</figure>
                <figure class="action red" :class="{'full':!wallets.length}" v-on:click="cancel">Cancel</figure>
            </section>
        </section>

        <section v-if="sent">
            <section class="info">
                <figure class="symbol">TRX</figure>
                <figure class="title">Transaction Successful</figure>
                <div style="width:100%; height:1px; background:rgba(0,0,0,0.05); margin-bottom:10px;"></div>
                <figure class="description">Transaction ID: </figure>
                <figure class="title">{{trx.transaction_id}}</figure>
                <div style="width:100%; height:1px; background:rgba(0,0,0,0.05); margin:10px 0;"></div>
                <figure class="description">Message JSON: </figure>
                <figure class="description">
                    <pre><code>{{trx.transaction.messages[0].data}}</code></pre>
                </figure>
            </section>
            <section class="actions" style="margin-top:30px;">
                <figure class="action blue full" v-on:click="cancel">Done</figure>
            </section>
        </section>

    </section>
</template>
<script>
    import Vue from 'vue';
    import {ScatterData, Network, Wallet} from 'scattermodels';
    import {TransferService} from '../services/TransferService';

    export default {
        data() {
            return {
                to:'',
                quantity:0,
                wallets:Vue.prototype.scatterData.data.keychain.wallets,
                selectedWallet:Wallet.placeholder(),
                selectedKeyPair:Vue.prototype.scatterData.data.keychain.wallets[0].keyPairs[0],
                selectingKeyPair:false,
                sent:false,
                trx:{}
            };
        },
        methods: {
            dummy:function(){},
            cancel:function(){ this.$router.push({name:'keychain'}) },
            send:function(){
                window.ui.waitFor(
                    TransferService.send(this.selectedKeyPair.getHighestAuthorityName(), this.to, this.quantity, this.selectedKeyPair.network, this.selectedKeyPair.publicKey).then(result => {
                        console.log("Sent: ", result)
                        this.sent = true;
                        this.trx = result;
                    }).catch(e => {
                        console.log("Error: ", e)
                    })
                )
            },
            selectKeyPair:function(keyPair, wallet){
                //TODO: Deal with multiple account selection
                this.selectedKeyPair = keyPair;
                this.selectedWallet = wallet;
                this.selectingKeyPair = false;
            },
            toggleSelectingKeyPair:function(){ this.selectingKeyPair = !this.selectingKeyPair; },
            updateTo:function(to){ this.to = to; },
            updateQuantity:function(quantity){ this.quantity = quantity; }

        }
    };
</script>
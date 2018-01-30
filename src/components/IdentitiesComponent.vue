<template>
    <section class="keychain-component">




        <section v-if="!editingIdentity && !deletingIdentity">
            <section class="dashboard">
                <section class="dup editing">
                    <figure class="wallet-name">Identities</figure>

                </section>

                <section class="ddown editing">
                    <scatter-button text="Back" is-half="true" v-on:clicked="backToKeychain"></scatter-button>
                    <scatter-button text="New Identity" is-half="true" v-on:clicked="createNewIdentity"></scatter-button>
                </section>
            </section>

            <section class="data-list" v-if="identities.length">
                <section class="item editing" v-for="id in identities">
                    <section class="identity">
                        <figure class="action-button active" v-on:click="confirmIdentityDeletion(id)">Delete</figure>
                        <figure class="action-button" v-on:click="editIdentity(id)">Edit</figure>
                        <section class="name">{{id.name}}</section>
                        <section class="prop" v-if="id.account">
                            <figure class="key">Account</figure>
                            <figure class="val">{{id.account.name}}@{{id.account.authority}}</figure>
                        </section>
                        <section class="prop" v-if="id.network">
                            <figure class="key">Network</figure>
                            <figure class="val">{{id.network.name}} {{id.network.unique()}}</figure>
                        </section>
                        <section class="prop" v-for="prop in Object.keys(id)" v-if="prop !== 'uniqueKey' && prop !== 'account' && prop !== 'network' && prop !== 'name' && id[prop] !== '' && id[prop] !== -1">
                            <figure class="key">{{prop | propAsTitle}}</figure>
                            <figure class="val">{{id[prop]}}</figure>
                        </section>
                    </section>
                </section>
                <figure style="height:100px;"></figure>
            </section>

            <section class="data-list" v-if="!identities.length">
                <section class="no-items">
                    <figure class="title">You do not have any Identities</figure>
                    <figure class="sub-title">Identities take care of your personal data and facilitate one-click transactions.</figure>
                </section>
            </section>
        </section>

        <section v-if="editingIdentity && !deletingIdentity">
            <section class="dashboard">
                <section class="dup editing">
                    <figure class="wallet-name" v-if="!creatingNewIdentity">{{editingIdentity.name}}</figure>
                    <input placeholder="Name your Identity" class="wallet-name" v-model="editingIdentity.name" v-if="creatingNewIdentity" />
                </section>

                <section class="ddown editing">
                    <scatter-button text="Cancel" is-red="true" is-half="true" v-on:clicked="cancelEditingIdentity"></scatter-button>
                    <scatter-button text="Save" is-half="true" v-on:clicked="saveIdentity"></scatter-button>
                </section>
            </section>

            <section class="data-list">
                <section class="edit-identity">
                    <figure class="explanation">
                        All fields are optional, allowing you to control the
                        information you are willing to give with each identity.
                    </figure>

                    <figure class="line"></figure>
                    <figure class="label">Associated Account</figure>
                    <scatter-select v-bind:options="['None'].concat(allAccountNames())"
                                    v-bind:force-selected-option="'None'" v-on:changed="associateAccount"></scatter-select>

                    <figure class="line"></figure>
                    <figure class="label">Personal Information</figure>

                    <input placeholder="Full Name" v-model="editingIdentity.fullName" />
                    <input placeholder="Email Address" v-model="editingIdentity.email" />
                    <input placeholder="Phone Number" type="number" v-model="editingIdentity.phone" />
                    <input placeholder="Age" type="number" v-model="editingIdentity.age" />

                    <figure class="line"></figure>
                    <figure class="label">Location Information</figure>

                    <input placeholder="Address" v-model="editingIdentity.address" />
                    <input placeholder="City" v-model="editingIdentity.city" />
                    <input placeholder="State" v-model="editingIdentity.state" />
                    <input placeholder="Country" v-model="editingIdentity.country" />
                    <input placeholder="Postal Code" v-model="editingIdentity.zipcode" />
                </section>
            </section>
        </section>

        <section v-if="deletingIdentity">
            <section class="dashboard">
                <section class="dup editing">
                    <figure class="wallet-name">{{deletingIdentity.name}}</figure>
                </section>

                <section class="ddown editing">
                    <scatter-button text="Confirm" is-half="true" is-red="true" v-on:clicked="deleteIdentity"></scatter-button>
                    <scatter-button text="Cancel" is-half="true" v-on:clicked="cancelDeletion"></scatter-button>
                </section>
            </section>
            <section class="data-list">

                <section class="item">
                    <section class="identity">
                        <h2 style="font-weight:800">You are about to delete an Identity</h2>
                        <h4>
                            When you delete an Identity you lose it's unique key. This action is not recoverable,
                            and all applications you've used this Identity on will no longer be able to identify you.
                        </h4>
                        <figure class="line"></figure>

                        <section class="name"></section>
                        <section class="name">{{deletingIdentity.name}}</section>
                        <section class="prop" v-if="deletingIdentity.account">
                            <figure class="key">Account</figure>
                            <figure class="val">{{deletingIdentity.account.name}}@{{deletingIdentity.account.authority}}</figure>
                        </section>
                        <section class="prop" v-if="deletingIdentity.network">
                            <figure class="key">Network</figure>
                            <figure class="val">{{deletingIdentity.network.name}} {{deletingIdentity.network.unique()}}</figure>
                        </section>
                        <section class="prop" v-for="prop in Object.keys(deletingIdentity)" v-if="prop !== 'uniqueKey' && prop !== 'account' && prop !== 'network' && prop !== 'name' && deletingIdentity[prop] !== '' && deletingIdentity[prop] !== -1">
                            <figure class="key">{{prop | propAsTitle}}</figure>
                            <figure class="val">{{deletingIdentity[prop]}}</figure>
                        </section>
                    </section>
                </section>
            </section>
        </section>



    </section>
</template>
<script>
    import Vue from 'vue';
    import {Identity, ScatterData} from 'scattermodels';

    export default {
        data() {
            return {
                identities:Vue.prototype.scatterData.data.keychain.identities,
                editingIdentity:null,
                creatingNewIdentity:false,
                deletingIdentity:null,
            }
        },
        methods: {
            backToKeychain:function(){ this.$router.push({name:'keychain'}); },
            editIdentity:function(id){ this.editingIdentity = id; },
            cancelEditingIdentity:function(){
                this.editingIdentity = null;
                this.creatingNewIdentity = false;
            },
            associateAccount:function(accountName){
                const nameAndAuth = accountName.split(" ")[0];
                const network = accountName.split(" ")[1];
                const keypairs = Vue.prototype.scatterData.data.keychain.wallets.map(x => x.keyPairs).reduce((a,b) => a.concat(b), []);
                const found = keypairs.find(x => x.network.unique() === network && x.accounts.map(a => `${a.name}@${a.authority}` === nameAndAuth));
                const foundNetwork = found.network;
                const foundAccount = found.accounts.find(a => `${a.name}@${a.authority}` === nameAndAuth);
                this.editingIdentity.network = foundNetwork;
                this.editingIdentity.account = foundAccount;
                console.log(this.editingIdentity)
            },
            saveIdentity:function(){

                if(!this.editingIdentity.name.length){
                    window.ui.pushError('Error Creating Identity', `Identities must have names`);
                    return false;
                }

                if(this.creatingNewIdentity && this.identities.find(x => x.name === this.editingIdentity.name)){
                    window.ui.pushError('Error Creating Identity', `You already have an identity with the name ${this.editingIdentity.name}`);
                    return false;
                }

                if(!this.creatingNewIdentity){
                    let existing = this.identities.find(x => x.name === this.editingIdentity.name);
                    existing = this.editingIdentity;
                } else this.identities.push(this.editingIdentity);

                let scatter = Vue.prototype.scatterData;
                scatter.data.keychain.identities = this.identities;

                ScatterData.update(scatter).then(saved => {
                    Vue.prototype.scatterData = ScatterData.fromJson(saved);
                    this.creatingNewIdentity = false;
                    this.editingIdentity = null;
                })

            },
            allAccountNames:function(){
                return Vue.prototype.scatterData.data.keychain.wallets
                    .map(x => x.keyPairs)
                    .reduce((a,b) => a.concat(b), [])
                    .map(x => x.accounts.map(a => `${a.name}@${a.authority} ${x.network.unique()}`))
                    .reduce((a,b) => a.concat(b), [])
                    .reduce((a,b) => a.indexOf(b) === -1 ? a.concat(b) : a, []);
            },
            createNewIdentity:function(){
                this.creatingNewIdentity = true;
                this.editIdentity(Identity.placeholder());
            },
            confirmIdentityDeletion:function(id){
                this.deletingIdentity = id;
            },
            cancelDeletion:function(){
                this.deletingIdentity = null;
            },
            deleteIdentity:function(){
                this.identities = this.identities.filter(x => x.uniqueKey !== this.deletingIdentity.uniqueKey);
                let scatter = Vue.prototype.scatterData;
                scatter.data.keychain.identities = this.identities;
                ScatterData.update(scatter).then(saved => {
                    Vue.prototype.scatterData = ScatterData.fromJson(saved);
                    this.deletingIdentity = null;
                })
            },
        },
        filters: {
            propAsTitle:function(prop){
                let str = '';
                prop.split("").map(char => { if(char.toUpperCase() !== char) str += char; else str += ' '+char; });
                return str.split(" ").map(x => x[0].toUpperCase() + x.substr(1)).join(" ");
            }
        }
    };
</script>
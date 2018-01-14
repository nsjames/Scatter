<template>
    <section>
        <section class="top half-screen"></section>
        <section class="bottom half-screen"></section>
        <figure class="logo auth">Scatter</figure>

        <section class="auth-component">
            <section class="inputs-container">
                <scatter-input icon="fa-lock" type="password" placeholder="Password" v-on:changed="updatePassword"></scatter-input>
                <scatter-button text="Unlock Keychain" ref="unlockButton" v-on:clicked="unlockKeychain();"></scatter-button>
            </section>
        </section>
    </section>
</template>
<script>
    import Vue from 'vue';
    import {AuthenticationService} from '../../services/AuthenticationService';
    import {LocalStream, NetworkMessage} from 'scattermodels'

    export default {
        data() {
            return {
                password: '',
                badPassword:false,
            }
        },
        methods: {
            updatePassword:function(x){ this.password = x; },
            unlockKeychain:function(){
                AuthenticationService.authenticate(this.password, Vue.prototype.scatterData.data.hash).then(scatter => {
                    LocalStream.send(NetworkMessage.signal('unlock'));
                    let isLocked = false;
                    this.responder(isLocked)
                    setTimeout(() => window.close(), 40);
                }).catch(badPassword => {
                    this.$refs.unlockButton.errored();
                })
            }
        },
        props: ['responder'],
        mounted(){
            let isLocked = true;
            window.onunload = () => this.responder(isLocked);
        }
    };
</script>

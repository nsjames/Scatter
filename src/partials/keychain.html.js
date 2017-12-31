module.exports = `
<section class="keychain-component">




    <section v-if="!openedWallet.editing">
        <section class="dashboard">
            <section class="dup">
                <figure class="lock" v-on:click="lock"><i class="fa fa-unlock-alt"></i></figure>
                <figure class="edit" v-on:click="edit"><i class="fa fa-pencil"></i></figure>
                <figure class="wallet-name">{{openedWallet.name}}</figure>
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
                    <section class="list-switch" :class="{'active':listState==='history'}" v-on:click="toggleListState"><i class="fa fa-history"></i></section>
                    <section class="list-switch" :class="{'active':listState==='domains'}" v-on:click="toggleListState"><i class="fa fa-globe"></i></section>
                </section>
            </section>
        </section>
        
        
        <section class="data-list">
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
    </section>
    
    
    
    
    
    
    <section v-if="openedWallet.editing">
        <section class="dashboard">
            <section class="dup editing">
                <input placeholder="Name your wallet" class="wallet-name" v-model="openedWallet.name" />
            </section>
            
            <section class="ddown editing">
                <scatter-button text="Cancel" is-red="true" is-half="true" v-on:clicked="cancel"></scatter-button>
                <scatter-button text="Save" is-half="true" v-on:clicked="saveWallet"></scatter-button>
            </section>
        </section>
        
        <section class="data-list">
        
            <section class="item editing" v-for="keyPair in openedWallet.keyPairs">
                <section v-if="!keyPair.removed">
                    <section class="keypair-accounts">
                    
                    
                        <!-- causing some kind of loop problem -->
                        <figure class="authority" :class="{'warn':keyPair.hasOwnerAuthority()}">
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
                        </figure>
                        
                        
                        
                        <figure class="action-button" v-on:click="openedWallet.setDefaultKeyPair(keyPair)" :class="{'active':openedWallet.default === keyPair.publicKey}">Default</figure>
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
`;
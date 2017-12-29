module.exports = `
<section class="auth-component">
    <section class="inputs-container">

        <section v-if="!keychainAvailable">
            <scatter-select v-bind:options="[CREATE_NEW_KEYCHAIN, IMPORT_A_KEYCHAIN]" v-on:changed="updateSelectedKeychainOption"></scatter-select>
            <section v-if="selectedKeychainOption === CREATE_NEW_KEYCHAIN">
                <scatter-input icon="fa-lock" type="password" placeholder="Password" v-on:changed="updatePassword"></scatter-input>
                <scatter-button text="Create Keychain" v-on:clicked="createNewKeychain();"></scatter-button>
            </section>

            <section v-if="selectedKeychainOption === IMPORT_A_KEYCHAIN">
                <scatter-input icon="fa-table" type="text" placeholder="Json Data" v-on:changed="updateKeychainJson"></scatter-input>
                <scatter-button text="Import JSON Keychain" v-on:clicked="importKeychainFromJson();"></scatter-button>
            </section>

        </section>

        <section v-else>
            <scatter-input icon="fa-lock" type="password" placeholder="Password" v-on:changed="updatePassword"></scatter-input>
            <scatter-button text="Unlock Keychain" v-on:clicked="unlockKeychain();"></scatter-button>
            <figure v-on:click="reset" class="forgot">Recover from seed phrase</figure>
        </section>
    </section>
</section>
`;
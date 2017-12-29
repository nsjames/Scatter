import {Mnemonic} from '../cryptography/Mnemonic';
import {PasswordHasher} from '../cryptography/PasswordHasher';
import {ScatterData} from '../models/scatter';
import {Keychain} from '../models/keychain';


const SettingsComponent = {
    template:require('../partials/settings.html'),

    data() {
        return {

        };
    },
    methods: {
        setData:function(obj){ console.log("Setting data: ", obj); },

    }

};

module.exports = SettingsComponent;
// import {StorageService} from 'services/StorageService'
// import {ScatterData} from 'models/scatter.model'

export class Popup {

    constructor(){

        new Vue({
            el: '#scatter',


            data: new VueData(),

            // Anything within the ready function will run when the application loads
            ready: this.onReady(),

            // Methods we want to use in our application are registered here
            methods: new VueMethods()
        });

        // StorageService.save()
    }

    onReady(){

    }

}

class VueData {
    constructor(){
        this.test = '';
    }
}

class VueMethods {
    constructor(){}
}

new Popup();
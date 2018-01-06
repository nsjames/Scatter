
export const ui = {
    working:false,
    waitFor:function(promise){
        return new Promise((resolve, reject) => {
            this.working = true;
            promise
                .then(x => { this.working = false; resolve(x)})
                .catch(x => { this.working = false; reject(x)})
        })
    },


    errorQueue:[],
    pushError:function(title, description){ this.errorQueue.push({title, description}); }
};
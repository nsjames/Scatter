const SelectComponent = {
    template:require('../partials/select.html'),
    data() { return {
        open:false,
        selectedOption:this.options[0]
    };
    },
    methods: {
        close:function(){this.open = false;},
        toggle:function(){this.open = !this.open;},
        selectOption:function(option){
            console.log("OPTION", option)
            this.selectedOption = option;
            this.changed();
            this.close();
        },
        changed:function(){ this.$emit('changed', this.selectedOption) }
    },
    props: ['options'],
    watch: { input: function(n,o) { this.changed(); } }
};

module.exports = SelectComponent;
const InputComponent = {
    template:require('../partials/input.html'),
    data() { return { input:this.inputText }; },
    methods: { changed:function(){ this.$emit('changed', this.input) } },
    props: ['icon', 'type', 'placeholder', 'inputText', 'isHalf', 'disabled'],
    watch: { input: function(n,o) { this.changed(); } }
};

module.exports = InputComponent;
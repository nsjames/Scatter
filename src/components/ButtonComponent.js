const ButtonComponent = {
    template:require('../partials/button.html'),
    data() { return {}; },
    methods: { clicked:function(){ this.$emit('clicked') } },
    props: ['text', 'isRed']
};

module.exports = ButtonComponent;
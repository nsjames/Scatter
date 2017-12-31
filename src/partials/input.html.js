module.exports = `
<section class="input-container" :class="{'half':isHalf}">
  <figure class="icon" v-if="icon"><i class="fa" :class="icon"></i></figure>
  <input :disabled="disabled" :class="{'with-icon':icon}" :placeholder="placeholder" :type="type" v-model="input" />
</section>
`;
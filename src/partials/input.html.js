module.exports = `
<section class="input-container">
  <figure class="icon"><i class="fa" :class="icon"></i></figure>
  <input :placeholder="placeholder" :type="type" v-model="input" />
</section>
`;
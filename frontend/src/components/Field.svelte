<script>
  import DotLayer from "./DotLayer.svelte";
</script>

<div class="field-container">
  <img src="/field.svg" alt="Football field" class="field-image" />
  <DotLayer />
</div>

<style>
  .field-container {
    position: relative;
    width: 800px;
    height: 400px;
  }
  .field-image {
    width: 100%;
    height: 100%;
  }
</style>

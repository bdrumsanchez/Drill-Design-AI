<script>
  import { dots } from "../stores/drill.js";
</script>

<svg class="dot-layer" viewBox="0 0 1200 600">
  {#each $dots as dot}
    <circle cx={dot.x} cy={dot.y} r="4" fill="red" />
  {/each}
</svg>

<style>
  .dot-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
</style>

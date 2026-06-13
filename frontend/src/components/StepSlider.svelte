<script>
  import { currentStep } from "../stores/drill.js";
</script>

<label>
  Step: {$currentStep}
  <input type="range" bind:value={$currentStep} min="0" max="100" />
</label>

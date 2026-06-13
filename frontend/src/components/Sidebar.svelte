<script>
  import { sections, formationSettings, PRESET_COLORS, canvasMode } from '../stores/drillStore';
  
  let openColorPickerIdx = null;

  function toggleColorPicker(idx) {
    openColorPickerIdx = openColorPickerIdx === idx ? null : idx;
  }

  function changeColor(idx, color) {
    sections.update(items => {
      items[idx].color = color;
      return items;
    });
    openColorPickerIdx = null;
  }

  function removeSection(idx) {
    sections.update(items => items.filter((_, i) => i !== idx));
  }

  function addSection() {
    const name = prompt('Enter section name:');
    if (!name || !name.trim()) return;
    
    sections.update(items => [
      ...items,
      {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        count: 8,
        color: '#475569',
        style: 'dots',
        label: name.trim().substring(0, 2)
      }
    ]);
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <h1>Drill Design AI</h1>
    <span>Marching Band Formation Generator</span>
    
    <button class="toggle-btn" on:click={() => canvasMode.update(mode => mode === 'football' ? 'pyware' : 'football')}>
      Switch to {$canvasMode === 'football' ? 'Pyware White Canvas' : 'Green Football Field'}
    </button>
  </div>

  <div class="controls">
    <div class="form-group">
      <label for="shape-select">Formation Shape</label>
      <select id="shape-select" bind:value={$formationSettings.selectedShape}>
        <option value="block">Block</option>
        <option value="circle">Circle</option>
        <option value="wedge">Wedge</option>
        <option value="curve">Curve</option>
      </select>
    </div>

    {#if $formationSettings.selectedShape === 'block'}
      <div class="shape-params">
        <div class="params-label">Block Parameters</div>
        <div class="form-row">
          <div class="form-group">
            <label for="b-rows">Rows</label>
            <input type="number" id="b-rows" bind:value={$formationSettings.block.rows} min="1" />
          </div>
          <div class="form-group">
            <label for="b-step">Interval</label>
            <input type="number" id="b-step" bind:value={$formationSettings.block.step} min="1" />
          </div>
        </div>
      </div>
    {/if}

    {#if $formationSettings.selectedShape === 'circle'}
      <div class="shape-params">
        <div class="params-label">Circle Parameters</div>
        <div class="form-group">
          <label for="c-rad">Radius (steps)</label>
          <input type="number" id="c-rad" bind:value={$formationSettings.circle.radius} min="2" />
        </div>
      </div>
    {/if}

    {#if $formationSettings.selectedShape === 'wedge'}
      <div class="shape-params">
        <div class="params-label">Wedge Parameters</div>
        <div class="form-group">
          <label for="w-dir">Direction</label>
          <select id="w-dir" bind:value={$formationSettings.wedge.direction}>
            <option value="pointing_forward">Forward</option>
            <option value="pointing_backward">Backward</option>
          </select>
        </div>
      </div>
    {/if}

    {#if $formationSettings.selectedShape === 'curve'}
      <div class="shape-params">
        <div class="params-label">Curve Parameters</div>
        <div class="form-group">
          <label for="c-pts">Control Points</label>
          <textarea id="c-pts" placeholder="(0,0), (4,8), (12,4)" bind:value={$formationSettings.curve.points}></textarea>
        </div>
      </div>
    {/if}

    <div class="section-mgr">
      <div class="section-mgr-title">Instrumentation Control</div>
      <div class="section-list">
        {#each $sections as section, idx (section.id)}
          <div class="section-row">
            <div class="srow-top">
              <span class="srow-name">{section.name}</span>
              <button class="srow-remove" on:click={() => removeSection(idx)}>&times;</button>
            </div>
            <div class="srow-controls">
              <button class="srow-color-btn" style="background:{section.color}" on:click={() => toggleColorPicker(idx)}></button>
              <select class="srow-style" bind:value={section.style}>
                <option value="dots">Dots</option>
                <option value="xs">X's</option>
                <option value="labels">Labels</option>
              </select>
              <span class="srow-count-label">Count</span>
              <input type="number" class="srow-count" bind:value={section.count} min="0" />
            </div>
            
            <div class="srow-colors" class:open={openColorPickerIdx === idx}>
              {#each PRESET_COLORS.flat() as color}
                <button 
                  class="swatch" 
                  class:swatch-active={section.color === color} 
                  style="background:{color}" 
                  on:click={() => changeColor(idx, color)}>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      <button class="add-section-btn" on:click={addSection}>+ Add Ensemble Section</button>
    </div>
  </div>
</aside>
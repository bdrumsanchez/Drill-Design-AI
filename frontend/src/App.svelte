<script>
  import { tick } from 'svelte';
  import Sidebar from './components/Sidebar.svelte';
  import { Mode, S, computeBlock, fieldToSVG } from './stores/drillStore';

  function generateSectionDots(instrumentGroups) {
    if (!instrumentGroups || !Array.isArray(instrumentGroups)) return [];

    const STEP_INTERVAL = 2;
    const SECTION_GAP   = 3;
    const ROWS          = 2;
    const ROW_HEIGHT    = (ROWS - 1) * STEP_INTERVAL;

    const activeSections = instrumentGroups.filter(g => (g.count || 0) > 0);
    const totalHeight = activeSections.reduce((sum) => sum + ROW_HEIGHT + SECTION_GAP, 0) - SECTION_GAP;

    const allDots = [];
    let offsetY = totalHeight / 2;

    activeSections.forEach((group) => {
      const fieldPositions = computeBlock(group.count, ROWS, STEP_INTERVAL);
      fieldPositions.forEach((fp, i) => {
        const svgPos = fieldToSVG(fp.x, fp.y - offsetY);
        allDots.push({
          x:     svgPos.x,
          y:     svgPos.y,
          color: group.color || '#fbbf24',
          label: group.name ? group.name.charAt(0) : 'P',
          num:   i + 1,
        });
      });
      offsetY -= ROW_HEIGHT + SECTION_GAP;
    });

    return allDots;
  }

  $: sectionDots = generateSectionDots($S);

  // AI chat state
  let aiPrompt = '';
  let aiDots = [];
  let aiLoading = false;
  let currentParams = null;
  let chatHistory = []; // { role: 'user'|'ai', text: string, isError?: bool }
  let chatEl;

  async function scrollToBottom() {
    await tick();
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
  }

  async function handleAIGenerate() {
    const prompt = aiPrompt.trim();
    if (!prompt) return;

    chatHistory = [...chatHistory, { role: 'user', text: prompt }];
    aiPrompt = '';
    aiLoading = true;
    await scrollToBottom();

    try {
      const body = { prompt };
      if (currentParams) body.current_params = currentParams;

      const res = await fetch('http://localhost:8000/drill/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || res.statusText);
      }
      const data = await res.json();
      currentParams = data.current_params || null;
      aiDots = (data.dots || []).map((d, i) => {
        const svgPos = fieldToSVG(d.x, d.y);
        return { x: svgPos.x, y: svgPos.y, color: '#a78bfa', label: 'A', num: i + 1 };
      });

      const desc = currentParams
        ? `${currentParams.form_type} · ${currentParams.count} performers`
        : `${aiDots.length} performers placed`;
      chatHistory = [...chatHistory, { role: 'ai', text: `Done — ${desc}.` }];
    } catch (e) {
      chatHistory = [...chatHistory, { role: 'ai', text: e.message, isError: true }];
    } finally {
      aiLoading = false;
      await scrollToBottom();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIGenerate();
    }
  }

  function clearAI() {
    aiDots = [];
    currentParams = null;
    chatHistory = [];
  }

  $: performers = [...sectionDots, ...aiDots];
</script>

<div class="app">
  <Sidebar />

  <main class="field-area" style="background: {$Mode === 'football' ? '#0b1120' : '#f4f4f6'};">
    <div class="field-wrapper">
      <svg
        id="field-svg"
        viewBox="0 0 1280 672"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grass-stripe" width="128" height="672" patternUnits="userSpaceOnUse">
            <rect width="64" height="672" fill="#15803d" />
            <rect x="64" width="64" height="672" fill="#166534" />
          </pattern>
          <pattern id="pyware-4step-shade" width="64" height="672" patternUnits="userSpaceOnUse">
            <rect width="32" height="672" fill="#e2e8f0" opacity="0.3" />
            <rect x="32" width="32" height="672" fill="transparent" />
          </pattern>
        </defs>

        {#if $Mode === 'football'}
          <rect width="1280" height="672" fill="url(#grass-stripe)" />
          <rect width="1280" height="672" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.9" />
          <g id="field-steps-grid" stroke="#ffffff" stroke-width="0.5" opacity="0.12">
            {#each Array(161) as _, i}
              {#if i % 8 !== 0}<line x1={i * 8} y1="0" x2={i * 8} y2="672" />{/if}
            {/each}
            {#each Array(85) as _, j}
              <line x1="0" y1={j * 8} x2="1280" y2={j * 8} stroke-width="0.5" />
            {/each}
          </g>
          <g id="field-4step-lines" stroke="#ffffff" stroke-width="1" opacity="0.25">
            {#each Array(41) as _, i}
              {#if i % 2 !== 0}<line x1={i * 32} y1="0" x2={i * 32} y2="672" />{/if}
            {/each}
            {#each Array(22) as _, j}
              <line x1="0" y1={j * 32} x2="1280" y2={j * 32} />
            {/each}
          </g>
          <g id="yard-lines" stroke="#ffffff" stroke-width="1.5" opacity="0.7">
            {#each Array(21) as _, i}
              <line x1={i * 64} y1="0" x2={i * 64} y2="672" stroke-width={i === 10 ? "3" : "1.5"} />
            {/each}
          </g>
          <g id="field-continuous-hashes" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6">
            <line x1="0" y1="416" x2="1280" y2="416" />
            <line x1="0" y1="256" x2="1280" y2="256" />
          </g>
          <g id="field-hash-ticks" stroke="#ffffff" stroke-width="2.5" opacity="0.8">
            {#each Array(21) as _, i}
              {@const x = i * 64}
              <line x1={x} y1="250" x2={x} y2="262" />
              <line x1={x} y1="410" x2={x} y2="422" />
            {/each}
          </g>
          <g id="yard-numbers" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="700" text-anchor="middle" dominant-baseline="central" opacity="0.9">
            {#each [128, 256, 384, 512, 640, 768, 896, 1024, 1152] as x, idx}
              {@const num = [10, 20, 30, 40, 50, 40, 30, 20, 10][idx]}
              <text {x} y="45">{num}</text>
              <text {x} y="627">{num}</text>
            {/each}
          </g>
        {:else}
          <rect width="1280" height="672" fill="#fcfcfd" />
          <rect width="1280" height="672" fill="url(#pyware-4step-shade)" />
          <g id="pyware-steps-grid" stroke="#cbd5e1" stroke-width="0.5" opacity="0.3">
            {#each Array(161) as _, i}
              {#if i % 8 !== 0}<line x1={i * 8} y1="0" x2={i * 8} y2="672" />{/if}
            {/each}
            {#each Array(85) as _, j}
              <line x1="0" y1={j * 8} x2="1280" y2={j * 8} stroke-width="0.5" />
            {/each}
          </g>
          <g id="pyware-4step-lines" stroke="#94a3b8" stroke-width="0.75" opacity="0.5">
            {#each Array(41) as _, i}
              {#if i % 2 !== 0}<line x1={i * 32} y1="0" x2={i * 32} y2="672" />{/if}
            {/each}
            {#each Array(22) as _, j}
              <line x1="0" y1={j * 32} x2="1280" y2={j * 32} />
            {/each}
          </g>
          <g id="pyware-major-lines" stroke="#64748b" stroke-width="1.25">
            {#each Array(21) as _, i}
              <line x1={i * 64} y1="0" x2={i * 64} y2="672" stroke-width={i === 10 ? "2.5" : "1.25"} stroke={i === 10 ? "#334155" : "#64748b"} />
            {/each}
          </g>
          <g id="pyware-hashes" stroke="#475569" stroke-width="1" stroke-dasharray="4,4" opacity="0.8">
            <line x1="0" y1="416" x2="1280" y2="416" />
            <line x1="0" y1="256" x2="1280" y2="256" />
          </g>
          <g id="pyware-numbers" fill="#475569" font-family="monospace" font-size="20" font-weight="600" text-anchor="middle">
            {#each [128, 256, 384, 512, 640, 768, 896, 1024, 1152] as x, idx}
              {@const num = [10, 20, 30, 40, 50, 40, 30, 20, 10][idx]}
              <text {x} y="30">{num}</text>
              <text {x} y="650">{num}</text>
            {/each}
          </g>
        {/if}

        <g id="performer-dots">
          {#each performers as dot}
            <circle cx={dot.x} cy={dot.y} r="7" fill={dot.color} stroke="#ffffff" stroke-width="1.5" />
            <text x={dot.x} y={dot.y + 3.5} fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="800" text-anchor="middle">
              {dot.label}{dot.num}
            </text>
          {/each}
        </g>

        <circle cx="640" cy="336" r="4" fill={$Mode === 'football' ? '#ffffff' : '#475569'} />
      </svg>
    </div>
  </main>

  <!-- AI Chat Panel -->
  <div class="ai-panel">
    <div class="ai-panel-header">
      <span class="ai-panel-title">AI Drill Designer</span>
      {#if aiDots.length > 0}
        <button class="ai-clear-btn" on:click={clearAI}>Clear</button>
      {/if}
    </div>

    <div class="ai-chat" bind:this={chatEl}>
      {#if chatHistory.length === 0}
        <p class="ai-placeholder">Describe a formation or adjustment…</p>
      {/if}
      {#each chatHistory as msg}
        <div class="ai-msg ai-msg--{msg.role}" class:ai-msg--error={msg.isError}>
          <span class="ai-msg-label">{msg.role === 'user' ? 'You' : 'AI'}</span>
          <span class="ai-msg-text">{msg.text}</span>
        </div>
      {/each}
      {#if aiLoading}
        <div class="ai-msg ai-msg--ai">
          <span class="ai-msg-label">AI</span>
          <span class="ai-msg-text ai-thinking">Thinking…</span>
        </div>
      {/if}
    </div>

    <div class="ai-input-row">
      <textarea
        class="ai-input"
        placeholder="Formation or adjustment…"
        bind:value={aiPrompt}
        on:keydown={handleKeydown}
        disabled={aiLoading}
        rows="3"
      />
      <button class="ai-send-btn" on:click={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()}>
        {#if currentParams}Adjust{:else}Generate{/if}
      </button>
    </div>
  </div>
</div>

<style>
  .app {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .field-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    min-width: 0;
  }

  .field-wrapper {
    width: 100%;
    max-width: 1200px;
  }

  /* ── AI Chat Panel ───────────────────────────────────────── */
  .ai-panel {
    display: flex;
    flex-direction: column;
    width: 280px;
    min-width: 280px;
    height: 100vh;
    background: #1e1b2e;
    border-left: 1px solid #2d2a45;
  }

  .ai-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 10px;
    border-bottom: 1px solid #2d2a45;
    flex-shrink: 0;
  }

  .ai-panel-title {
    font-size: 13px;
    font-weight: 700;
    color: #a78bfa;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .ai-clear-btn {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 5px;
    border: 1px solid #4c1d95;
    background: transparent;
    color: #a78bfa;
    cursor: pointer;
  }

  .ai-chat {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ai-placeholder {
    font-size: 12px;
    color: #4b4870;
    text-align: center;
    margin-top: 20px;
  }

  .ai-msg {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-width: 100%;
  }

  .ai-msg-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ai-msg--user .ai-msg-label { color: #60a5fa; }
  .ai-msg--ai   .ai-msg-label { color: #a78bfa; }

  .ai-msg-text {
    font-size: 12px;
    line-height: 1.5;
    padding: 7px 10px;
    border-radius: 8px;
    word-break: break-word;
  }

  .ai-msg--user .ai-msg-text {
    background: #1d3461;
    color: #e2e8f0;
    align-self: flex-end;
  }

  .ai-msg--ai .ai-msg-text {
    background: #2d2a45;
    color: #e2e8f0;
    align-self: flex-start;
  }

  .ai-msg--error .ai-msg-text {
    background: #3b1a1a;
    color: #fca5a5;
  }

  .ai-thinking {
    color: #7c6fad !important;
    font-style: italic;
  }

  /* ── Input row ───────────────────────────────────────────── */
  .ai-input-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
    border-top: 1px solid #2d2a45;
    flex-shrink: 0;
  }

  .ai-input {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 10px;
    border-radius: 7px;
    border: 1px solid #3d3a58;
    background: #2d2a45;
    color: #e2e8f0;
    font-size: 12px;
    font-family: inherit;
    outline: none;
    resize: none;
    line-height: 1.5;
  }

  .ai-input:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124,58,237,0.25);
  }

  .ai-input::placeholder { color: #5a567a; }

  .ai-send-btn {
    padding: 7px 12px;
    border-radius: 7px;
    border: none;
    background: #7c3aed;
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    align-self: flex-end;
  }

  .ai-send-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>

// src/core/worker.ts
function createWorker() {
  const workerScript = `
    // PoW Worker for Wayn CAPTCHA
    let wasmModule = null;
    
    async function loadWasm(wasmUrl) {
      if (wasmModule) return wasmModule;
      
      try {
        // Import the WASM module
        const wasmImport = await import(wasmUrl);
        await wasmImport.default();
        wasmModule = wasmImport;
        return wasmModule;
      } catch (error) {
        console.error('Failed to load WASM:', error);
        throw error;
      }
    }
    
    async function solveChallenge(salt, target) {
      let nonce = 0;
      const maxIterations = 1000000; // Prevent infinite loops
      
      // Simple PoW implementation (you'll need to replace this with your actual WASM implementation)
      while (nonce < maxIterations) {
        const input = salt + nonce.toString();
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
        const hashArray = new Uint8Array(hash);
        
        // Check if hash meets target difficulty
        let leadingZeros = 0;
        for (let i = 0; i < hashArray.length; i++) {
          if (hashArray[i] === 0) {
            leadingZeros += 8;
          } else {
            leadingZeros += Math.clz32(hashArray[i]) - 24;
            break;
          }
        }
        
        if (leadingZeros >= target) {
          return nonce;
        }
        
        nonce++;
      }
      
      throw new Error('Failed to solve challenge within iteration limit');
    }
    
    self.onmessage = async function(e) {
      const { salt, target, wasmUrl } = e.data;
      
      try {
        if (wasmUrl) {
          await loadWasm(wasmUrl);
        }
        
        const nonce = await solveChallenge(salt, target);
        
        self.postMessage({
          found: true,
          nonce: nonce
        });
      } catch (error) {
        self.postMessage({
          found: false,
          error: error.message
        });
      }
    };
  `;
  const blob = new Blob([workerScript], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}
async function solveChallenges(challenges, workerCount = navigator.hardwareConcurrency || 4, onProgress, wasmUrl) {
  const workers = [];
  const results = [];
  let completed = 0;
  const total = challenges.length;
  for (let i = 0; i < Math.min(workerCount, challenges.length); i++) {
    workers.push(createWorker());
  }
  const solveSingleChallenge = (challenge, workerId) => {
    return new Promise((resolve, reject) => {
      const worker = workers[workerId];
      const timeout = setTimeout(() => {
        worker.terminate();
        workers[workerId] = createWorker();
        reject(new Error("Worker timeout"));
      }, 3e4);
      worker.onmessage = (event) => {
        const { found, nonce, error } = event.data;
        clearTimeout(timeout);
        if (found) {
          completed++;
          const progress = Math.round(completed / total * 100);
          onProgress?.(progress);
          resolve([challenge.salt, challenge.target, nonce]);
        } else {
          reject(new Error(error || "Failed to solve challenge"));
        }
      };
      worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`Worker error: ${error.message}`));
      };
      worker.postMessage({
        salt: challenge.salt,
        target: challenge.target,
        wasmUrl
      });
    });
  };
  try {
    for (let i = 0; i < challenges.length; i += workers.length) {
      const batch = challenges.slice(i, i + workers.length);
      const batchResults = await Promise.all(
        batch.map((challenge, index) => solveSingleChallenge(challenge, index))
      );
      results.push(...batchResults);
    }
    return results;
  } finally {
    workers.forEach((worker) => {
      try {
        worker.terminate();
      } catch (error) {
        console.error("Error terminating worker:", error);
      }
    });
  }
}

// src/core/WaynWidget.ts
var WaynWidget = class extends HTMLElement {
  constructor() {
    super();
    this.resetTimer = null;
    this.isProcessing = false;
    this.state = {
      state: "idle",
      progress: 0,
      token: null,
      error: null
    };
    // Default i18n texts
    this.i18n = {
      initialState: "I'm a human",
      verifying: "Verifying...",
      verified: "You're a human",
      error: "Error. Try again."
    };
    this.shadow = this.attachShadow({ mode: "open" });
    this.setupWidget();
  }
  static get observedAttributes() {
    return [
      "api",
      "color",
      "worker-count",
      "disabled",
      "data-i18n-initial-state",
      "data-i18n-verifying",
      "data-i18n-verified",
      "data-i18n-error"
    ];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue)
      return;
    switch (name) {
      case "data-i18n-initial-state":
        this.i18n.initialState = newValue || this.i18n.initialState;
        break;
      case "data-i18n-verifying":
        this.i18n.verifying = newValue || this.i18n.verifying;
        break;
      case "data-i18n-verified":
        this.i18n.verified = newValue || this.i18n.verified;
        break;
      case "data-i18n-error":
        this.i18n.error = newValue || this.i18n.error;
        break;
    }
    this.updateUI();
  }
  connectedCallback() {
    this.updateUI();
    this.addEventListeners();
  }
  disconnectedCallback() {
    this.cleanup();
  }
  setupWidget() {
    this.container = document.createElement("div");
    this.container.className = "wayn-widget";
    this.container.innerHTML = `
      <div class="wayn-widget__content">
        <div class="wayn-widget__checkbox"></div>
        <span class="wayn-widget__text">${this.i18n.initialState}</span>
      </div>
      
      <a href="https://github.com/islemci/wayn" 
         class="wayn-widget__credits" 
         target="_blank" 
         rel="noopener noreferrer"
         aria-label="Secured by Wayn">
        <span class="wayn-widget__credits-text">Secured by&nbsp;</span>
        Wayn
      </a>
      
      <input type="hidden" name="wayn-token" value="">
    `;
    this.injectStyles();
    this.shadow.appendChild(this.container);
  }
  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      /* Wayn Widget Styles */
      .wayn-widget {
        --wayn-background: #fdfdfd;
        --wayn-border-color: #dddddd8f;
        --wayn-border-radius: 14px;
        --wayn-color: #212121;
        --wayn-checkbox-size: 25px;
        --wayn-checkbox-border: 1px solid #aaaaaad1;
        --wayn-checkbox-border-radius: 6px;
        --wayn-checkbox-background: #fafafa91;
        --wayn-gap: 15px;
        --wayn-widget-height: 30px;
        --wayn-widget-width: 230px;
        --wayn-widget-padding: 14px;
        --wayn-spinner-color: #000;
        --wayn-spinner-background-color: #eee;
        --wayn-spinner-thickness: 5px;
        --wayn-font: system, -apple-system, "BlinkMacSystemFont", ".SFNSText-Regular", "San Francisco", "Roboto", "Segoe UI", "Helvetica Neue", "Lucida Grande", "Ubuntu", "arial", sans-serif;
        
        box-sizing: border-box;
        background-color: var(--wayn-background);
        border: 1px solid var(--wayn-border-color);
        border-radius: var(--wayn-border-radius);
        user-select: none;
        height: var(--wayn-widget-height);
        width: var(--wayn-widget-width);
        display: flex;
        align-items: center;
        padding: var(--wayn-widget-padding);
        gap: var(--wayn-gap);
        cursor: pointer;
        transition: filter 0.2s, transform 0.2s;
        position: relative;
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0);
        overflow: hidden;
        color: var(--wayn-color);
        font-family: var(--wayn-font);
      }

      .wayn-widget:hover {
        filter: brightness(98%);
      }

      .wayn-widget:focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }

      .wayn-widget--dark {
        --wayn-background: #2d2d2d;
        --wayn-border-color: #4a4a4a;
        --wayn-color: #ffffff;
        --wayn-checkbox-background: #404040;
        --wayn-checkbox-border: 1px solid #666666;
        --wayn-spinner-color: #ffffff;
        --wayn-spinner-background-color: #555555;
      }

      .wayn-widget__content {
        display: flex;
        align-items: center;
        gap: var(--wayn-gap);
        flex: 1;
      }

      .wayn-widget__checkbox {
        width: var(--wayn-checkbox-size);
        height: var(--wayn-checkbox-size);
        border: var(--wayn-checkbox-border);
        border-radius: var(--wayn-checkbox-border-radius);
        background-color: var(--wayn-checkbox-background);
        transition: opacity 0.2s;
        margin-top: 2px;
        margin-bottom: 2px;
        flex-shrink: 0;
      }

      .wayn-widget__text {
        margin: 0;
        font-weight: 500;
        font-size: 15px;
        user-select: none;
        transition: opacity 0.2s;
        font-family: var(--wayn-font);
      }

      .wayn-widget--verifying .wayn-widget__checkbox {
        background: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: scale(1.1);
        border: none;
        border-radius: 50%;
        background: conic-gradient(
          var(--wayn-spinner-color) 0%, 
          var(--wayn-spinner-color) var(--progress, 0%), 
          var(--wayn-spinner-background-color) var(--progress, 0%), 
          var(--wayn-spinner-background-color) 100%
        );
        position: relative;
      }

      .wayn-widget--verifying .wayn-widget__checkbox::after {
        content: "";
        background-color: var(--wayn-background);
        width: calc(100% - var(--wayn-spinner-thickness));
        height: calc(100% - var(--wayn-spinner-thickness));
        border-radius: 50%;
        margin: calc(var(--wayn-spinner-thickness) / 2);
      }

      .wayn-widget--verified .wayn-widget__checkbox {
        border: 1px solid transparent;
        background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cstyle%3E%40keyframes%20anim%7B0%25%7Bstroke-dashoffset%3A23.21320343017578px%7Dto%7Bstroke-dashoffset%3A0%7D%7D%3C%2Fstyle%3E%3Cpath%20fill%3D%22none%22%20stroke%3D%22%2300a67d%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22m5%2012%205%205L20%207%22%20style%3D%22stroke-dashoffset%3A0%3Bstroke-dasharray%3A23.21320343017578px%3Banimation%3Aanim%20.5s%20ease%22%2F%3E%3C%2Fsvg%3E");
        background-size: cover;
      }

      .wayn-widget--verified {
        cursor: default;
      }

      .wayn-widget--error .wayn-widget__checkbox {
        border: 1px solid transparent;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24'%3E%3Cpath fill='%23f55b50' d='M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8'/%3E%3C/svg%3E");
        background-size: cover;
      }

      .wayn-widget--error {
        cursor: pointer;
      }

      .wayn-widget__credits {
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 12px;
        color: var(--wayn-color);
        opacity: 0.8;
        text-decoration: none;
        font-family: var(--wayn-font);
      }

      .wayn-widget__credits:hover {
        opacity: 1;
      }

      .wayn-widget__credits-text {
        display: none;
        text-decoration: underline;
      }

      .wayn-widget__credits:hover .wayn-widget__credits-text {
        display: inline-block;
      }

      .wayn-widget[aria-disabled="true"] {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .wayn-widget--verifying {
        cursor: progress;
      }

      @media (max-width: 480px) {
        .wayn-widget {
          --wayn-widget-width: 200px;
          --wayn-widget-padding: 12px;
        }
        
        .wayn-widget__text {
          font-size: 14px;
        }
      }

      @media (prefers-contrast: high) {
        .wayn-widget {
          --wayn-border-color: #000000;
          --wayn-checkbox-border: 2px solid #000000;
        }
        
        .wayn-widget--dark {
          --wayn-border-color: #ffffff;
          --wayn-checkbox-border: 2px solid #ffffff;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .wayn-widget,
        .wayn-widget__checkbox,
        .wayn-widget__text {
          transition: none;
        }
      }
    `;
    this.shadow.appendChild(style);
  }
  addEventListeners() {
    this.container.addEventListener("click", this.handleClick.bind(this));
    this.container.addEventListener("keydown", this.handleKeyDown.bind(this));
    const creditsLink = this.container.querySelector(".wayn-widget__credits");
    creditsLink.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
  handleClick() {
    if (this.canInteract()) {
      this.solve();
    }
  }
  handleKeyDown(event) {
    if ((event.key === "Enter" || event.key === " ") && this.canInteract()) {
      event.preventDefault();
      this.solve();
    }
  }
  canInteract() {
    return !this.isProcessing && !this.hasAttribute("disabled") && (this.state.state === "idle" || this.state.state === "error");
  }
  async solve() {
    if (this.isProcessing)
      return;
    const api = this.getAttribute("api");
    if (!api) {
      this.handleError("API endpoint is required");
      return;
    }
    this.isProcessing = true;
    try {
      this.setState({
        state: "verifying",
        progress: 0,
        token: null,
        error: null
      });
      const challengeResponse = await fetch(`${api}/challenge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!challengeResponse.ok) {
        throw new Error(`Failed to get challenge: ${challengeResponse.statusText}`);
      }
      const challengeData = await challengeResponse.json();
      const workerCount = parseInt(this.getAttribute("worker-count") || "") || navigator.hardwareConcurrency || 4;
      const solutions = await solveChallenges(
        challengeData.challenge,
        workerCount,
        this.handleProgress.bind(this)
      );
      const solutionResponse = await fetch(`${api}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: challengeData.token,
          solutions
        })
      });
      if (!solutionResponse.ok) {
        throw new Error(`Failed to verify solution: ${solutionResponse.statusText}`);
      }
      const solutionData = await solutionResponse.json();
      if (!solutionData.success) {
        throw new Error("Solution verification failed");
      }
      this.setState({
        state: "verified",
        progress: 100,
        token: solutionData.token,
        error: null
      });
      this.dispatchEvent(new CustomEvent("wayn:solve", {
        detail: { token: solutionData.token },
        bubbles: true
      }));
      if (solutionData.expires) {
        const expiresIn = new Date(solutionData.expires).getTime() - Date.now();
        if (expiresIn > 0 && expiresIn < 24 * 60 * 60 * 1e3) {
          this.resetTimer = window.setTimeout(() => this.reset(), expiresIn);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      this.handleError(errorMessage);
    } finally {
      this.isProcessing = false;
    }
  }
  handleProgress(progress) {
    this.setState({
      ...this.state,
      progress
    });
    this.dispatchEvent(new CustomEvent("wayn:progress", {
      detail: { progress },
      bubbles: true
    }));
  }
  handleError(error) {
    this.setState({
      state: "error",
      progress: 0,
      token: null,
      error
    });
    this.dispatchEvent(new CustomEvent("wayn:error", {
      detail: { error },
      bubbles: true
    }));
  }
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }
  updateUI() {
    const color = this.getAttribute("color") || "light";
    const disabled = this.hasAttribute("disabled");
    this.container.className = `wayn-widget wayn-widget--${color} wayn-widget--${this.state.state}`;
    if (disabled) {
      this.container.setAttribute("aria-disabled", "true");
    } else {
      this.container.removeAttribute("aria-disabled");
    }
    const textElement = this.container.querySelector(".wayn-widget__text");
    if (textElement) {
      switch (this.state.state) {
        case "verifying":
          textElement.textContent = `${this.i18n.verifying} ${this.state.progress}%`;
          break;
        case "verified":
          textElement.textContent = this.i18n.verified;
          break;
        case "error":
          textElement.textContent = this.i18n.error;
          break;
        default:
          textElement.textContent = this.i18n.initialState;
      }
    }
    if (this.state.state === "verifying") {
      const checkboxElement = this.container.querySelector(".wayn-widget__checkbox");
      if (checkboxElement) {
        checkboxElement.style.setProperty("--progress", `${this.state.progress}%`);
      }
    }
    const hiddenInput = this.container.querySelector('input[name="wayn-token"]');
    if (hiddenInput) {
      hiddenInput.value = this.state.token || "";
    }
    this.container.setAttribute("aria-label", this.getAriaLabel());
    this.container.setAttribute("role", "button");
    this.container.setAttribute("tabindex", disabled ? "-1" : "0");
  }
  getAriaLabel() {
    switch (this.state.state) {
      case "verifying":
        return `Verifying you're a human, ${this.state.progress}% complete`;
      case "verified":
        return "We have verified you're a human, you may now continue";
      case "error":
        return "An error occurred, click to try again";
      default:
        return "Click to verify you're a human";
    }
  }
  reset() {
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    this.setState({
      state: "idle",
      progress: 0,
      token: null,
      error: null
    });
    this.dispatchEvent(new CustomEvent("wayn:reset", {
      bubbles: true
    }));
  }
  cleanup() {
    if (this.resetTimer) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
  // Public API
  get token() {
    return this.state.token;
  }
  get isVerified() {
    return this.state.state === "verified";
  }
  resetWidget() {
    this.reset();
  }
};

// src/core/index.ts
if (!customElements.get("wayn-widget")) {
  customElements.define("wayn-widget", WaynWidget);
}
var Wayn = class {
  constructor(config) {
    this.widget = document.createElement("wayn-widget");
    this.widget.setAttribute("api", config.api);
    if (config.color) {
      this.widget.setAttribute("color", config.color);
    }
    if (config.workerCount) {
      this.widget.setAttribute("worker-count", config.workerCount.toString());
    }
    if (config.i18n) {
      if (config.i18n.initialState) {
        this.widget.setAttribute("data-i18n-initial-state", config.i18n.initialState);
      }
      if (config.i18n.verifying) {
        this.widget.setAttribute("data-i18n-verifying", config.i18n.verifying);
      }
      if (config.i18n.verified) {
        this.widget.setAttribute("data-i18n-verified", config.i18n.verified);
      }
      if (config.i18n.error) {
        this.widget.setAttribute("data-i18n-error", config.i18n.error);
      }
    }
    if (config.container) {
      config.container.appendChild(this.widget);
    } else {
      this.widget.style.display = "none";
      document.body.appendChild(this.widget);
    }
  }
  // Event listeners
  onSolve(callback) {
    this.widget.addEventListener("wayn:solve", (event) => {
      const customEvent = event;
      callback(customEvent.detail.token);
    });
  }
  onProgress(callback) {
    this.widget.addEventListener("wayn:progress", (event) => {
      const customEvent = event;
      callback(customEvent.detail.progress);
    });
  }
  onError(callback) {
    this.widget.addEventListener("wayn:error", (event) => {
      const customEvent = event;
      callback(customEvent.detail.error);
    });
  }
  onReset(callback) {
    this.widget.addEventListener("wayn:reset", callback);
  }
  // Public methods
  get token() {
    return this.widget.token;
  }
  get isVerified() {
    return this.widget.isVerified;
  }
  reset() {
    this.widget.resetWidget();
  }
  destroy() {
    if (this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }
  }
};
if (typeof window !== "undefined") {
  window.Wayn = Wayn;
  window.WaynWidget = WaynWidget;
}
export {
  Wayn,
  WaynWidget
};
//# sourceMappingURL=wayn-widget.esm.js.map

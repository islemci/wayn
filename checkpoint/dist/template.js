"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TEMPLATE = void 0;
exports.renderTemplate = renderTemplate;
/**
 * Default HTML template for the checkpoint page
 */
exports.DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
  <head>
    <title>Verifying you are a human…</title>
    <meta name="title" content="Verifying you are a human…" />
    <meta
      name="description"
      content="A preview of this link is unavailable while a browser check is in progress."
    />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="Verifying you are a human…" />
    <meta
      property="og:description"
      content="A preview of this link is unavailable while a browser check is in progress."
    />

    <meta property="twitter:title" content="Verifying you are a human…" />
    <meta
      property="twitter:description"
      content="A preview of this link is unavailable while a browser check is in progress."
    />

    <style>
      * {
        box-sizing: border-box;
      }
      body {
        max-width: 690px;
        margin: 3em auto;
        padding: 18px;
        font-family: system-ui;
      }
      h1 {
        font-weight: 600;
        font-size: 26px;
        margin-bottom: 0px;
      }
      h2 {
        font-weight: 400;
        font-size: 20px;
        margin-top: 7px;
        margin-bottom: 1.5em;
        color: #171717;
      }
      wayn-widget {
        margin-bottom: 4em;
      }
      hr {
        border: 0;
        border-top: 1px solid #dddddd8f;
        margin: 2em 0;
      }
      h3 {
        font-weight: 600;
        font-size: 18px;
        margin-top: 1.5em;
        margin-bottom: 0px;
      }
      p {
        font-weight: 400;
        font-size: 16px;
        line-height: 1.5;
        margin-top: 10px;
        color: #171717;
      }
      footer {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      footer .credit {
        display: flex;
        gap: 8px;
        align-items: center;
        text-decoration: none;
        color: #171717;
      }
      footer .credit:hover {
        opacity: 0.7;
      }
      footer .credit img {
        width: 26px;
        height: 26px;
      }
      footer .date {
        font-size: 15px;
        color: #888;
        margin: 0px;
        margin-left: auto;
      }
      .loading {
        text-align: center;
        color: #666;
        margin: 2em 0;
      }
      .error {
        background: #fee;
        border: 1px solid #fcc;
        color: #c33;
        padding: 1em;
        border-radius: 4px;
        margin: 1em 0;
      }
    </style>
  </head>
  <body>
    <h1>Checking your browser...</h1>
    <script>
      document.querySelector("h1").innerText = location.host;
    </script>
    <h2>Verifying you are a human before proceeding...</h2>

    <div id="wayn-challenge-container">
      <div class="loading">Preparing challenge...</div>
    </div>

    <noscript>
      <style>
        .info {
          display: none;
        }
        a {
          color: #0a91e7;
        }
        h3 {
          line-height: 1.3;
          margin-bottom: 1em;
        }
      </style>
      <h3>
        JavaScript is disabled and we were unable to verify you. To access this
        page, please
        <a
          href="https://www.whatismybrowser.com/guides/how-to-enable-javascript/auto"
          target="_blank"
          rel="nofollow noopener"
        >
          enable JavaScript
        </a>
      </h3>
      <hr />
    </noscript>

    <div class="info">
      <hr />

      <h3>Why am I seeing this page?</h3>
      <p>
        To keep our site secure, we need to confirm you're a human and not a
        robot. This quick check helps stop spam and abuse.
      </p>

      <h3>What should I do?</h3>
      <p>
        No action is required on your end. Once verified, you'll continue to
        your destination. If you're stuck, try refreshing the page or checking
        your connection.
      </p>

      <hr />
    </div>

    <footer>
      <a
        href="https://wayn.dev/"
        target="_blank"
        rel="noopener"
        class="credit"
      >
        <img
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjYiIGhlaWdodD0iMjYiIHZpZXdCb3g9IjAgMCAyNiAyNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiByeD0iNCIgZmlsbD0iIzAwN0FGRiIvPgo8cGF0aCBkPSJNOCA2SDEwVjIwSDhWNlpNMTIgOEgxOFYxMEgxMlY4Wk0xMiAxMkgxNlYxNEgxMlYxMlpNMTIgMTZIMThWMThIMTJWMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"
          aria-hidden="true"
          title="Wayn logo"
          alt="Wayn logo"
        />
        <span>Wayn</span>
      </a>
      <p class="date">{{TIME}}</p>
    </footer>

    <script>
      window.WAYN_CONFIG = {
        apiEndpoint: '{{API_ENDPOINT}}',
        tokenValidityHours: {{TOKEN_VALIDITY_HOURS}},
        cookieName: '{{COOKIE_NAME}}',
        questionCount: {{QUESTION_COUNT}},
        questionHardness: {{QUESTION_HARDNESS}}
      };

      let waynChallenge = null;
      
      // Fetch challenge from server
      async function fetchChallenge() {
        try {
          const response = await fetch(window.WAYN_CONFIG.apiEndpoint + '/challenge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch challenge');
          }
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.message || 'Challenge generation failed');
          }
          
          waynChallenge = data;
          initializeWidget();
        } catch (error) {
          console.error('Error fetching challenge:', error);
          showError('Failed to load challenge. Please refresh the page.');
        }
      }

      function showError(message) {
        const container = document.getElementById('wayn-challenge-container');
        container.innerHTML = '<div class="error">' + message + '</div>';
      }

      function initializeWidget() {
        const container = document.getElementById('wayn-challenge-container');
        
        // Create widget element based on available widget type
        let widget;
        if (window.WaynWidget) {
          // Use @usewayn/widget if available
          widget = new window.WaynWidget({
            container: container,
            endpoint: window.WAYN_CONFIG.apiEndpoint,
            onSolve: handleSolution
          });
        } else {
          // Fallback to cap-widget style
          widget = document.createElement('cap-widget');
          widget.id = 'wayn-widget';
          widget.setAttribute('data-cap-api-endpoint', window.WAYN_CONFIG.apiEndpoint + '/');
          
          container.innerHTML = '';
          container.appendChild(widget);

          // Listen for solution events
          widget.addEventListener('solve', handleSolution);
        }

        // Set challenge data if available
        if (waynChallenge && widget.setChallenge) {
          widget.setChallenge(waynChallenge.challenge);
        }

        // Auto-solve after widget is initialized
        setTimeout(() => {
          if (widget.solve) {
            widget.solve();
          }
        }, 100);
      }

      async function handleSolution(event) {
      async function handleSolution(event) {
        try {
          document.querySelector("h2").innerText = "Verifying solution...";
          
          const solutions = event.detail ? event.detail.solutions : event.solutions;
          
          const response = await fetch(window.WAYN_CONFIG.apiEndpoint + '/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: waynChallenge.token,
              solutions: solutions
            })
          });

          const result = await response.json();
          
          if (result.success && result.jwt) {
            document.querySelector("h2").innerText = "Continuing to your destination...";

            // Set the clearance cookie
            document.cookie = \`\${window.WAYN_CONFIG.cookieName}=\${result.jwt}; path=/; max-age=\${window.WAYN_CONFIG.tokenValidityHours * 3600}; SameSite=Strict; Secure\`;

            // Redirect after a short delay
            setTimeout(() => {
              location.reload();
            }, 1000);
          } else {
            throw new Error(result.message || 'Verification failed');
          }
        } catch (error) {
          console.error('Verification error:', error);
          showError('Verification failed. Please try again.');
        }
      }

      // Start challenge after 2 seconds
      setTimeout(() => {
        fetchChallenge();
      }, 2000);
    </script>
    
    <!-- Load Wayn Widget -->
    <script src="https://cdn.jsdelivr.net/npm/@usewayn/widget@latest/dist/wayn-widget.min.js"></script>
  </body>
</html>`;
/**
 * Replace template variables with actual values
 */
function renderTemplate(template, apiEndpoint, tokenValidityHours, cookieName, questionCount, questionHardness) {
    const now = new Date().toISOString();
    return template
        .replace(/{{API_ENDPOINT}}/g, apiEndpoint)
        .replace(/{{TOKEN_VALIDITY_HOURS}}/g, tokenValidityHours.toString())
        .replace(/{{COOKIE_NAME}}/g, cookieName)
        .replace(/{{QUESTION_COUNT}}/g, questionCount.toString())
        .replace(/{{QUESTION_HARDNESS}}/g, questionHardness.toString())
        .replace(/{{TIME}}/g, now);
}
//# sourceMappingURL=template.js.map
# MATRIX STUDIO PRO — Changelog

## v6.0 — Developer Workstation
- Added a multi-file editor workspace with tabs, line numbers, file import/export, find/replace, basic whitespace cleanup, and keyboard shortcuts.
- Added JavaScript execution in a dedicated Web Worker with a hard timeout and no DOM access to the parent application.
- Added Developer Terminal, a browser-local command workbench with explicit runtime boundaries.
- Expanded the prompt library with software architecture, backend/API, SQL, Python/data, frontend, security/testing, DevOps, AI, and technical product/business templates.
- Added a stylized Unicode identity for Mohamed Salah and larger system-font typography without remote font requests.
- Added offline shell caching for `pro.js` and bumped service worker cache versions.
- Migrates saved v5 data when opening v6 for the first time.

## Runtime boundaries
- This release includes a lightweight offline editor, not the Monaco Editor distribution.
- It does not bundle Node.js, Bash, PowerShell, or an operating-system terminal. Developer Terminal is a safe in-browser workbench.
- Python runs through Pyodide and its large runtime files must be fetched once online before they can be cached for offline use.
- Browser storage is local to the browser profile. Export backups before clearing browser data or changing devices.


## v7.0 — Mobile-first update
- Rebuilt phone navigation as a fixed, horizontally scrollable bottom bar with readable page names.
- Removed desktop-only Ctrl/Command + Enter guidance from the Python mobile input.
- Increased touch target sizes and input readability; added safe-area spacing for iPhone.
- Improved editor and project layouts for narrow screens and landscape orientation.
- Replaced the blackletter signature with a readable decorative script: 𝑴𝒐𝒉𝒂𝒎𝒆𝒅 𝑺𝒂𝒍𝒂𝒉.
- Updated service-worker cache keys to ensure the new shell is fetched.

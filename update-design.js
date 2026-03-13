const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Update font family
const newFontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
css = css.replace(/font-family:\s*'Inter'[^;]*;/g, \ont-family: \;\);

// Find styling for .cd-tabs-bar and replace
const tabsRegex = /\.cd-tabs-bar\s*\{[\s\S]*?\.cd-tabs\s+button\.active\s*\{[\s\S]*?\}/;
const newTabs = \.cd-tabs-bar {
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
}
.cd-tabs {
    display: inline-flex;
    background-color: #f1f5f9;
    padding: 4px;
    border-radius: 12px;
    gap: 4px;
    width: 100%;
}
@media (min-width: 768px) {
    .cd-tabs {
        width: auto;
    }
}
.cd-tabs button {
    flex: 1;
    background: transparent !important;
    border: none !important;
    color: var(--text-light) !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    padding: 10px 16px !important;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    border-radius: 8px !important;
    border-bottom: none !important;
}
.cd-tabs button:hover {
    color: var(--text-dark) !important;
}
.cd-tabs button.active {
    background-color: #ffffff !important;
    color: var(--text-dark) !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) !important;
}\;

css = css.replace(tabsRegex, newTabs);

fs.writeFileSync('src/index.css', css);
console.log('Done CSS');
const fs = require('fs');

const cssToAdd = \

/* ========================================================
   ALTO FITNESS DESKTOP REFACTOR (MARCH 2026 UPDATE)
   ======================================================== */

:root {
  --alto-green: #28a745;
  --alto-green-light: #e6f4ea;
  --alto-bg: #f8fafc;
  --alto-card-bg: #ffffff;
  --alto-border: #e2e8f0;
  --alto-text-dark: #0f172a;
  --alto-text-light: #64748b;
  --alto-radius: 16px;
}

/* Base Body and Main Setup */
body {
    background-color: var(--alto-bg);
}

.app-container {
    max-width: 100%;
    margin: 0;
    box-shadow: none;
    background-color: var(--alto-bg);
}

.dashboard-layout {
    display: flex;
    flex-direction: row; /* Sidebar on left */
    height: 100vh;
}

.dashboard-content {
    flex: 1;
    background-color: var(--alto-bg);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

main.dashboard-content {
    background-color: var(--alto-bg) !important;
}

.screen {
    padding: 40px !important; /* Generous padding */
    background-color: var(--alto-bg);
}

/* ========================================================
   SIDEBAR (BottomNav on Desktop)
   ======================================================== */
@media (min-width: 900px) {
    nav.bottom-nav {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        width: 260px;
        min-width: 260px;
        height: 100vh;
        position: static;
        border-top: none;
        border-right: 1px solid var(--alto-border);
        background-color: var(--alto-card-bg);
        padding: 0;
        z-index: 100;
        box-shadow: none;
    }

    .sidebar-header {
        display: flex;
        padding: 32px 24px 40px 24px;
    }

    .sidebar-logo {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .logo-icon-circle {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background-color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .logo-text {
        display: flex;
        flex-direction: column;
    }

    .logo-name {
        font-size: 18px;
        font-weight: 800;
        color: #000;
        line-height: 1.1;
    }

    .logo-label {
        font-size: 10px;
        font-weight: 700;
        color: var(--alto-green);
        letter-spacing: 0.5px;
    }

    .nav-items-group {
        display: flex;
        flex-direction: column;
        padding: 0 16px;
        gap: 8px;
        flex: 1;
    }

    .bottom-nav button {
        flex-direction: row;
        justify-content: flex-start;
        padding: 12px 16px;
        border-radius: 12px;
        gap: 16px;
        font-size: 15px;
        font-weight: 600;
        color: var(--alto-text-light);
        transition: all 0.2s ease;
    }

    .bottom-nav button svg {
        width: 20px;
        height: 20px;
        stroke: var(--alto-text-light);
    }

    .bottom-nav button:hover {
        background-color: #f1f5f9;
        color: var(--alto-text-dark);
    }

    .bottom-nav button.active {
        background-color: var(--alto-green-light);
        color: var(--alto-green);
    }

    .bottom-nav button.active svg {
        stroke: var(--alto-green);
        fill: none; /* Only stroke for icons generally, unless specified */
    }

    .sidebar-footer {
        display: flex;
        flex-direction: column;
        padding: 16px;
        border-top: 1px solid var(--alto-border);
        gap: 8px;
    }

    .sidebar-user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin-top: 8px;
        border-radius: 12px;
        cursor: pointer;
    }

    .sidebar-user-profile:hover {
        background-color: #f1f5f9;
    }

    .sidebar-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: var(--alto-text-dark);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
    }

    .sidebar-user-info {
        display: flex;
        flex-direction: column;
    }

    .sidebar-user-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--alto-text-dark);
    }

    .sidebar-user-role {
        font-size: 12px;
        font-weight: 500;
        color: var(--alto-text-light);
    }
}

/* ========================================================
   TOP HEADER
   ======================================================== */
.cd-modern-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
}

.cd-title-area h1 {
    font-size: 32px;
    font-weight: 800;
    color: var(--alto-text-dark);
    margin: 0 0 8px 0;
}

.cd-title-area p {
    font-size: 15px;
    color: var(--alto-text-light);
    margin: 0;
}

.cd-header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}

.cd-search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.cd-search-box svg {
    position: absolute;
    left: 16px;
    width: 18px;
    height: 18px;
    color: var(--alto-text-light);
}

.cd-search-box input {
    padding: 10px 16px 10px 42px;
    border-radius: 30px; /* Pill shape */
    border: none;
    background-color: var(--alto-border);
    font-size: 14px;
    width: 250px;
    transition: all 0.2s ease;
}

.cd-search-box input:focus {
    background-color: #fff;
    box-shadow: 0 0 0 2px var(--alto-green-light);
}

.btn-icon-circular {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: var(--alto-card-bg);
    border: 1px solid var(--alto-border);
    color: var(--alto-text-dark);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-icon-circular:hover {
    background-color: #f1f5f9;
}

.cd-btn-primary.pill {
    padding: 10px 24px;
    border-radius: 30px;
    background-color: var(--alto-green);
    color: white;
    font-weight: 600;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cd-btn-primary.pill:hover {
    background-color: #218838;
}

/* ========================================================
   STAT CARDS
   ======================================================== */
.cd-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 40px;
}

.cd-stat-card {
    background-color: var(--alto-card-bg);
    border-radius: var(--alto-radius);
    padding: 24px;
    border: 1px solid var(--alto-border);
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    position: relative;
    align-items: flex-start;
}

.cd-stat-header-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    margin-bottom: 20px;
}

.cd-stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cd-stat-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}

.badge-green { background-color: var(--alto-green-light); color: var(--alto-green); }
.badge-orange { background-color: #fef3c7; color: #d97706; }
.badge-grey { background-color: #f1f5f9; color: var(--alto-text-light); }

.cd-stat-info {
    display: flex;
    flex-direction: column-reverse; /* Put number at bottom, label above */
    gap: 8px;
}

.cd-stat-title {
    font-size: 14px;
    color: var(--alto-text-light);
    font-weight: 600;
}

.cd-stat-figure {
    font-size: 36px;
    font-weight: 800;
    color: var(--alto-text-dark);
    line-height: 1;
}

/* ========================================================
   TABS
   ======================================================== */
.cd-tabs-modern {
    display: flex;
    gap: 32px;
    border-bottom: 1px solid var(--alto-border);
    margin-bottom: 32px;
}

.cd-tabs-modern button {
    background: none;
    border: none;
    padding: 0 0 12px 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--alto-text-light);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    width: auto;
    transition: all 0.2s ease;
}

.cd-tabs-modern button:hover {
    color: var(--alto-text-dark);
}

.cd-tabs-modern button.active {
    color: var(--alto-text-dark);
    font-weight: 700;
    border-bottom: 2px solid var(--alto-green);
}

/* ========================================================
   CLIENT CARDS GRID
   ======================================================== */
.cd-grid-clients {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
}

.cd-business-card {
    background-color: var(--alto-card-bg);
    border-radius: var(--alto-radius);
    padding: 20px;
    border: 1px solid var(--alto-border);
    display: flex;
    flex-direction: column;
    gap: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s;
}

.cd-business-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.cd-bc-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.cd-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #f1f5f9;
    color: var(--alto-text-dark);
    font-weight: 700;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cd-bc-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
}

.cd-bc-title h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--alto-text-dark);
}

.pill-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 12px;
    background-color: var(--alto-green-light);
    color: var(--alto-green);
    font-weight: 700;
    letter-spacing: 0.5px;
}

.cd-bc-body {
    display: flex;
    gap: 24px;
    padding: 16px 0;
    border-top: 1px dashed var(--alto-border);
    border-bottom: 1px dashed var(--alto-border);
}

.cd-info-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.cd-lbl {
    font-size: 12px;
    color: var(--alto-text-light);
    font-weight: 500;
}

.cd-val {
    font-size: 14px;
    font-weight: 600;
    color: var(--alto-text-dark);
}

.cd-val.text-green {
    color: var(--alto-green);
}

.cd-bc-footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sub-label {
    font-size: 10px;
    color: var(--alto-text-light);
    font-weight: 700;
    letter-spacing: 0.5px;
}

.cd-prog-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cd-prog-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--alto-text-dark);
}

.cd-prog-pct {
    font-size: 14px;
    font-weight: 700;
    color: var(--alto-text-dark);
}

.thick-prog-bar {
    height: 8px;
    background-color: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
}

.thick-prog-fill {
    height: 100%;
    background-color: var(--alto-green);
    border-radius: 4px;
}

.cd-business-card.add-new-client {
    border: 2px dashed var(--alto-border);
    background-color: transparent;
    align-items: center;
    justify-content: center;
    color: var(--alto-text-light);
    min-height: 220px;
}

.cd-business-card.add-new-client:hover {
    border-color: var(--alto-green);
    color: var(--alto-green);
    background-color: var(--alto-green-light);
}

.add-new-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
}

.cd-business-card.add-new-client:hover .add-new-circle {
    background-color: rgba(40,167,69,0.1);
}

\;

fs.appendFileSync('src/index.css', cssToAdd);

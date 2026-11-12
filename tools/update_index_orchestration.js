import fs from 'node:fs';

let html = fs.readFileSync('src/client/dev_viewer/index.html', 'utf8');

const target1 = '<button class="btn-quick-feature btn-glow-gold" id="btn-open-chaos-modal" title="Abrir Máquina do Caos de Noria">⚡ Chaos Machine</button>';
const addition1 = '\r\n        <button class="btn-quick-feature" id="btn-open-server-orchestration-modal" style="background: linear-gradient(180deg, #8b5cf6, #6d28d9); border-color: #a78bfa; color: #fff; font-weight: bold;" title="Painel de Orquestração Mestre do Servidor (Reset, Quests, Party, Trade, Gens)">👑 Orquestrador Servidor</button>';

if (!html.includes('btn-open-server-orchestration-modal')) {
  html = html.replace(target1, target1 + addition1);
}

const target2 = '<script type="module" src="app.js"></script>';
const modalHtml = `
  <!-- Modal da Orquestração Mestre do Servidor -->
  <div class="dasi-modal-overlay" id="modal-server-orchestration" style="display: none;">
    <div class="dasi-modal-card" style="max-width: 920px; width: 95%;">
      <div class="dasi-modal-header" style="background: linear-gradient(90deg, #4c1d95, #1e1b4b); border-bottom: 1px solid #7c3aed;">
        <div class="modal-title-wrap">
          <span class="modal-icon">👑</span>
          <h3 style="color: #e9d5ff; font-family: 'Cinzel', serif;">ORQUESTRAÇÃO MESTRE DAS FUNÇÕES DO SERVIDOR</h3>
        </div>
        <button class="btn-close-modal" id="btn-close-orch-modal" onclick="document.getElementById('modal-server-orchestration').style.display='none'">&times;</button>
      </div>
      <div class="dasi-modal-body" style="padding: 18px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
        <!-- Card 1: Progressão & Resets -->
        <div class="orch-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 8px; padding: 14px;">
          <h4 style="color: #c084fc; margin: 0 0 8px 0; font-family: 'Cinzel', serif;">🌟 Progressão & Resets</h4>
          <p style="font-size: 11.5px; color: #94a3b8; margin-bottom: 10px;">Resets canônicos no nível 400 (+500 pts por reset) e Master Resets com premiação em WCoins.</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-quick-feature" id="btn-orch-reset" style="background: linear-gradient(180deg, #7c3aed, #5b21b6); color: #fff; font-weight: bold; width: 100%;">🌟 Executar Reset (Lv 400)</button>
            <button class="btn-quick-feature" id="btn-orch-mreset" style="background: linear-gradient(180deg, #d97706, #92400e); color: #fff; font-weight: bold; width: 100%;">👑 Master Reset (100 Resets)</button>
          </div>
        </div>

        <!-- Card 2: Quests Canônicas -->
        <div class="orch-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 8px; padding: 14px;">
          <h4 style="color: #38bdf8; margin: 0 0 8px 0; font-family: 'Cinzel', serif;">📜 Quests de Evolução</h4>
          <p style="font-size: 11.5px; color: #94a3b8; margin-bottom: 10px;">Sebina Priestess (2ª Classe Lv 150), Marlon (Combo Lv 220) e Apostle Devin (3ª Classe Lv 400).</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-quick-feature" id="btn-orch-quest-info" style="background: #1e293b; border: 1px solid #38bdf8; color: #7dd3fc; width: 100%;">🔍 Consultar Status Quests</button>
            <button class="btn-quick-feature" id="btn-orch-quest-sebina" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 100%;">⚔️ Evoluir 2ª Classe (Sebina)</button>
            <button class="btn-quick-feature" id="btn-orch-quest-marlon" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 100%;">⚡ Desbloquear Combo (Marlon)</button>
            <button class="btn-quick-feature" id="btn-orch-quest-devin" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 100%;">👑 Evoluir 3ª Classe (Devin)</button>
          </div>
        </div>

        <!-- Card 3: Social & Gens System -->
        <div class="orch-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; padding: 14px;">
          <h4 style="color: #f87171; margin: 0 0 8px 0; font-family: 'Cinzel', serif;">⚔️ Famílias Gens & Party</h4>
          <p style="font-size: 11.5px; color: #94a3b8; margin-bottom: 10px;">Duprian vs Vanert, ranking de líderes e formação de grupo com bônus de Gold Party.</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; gap: 6px;">
              <button class="btn-quick-feature" id="btn-orch-gens-duprian" style="background: rgba(220, 38, 38, 0.3); border: 1px solid #ef4444; color: #fca5a5; flex: 1;">🛡️ Duprian</button>
              <button class="btn-quick-feature" id="btn-orch-gens-vanert" style="background: rgba(37, 99, 235, 0.3); border: 1px solid #3b82f6; color: #93c5fd; flex: 1;">🦅 Vanert</button>
            </div>
            <button class="btn-quick-feature" id="btn-orch-gens-status" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 100%;">📊 Status Gens & Patente</button>
            <button class="btn-quick-feature" id="btn-orch-party-leave" style="background: #1e293b; border: 1px solid #f43f5e; color: #fda4af; width: 100%;">🤝 Sair da Party</button>
          </div>
        </div>

        <!-- Card 4: Economia & Negociações -->
        <div class="orch-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 8px; padding: 14px;">
          <h4 style="color: #4ade80; margin: 0 0 8px 0; font-family: 'Cinzel', serif;">🏪 Loja Pessoal & Trade</h4>
          <p style="font-size: 11.5px; color: #94a3b8; margin-bottom: 10px;">Personal Shop seguro limitado a 2B Zen e sistema de troca atômica com anti-scam.</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-quick-feature" id="btn-orch-pshop-open" style="background: rgba(34, 197, 94, 0.25); border: 1px solid #22c55e; color: #86efac; width: 100%;">🏪 Abrir Personal Shop</button>
            <button class="btn-quick-feature" id="btn-orch-pshop-close" style="background: #1e293b; border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; width: 100%;">❌ Fechar Loja Pessoal</button>
            <button class="btn-quick-feature" id="btn-orch-trade-cancel" style="background: #1e293b; border: 1px solid #f59e0b; color: #fde68a; width: 100%;">⚖️ Cancelar Troca Atômica</button>
          </div>
        </div>
      </div>
      <div class="dasi-modal-footer" style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.95);">
        <span style="font-size: 12px; color: #a78bfa;">⚡ <em>Servidor 100% Autoritativo Zero-Trust: Validação no GameServer.ts</em></span>
        <button class="btn-close-modal-footer" onclick="document.getElementById('modal-server-orchestration').style.display='none'">Fechar</button>
      </div>
    </div>
  </div>\r\n\r\n  ` + target2;

if (!html.includes('modal-server-orchestration')) {
  html = html.replace(target2, modalHtml);
}

fs.writeFileSync('src/client/dev_viewer/index.html', html, 'utf8');
console.log('index.html updated successfully with server orchestration modal!');

import fs from 'fs';
import path from 'path';

// Parse Monster.txt
const monsterFilePath = path.join('reference', 'mu_roxgaming_5.2', 'server', 'Data', 'Monster', 'Monster.txt');
const monsterLines = fs.readFileSync(monsterFilePath, 'utf-8').split('\n');

const allMonsters = [];
for (const line of monsterLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//') || trimmed === 'end') continue;
  const match = trimmed.match(/^(\d+)\s+(\d+)\s+"([^"]+)"\s+(\d+)/);
  if (match) {
    allMonsters.push({
      id: parseInt(match[1]),
      type: parseInt(match[2]),
      name: match[3],
      level: parseInt(match[4]),
    });
  }
}

console.log('=== AUDITORIA CANÔNICA DE MONSTROS & NPCS (Monster.txt) ===');
console.log('Total de registros no Monster.txt:', allMonsters.length);

const npcs = allMonsters.filter(m => m.type !== 0 || m.level === 0 || (m.id >= 200 && m.id <= 300));
console.log('Total catalogado de NPCs:', npcs.length);

const goldenMonsters = allMonsters.filter(m => m.name.toLowerCase().includes('golden'));
console.log('\n--- Monstros Dourados (' + goldenMonsters.length + ') ---');
goldenMonsters.forEach(m => console.log(`  [ID ${m.id}] ${m.name} (Lv ${m.level})`));

const iconicBosses = allMonsters.filter(m => m.name.match(/Kundun|Nightmare|Maya|Balgass|Erohim|Hell Maine|Dark Elf|Hydra|Balrog|Gorgon|Ice Queen|Death Beam Knight|Zaikan|Selupan|Medusa/i));
console.log('\n--- Chefes & Lordes Canônicos (' + iconicBosses.length + ') ---');
iconicBosses.forEach(m => console.log(`  [ID ${m.id}] ${m.name} (Lv ${m.level})`));

// Parse Item.txt if present
const itemPath = path.join('reference', 'mu_roxgaming_5.2', 'server', 'Data', 'Item', 'Item.txt');
if (fs.existsSync(itemPath)) {
  const itemLines = fs.readFileSync(itemPath, 'utf-8').split('\n');
  console.log('\n=== AUDITORIA CANÔNICA DE ITENS & ARMARIAS (Item.txt) ===');
  console.log('Linhas de Item.txt:', itemLines.length);
}

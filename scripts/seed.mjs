#!/usr/bin/env node
/**
 * Seed script — populates the database with common Vietnamese café items.
 * Usage: node scripts/seed.mjs [API_BASE_URL]
 *
 * Reads SEED_API_URL or argv[2], defaults to http://localhost:3000
 */

const BASE = process.argv[2] || process.env.SEED_API_URL || 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  console.log(`Seeding via ${BASE} …\n`);

  // ── Categories ──
  const categories = [
    { name: 'Cà phê', description: 'Cà phê pha phin, máy, và đá xay' },
    { name: 'Trà', description: 'Trà truyền thống và trà trái cây' },
    { name: 'Trà sữa', description: 'Trà sữa và đá xay' },
    { name: 'Đồ ăn vặt', description: 'Bánh ngọt và đồ ăn nhẹ' },
    { name: 'Nước giải khát', description: 'Nước ép, soda, và nước đóng chai' },
  ];

  const createdMenus = [];
  for (const cat of categories) {
    const m = await post('/menus', cat);
    createdMenus.push(m);
    console.log(`  ✓ ${cat.name}`);
  }

  // ── Menu items (price in VND) ──
  const [cafe, tra, trasua, doan, nuoc] = createdMenus;

  const items = [
    // Cà phê
    { menuId: cafe.id, name: 'Cà phê đen', price: 25000 },
    { menuId: cafe.id, name: 'Cà phê sữa', price: 30000 },
    { menuId: cafe.id, name: 'Bạc xỉu', price: 35000 },
    { menuId: cafe.id, name: 'Cà phê muối', price: 35000 },
    { menuId: cafe.id, name: 'Espresso', price: 40000 },
    { menuId: cafe.id, name: 'Americano', price: 45000 },
    { menuId: cafe.id, name: 'Cappuccino', price: 50000 },
    { menuId: cafe.id, name: 'Latte', price: 55000 },

    // Trà
    { menuId: tra.id, name: 'Trà đá', price: 10000 },
    { menuId: tra.id, name: 'Trà chanh', price: 20000 },
    { menuId: tra.id, name: 'Trà vải', price: 30000 },
    { menuId: tra.id, name: 'Trà đào', price: 35000 },
    { menuId: tra.id, name: 'Trà tắc', price: 25000 },
    { menuId: tra.id, name: 'Trà gừng', price: 25000 },

    // Trà sữa
    { menuId: trasua.id, name: 'Trà sữa trân châu', price: 40000 },
    { menuId: trasua.id, name: 'Trà sữa matcha', price: 45000 },
    { menuId: trasua.id, name: 'Trà sữa khoai môn', price: 45000 },
    { menuId: trasua.id, name: 'Socola đá xay', price: 50000 },
    { menuId: trasua.id, name: 'Matcha đá xay', price: 55000 },

    // Đồ ăn vặt
    { menuId: doan.id, name: 'Bánh croissant', price: 30000 },
    { menuId: doan.id, name: 'Bánh muffin', price: 25000 },
    { menuId: doan.id, name: 'Sandwich', price: 40000 },
    { menuId: doan.id, name: 'Bánh tiramisu', price: 45000 },
    { menuId: doan.id, name: 'Cookie', price: 15000 },

    // Nước giải khát
    { menuId: nuoc.id, name: 'Nước cam', price: 35000 },
    { menuId: nuoc.id, name: 'Nước chanh', price: 25000 },
    { menuId: nuoc.id, name: 'Soda chanh', price: 30000 },
    { menuId: nuoc.id, name: 'Coca-Cola', price: 20000 },
    { menuId: nuoc.id, name: 'Nước suối', price: 10000 },
  ];

  for (const item of items) {
    await post('/menu-items', item);
  }
  console.log(`\n  ✓ ${items.length} menu items`);

  // ── Tables ──
  const tables = ['Bàn 1', 'Bàn 2', 'Bàn 3', 'Bàn 4', 'Bàn 5', 'Bàn 6'];
  for (const t of tables) {
    await post('/tables', { tableNumber: t });
  }
  console.log(`  ✓ ${tables.length} tables`);

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

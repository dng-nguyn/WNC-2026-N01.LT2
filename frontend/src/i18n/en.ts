/**
 * English UI strings — same keys as vi.ts.
 * Keys not present here fall back to the key itself.
 */
const en = {
  // ── Common ──
  'common.loading': 'Loading…',
  'common.error': 'An error occurred',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.search': 'Search',
  'common.back': 'Back',
  'common.done': 'Done',

  // ── Navigation / Sidebar ──
  'nav.dashboard': 'Dashboard',
  'nav.pos': 'POS Terminal',
  'nav.categories': 'Menu Categories',
  'nav.menuItems': 'Menu Items',
  'nav.tables': 'Tables',
  'nav.logout': 'Logout',

  // ── Auth ──
  'auth.login': 'Login',
  'auth.register': 'Register',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.fullName': 'Full Name',
  'auth.signIn': 'Sign In',
  'auth.createAccount': 'Create Account',
  'auth.noAccount': "Don't have an account?",
  'auth.hasAccount': 'Already have an account?',
  'auth.registerHere': 'Register here',
  'auth.loginHere': 'Sign in here',

  // ── Dashboard ──
  'dashboard.welcome': 'Welcome',
  'dashboard.totalRevenue': 'Total Revenue',
  'dashboard.totalOrders': 'Total Orders',
  'dashboard.completed': 'Completed',
  'dashboard.pending': 'Pending',
  'dashboard.avgOrderValue': 'Avg Order Value',
  'dashboard.topItems': 'Top Selling Items',
  'dashboard.loading': 'Loading dashboard…',

  // ── POS ──
  'pos.title': 'POS Terminal',
  'pos.all': 'All',
  'pos.cart': 'Cart',
  'pos.emptyCart': 'Tap items to add them here',
  'pos.total': 'Total',
  'pos.pay': 'Pay',
  'pos.clear': 'Clear',
  'pos.table': 'Table',
  'pos.takeaway': 'Takeaway',

  // ── Payment ──
  'payment.selectMethod': 'Select Payment Method',
  'payment.cash': 'Cash',
  'payment.bankTransfer': 'Bank Transfer (SePay)',
  'payment.creating': 'Creating order…',
  'payment.scanQR': 'Scan QR Code to Pay',
  'payment.waiting': 'Waiting for payment…',
  'payment.checked': 'checked',
  'payment.times': 'times',
  'payment.transferred': 'I have transferred',
  'payment.payCash': 'Pay with Cash',
  'payment.success': 'Payment successful!',
  'payment.failed': 'Payment failed',
  'payment.tryAgain': 'Try Again',
  'payment.notFound': 'Transaction not found yet. Please wait and try again.',
  'payment.timeout': 'Timed out. Please try again.',
  'payment.total': 'Total',

  // ── Menu Management ──
  'menu.title': 'Menu Categories',
  'menu.newCategory': 'New Category',
  'menu.name': 'Name',
  'menu.description': 'Description',
  'menu.empty': 'No categories yet',

  // ── Menu Items ──
  'menuItems.title': 'Menu Items',
  'menuItems.newItem': 'New Item',
  'menuItems.category': 'Category',
  'menuItems.name': 'Name',
  'menuItems.price': 'Price (₫)',
  'menuItems.available': 'Available',
  'menuItems.yes': 'Yes',
  'menuItems.no': 'No',
  'menuItems.empty': 'No menu items yet',
} as const;

export default en;

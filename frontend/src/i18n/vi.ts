/**
 * Vietnamese UI strings — flat key map for simple lookup.
 * Organized by feature area via key prefixes: pos.*, menu.*, payment.*, nav.*, common.*
 */
const vi = {
  // ── Common ──
  'common.loading': 'Đang tải…',
  'common.error': 'Đã xảy ra lỗi',
  'common.save': 'Lưu',
  'common.cancel': 'Hủy',
  'common.delete': 'Xóa',
  'common.edit': 'Chỉnh sửa',
  'common.close': 'Đóng',
  'common.search': 'Tìm kiếm',
  'common.back': 'Quay lại',
  'common.done': 'Xong',

  // ── Navigation / Sidebar ──
  'nav.dashboard': 'Tổng quan',
  'nav.pos': 'Bán hàng',
  'nav.categories': 'Danh mục',
  'nav.menuItems': 'Món',
  'nav.tables': 'Bàn',
  'nav.manageTables': 'Quản lý bàn',
  'nav.transactions': 'Lịch sử giao dịch',
  'nav.logout': 'Đăng xuất',
  'nav.employees': 'Quản lý nhân viên',
  'nav.settings': 'Cài đặt',

  // ── Auth ──
  'auth.login': 'Đăng nhập',
  'auth.register': 'Đăng ký',
  'auth.username': 'Tên đăng nhập',
  'auth.password': 'Mật khẩu',
  'auth.fullName': 'Họ và tên',
  'auth.signIn': 'Đăng nhập',
  'auth.createAccount': 'Tạo tài khoản',
  'auth.noAccount': 'Chưa có tài khoản?',
  'auth.hasAccount': 'Đã có tài khoản?',
  'auth.registerHere': 'Đăng ký tại đây',
  'auth.loginHere': 'Đăng nhập tại đây',

  // ── Dashboard ──
  'dashboard.welcome': 'Chào mừng',
  'dashboard.totalRevenue': 'Tổng doanh thu',
  'dashboard.totalOrders': 'Tổng đơn hàng',
  'dashboard.completed': 'Hoàn thành',
  'dashboard.pending': 'Đang chờ',
  'dashboard.avgOrderValue': 'Giá trị TB',
  'dashboard.topItems': 'Món bán chạy',
  'dashboard.loading': 'Đang tải dashboard…',

  // ── POS ──
  'pos.title': 'POS Terminal',
  'pos.all': 'Tất cả',
  'pos.cart': 'Giỏ hàng',
  'pos.emptyCart': 'Chạm vào món để thêm vào đây',
  'pos.total': 'Tổng cộng',
  'pos.pay': 'Thanh toán',
  'pos.clear': 'Xóa giỏ',
  'pos.table': 'Bàn',
  'pos.takeaway': 'Mang về',

  // ── Payment ──
  'payment.selectMethod': 'Chọn phương thức thanh toán',
  'payment.cash': 'Tiền mặt',
  'payment.bankTransfer': 'Chuyển khoản (SePay)',
  'payment.creating': 'Đang tạo đơn…',
  'payment.scanQR': 'Quét mã QR để thanh toán',
  'payment.waiting': 'Đang chờ thanh toán…',
  'payment.checked': 'đã kiểm tra',
  'payment.times': 'lần',
  'payment.transferred': 'Tôi đã chuyển tiền',
  'payment.payCash': 'Thanh toán tiền mặt',
  'payment.success': 'Thanh toán thành công!',
  'payment.failed': 'Thanh toán thất bại',
  'payment.tryAgain': 'Thử lại',
  'payment.notFound': 'Chưa tìm thấy giao dịch. Vui lòng đợi và thử lại.',
  'payment.timeout': 'Hết thời gian chờ. Vui lòng thử lại.',
  'payment.total': 'Tổng',

  // ── Menu Management ──
  'menu.title': 'Quản lý danh mục',
  'menu.newCategory': 'Danh mục mới',
  'menu.name': 'Tên',
  'menu.description': 'Mô tả',
  'menu.empty': 'Chưa có danh mục nào',

  // ── Menu Items ──
  'menuItems.title': 'Quản lý món',
  'menuItems.newItem': 'Món mới',
  'menuItems.category': 'Danh mục',
  'menuItems.name': 'Tên',
  'menuItems.price': 'Giá (₫)',
  'menuItems.available': 'Có sẵn',
  'menuItems.yes': 'Có',
  'menuItems.no': 'Hết',
  'menuItems.empty': 'Chưa có món nào',
} as const;

export type TranslationKey = keyof typeof vi;
export default vi;

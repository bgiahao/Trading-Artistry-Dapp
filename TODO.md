# TradeLog — Outcomes

- [ ] **Đăng nhập và dữ liệu riêng theo tài khoản** — Ứng dụng hỗ trợ đăng nhập tài khoản người dùng bằng Manus OAuth; mỗi tài khoản chỉ nhìn thấy và thao tác với nhật ký giao dịch của chính mình; giao diện có trạng thái chưa đăng nhập và nút đăng nhập rõ ràng.
- [ ] **Dashboard KPI và Equity Curve** — Dashboard hiển thị Tổng PnL theo $ và %, Win Rate %, Risk/Reward trung bình, Expectancy theo R và Max Drawdown %; có biểu đồ đường cong tài sản theo thời gian phản ánh lịch sử giao dịch; trạng thái rỗng hữu ích khi chưa có lệnh.
- [ ] **Phân tích theo Setup và loại tài sản** — Dashboard có các bảng/biểu đồ so sánh PnL và Win Rate theo từng Setup/Model và theo loại tài sản gồm Cổ phiếu, Crypto, Hàng hóa/Futures.
- [ ] **Trade Entry và tự động tính toán** — Form nhập Symbol, loại tài sản, Long/Short, Entry, Exit, Position Size, Stop Loss, Take Profit, % Risk/Trade, Setup, Link ảnh TradingView Chart và ghi chú/nhật ký cảm xúc; tự động tính $ Risk, Risk/Reward, PnL, kết quả và bội số R như +2R/-1R.
- [ ] **Trade Log Table và bộ lọc** — Danh sách lệnh rõ ràng hỗ trợ tìm kiếm và lọc theo Loại tài sản, Setup, khoảng thời gian và kết quả Thắng/Thua/Hòa; có thao tác xóa và hiển thị liên kết chart/ghi chú.
- [ ] **Import/Export CSV và Excel** — Người dùng có thể xuất toàn bộ dữ liệu giao dịch của mình ra CSV và file Excel-compatible; có thể nhập CSV/TSV/Excel HTML và lưu hàng loạt vào nhật ký.
- [ ] **Responsive dark-mode UI và mã nguồn sạch** — Dark Mode mặc định, responsive tốt trên desktop và điện thoại, cấu trúc React/Express/tRPC/Drizzle rõ ràng, biểu đồ dùng Recharts, route manifest được khai báo và project có thể build/check.

- [ ] New trades may be saved as incomplete drafts with optional fields; users can edit them later from Trade Journal.
- [ ] Incomplete trades, except chart image links and notes, must be excluded from Overview and Analytics performance calculations until all required trade fields are filled.

- [ ] Trading Artistry branding, five-item sidebar navigation, Dashboard, Journal, Trading Performance Analytics, trading information and trusted Links pages are available.
- [ ] Client-side mock/state data keeps the interface immediate without depending on server API calls.
- [ ] Account setup supports initial capital, deposit/withdraw actions, immutable cash history, timezone selection and personalized account presets.
- [ ] Trade entry/edit supports Trading Fee / Commission and Swap / Overnight Fee, and calculates Net PnL = Gross PnL - Trading Fee - Swap Fee; win rate, equity curve, R-Multiple and drawdown use Net PnL.
- [ ] Real-time market session ticker shows Sydney, Tokyo, London and New York Open/Closed state, London-New York overlap, and Auto/UTC/Asia/Saigon timezone choices.
- [ ] Light/Dark theme toggle and basic profile settings (name, email, avatar initials and defaults) are available.

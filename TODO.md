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

- [ ] Main app routing exposes /dashboard, /journal, /trades, /trades/:id, /playbook and /analytics with one shared client-side trade state.
- [ ] Dashboard exposes Net P&L, Win Rate, Profit Factor, Average Win/Loss, Total Trades, Average RRR, Expectancy, Sharpe Ratio, equity range filters, daily PnL calendar and Artistry consistency/risk review surfaces.
- [ ] Daily Journal provides month-grid PnL, selected-day trade details, per-day notes, 1–5 discipline rating and economic-calendar context.
- [ ] Trades and Trade Detail provide tag/asset/date/result/setup filtering, execution chart markers, MAE, MFE, hold duration, expected-vs-realized R and pyramiding tree.
- [ ] Playbook provides VCP and strategy checklist workflows with live checklist compliance and playbook-linked trade metrics.
- [ ] Analytics provides time-of-day, weekday, monthly, tag/setup edge analysis and a historical-edge Kelly-inspired position sizing calculator.

- [ ] Advanced Analytics provides report export actions for PDF/Print and Excel-compatible spreadsheet output using the currently selected account set.
- [ ] Currency settings allow switching USD/EUR/GBP/% and applying a custom starting balance reset for the active account; percentage display uses that balance as its denominator.
- [ ] Account manager supports multiple local accounts, adding an account, selecting an active account, checking multiple accounts for combined stats, and showing per-account trade count and P&L.

- [ ] Navigation includes a new “Công cụ & Sàn giao dịch” item routed to /tools.
- [ ] The Tools page provides a clear category dropdown and two grouped areas: Exchanges & Brokers and chart-analysis tools.
- [ ] Each exchange/tool item shows a compact logo-style icon, name, asset-type description, opens in a new tab, and uses the supplied referral links for FTMO, The5ers, Binance, Bybit, XM and TradingView; official home links are used for OKX, Exness and IC Markets where no referral URL was supplied.

- [ ] New trade entry uses a three-step SEPA wizard: execution inputs with live risk calculation and >8% warning, Trend Template/Base Pattern/Pivot & Market Regime checklist, and a real-time score audit preview.
- [ ] calculateSEPAScore applies the specified 30/30/25/15 weighting, chasing thresholds, 8% risk rule and A+/A/B/C-FOMO grade mapping; saved trades retain score, grade, risk and chasing metrics.
- [ ] SEPA audit fields are represented in the client trade model and PostgreSQL/Supabase Drizzle schema, with migration drizzle-pg/0001_broad_adam_warlock.sql generated for pivot, checklist, pattern, regime, score and audit metrics.

- [x] Currency/account control allows deleting an individual account with confirmation, prevents deleting the final remaining account, and removes only that account's local trades.
- [x] Balance editing uses a pending value plus an explicit confirmation action; confirmed starting capital updates the active account and persists locally.
- [x] The currency/account panel shows total equity across accounts and each account's calculated balance and realised net P&L, while account selection still controls visible analytics.
- [x] The application provides Vietnamese and English language modes, persists the selection, and translates navigation, account controls, filters, dashboard KPI headings, journal labels and core workspace copy using financial terminology.

- [x] Playbook supports creating, editing, deleting and locally persisting custom strategies with a name and one-or-more rules.
- [x] Custom strategies are a shared source for Playbook checklist compliance, Stage 2 Pattern Validation strategy selection, and Performance Analytics setup/edge reporting; renaming a custom strategy updates existing local trade tags.

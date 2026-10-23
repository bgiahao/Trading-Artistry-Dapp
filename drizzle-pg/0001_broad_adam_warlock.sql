CREATE TYPE "public"."sepa_market_regime" AS ENUM('CONFIRMED_UPTREND', 'UPTREND_UNDER_PRESSURE', 'MARKET_IN_CORRECTION');--> statement-breakpoint
CREATE TYPE "public"."sepa_pattern_type" AS ENUM('VCP', 'CUP_HANDLE', 'HTF', 'DOUBLE_BOTTOM', 'FLAT_BASE', 'NONE');--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "pivot_price" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "above_ma50_ma200" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "ma200_uptrend" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "near_52w_high" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "pattern_type" "sepa_pattern_type" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "vcp_contractions" integer;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "last_contraction_pct" double precision;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "volume_dryup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "market_regime" "sepa_market_regime" DEFAULT 'CONFIRMED_UPTREND' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "sepa_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "sepa_grade" varchar(16) DEFAULT 'C / FOMO' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "chasing_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "risk_pct" double precision DEFAULT 0 NOT NULL;
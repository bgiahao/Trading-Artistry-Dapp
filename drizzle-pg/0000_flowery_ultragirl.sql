CREATE TYPE "public"."asset_type" AS ENUM('Stocks', 'Crypto', 'Commodities/Futures');--> statement-breakpoint
CREATE TYPE "public"."direction" AS ENUM('Long', 'Short');--> statement-breakpoint
CREATE TYPE "public"."trade_result" AS ENUM('win', 'loss', 'breakeven');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"symbol" varchar(32) NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"direction" "direction" NOT NULL,
	"entry_price" double precision NOT NULL,
	"exit_price" double precision NOT NULL,
	"position_size" double precision NOT NULL,
	"stop_loss" double precision NOT NULL,
	"take_profit" double precision NOT NULL,
	"risk_trade_pct" double precision DEFAULT 1 NOT NULL,
	"setup" varchar(80) NOT NULL,
	"chart_url" varchar(500),
	"notes" text,
	"opened_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone NOT NULL,
	"risk_amount" double precision NOT NULL,
	"rr_ratio" double precision NOT NULL,
	"pnl" double precision NOT NULL,
	"r_multiple" double precision NOT NULL,
	"result" "trade_result" NOT NULL,
	"is_complete" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trades_user_id_idx" ON "trades" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trades_closed_at_idx" ON "trades" USING btree ("user_id","closed_at");
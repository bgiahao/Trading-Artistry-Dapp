ALTER TABLE `trades` ADD CONSTRAINT `trades_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trades_user_id_idx` ON `trades` (`userId`);--> statement-breakpoint
CREATE INDEX `trades_closed_at_idx` ON `trades` (`userId`,`closedAt`);
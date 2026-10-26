ALTER TABLE `tasks` ADD `reminded_at` integer;--> statement-breakpoint
-- Tasks already overdue at upgrade do not raise alerts.
UPDATE `tasks` SET `reminded_at` = cast(unixepoch('subsec') * 1000 as integer) WHERE `due_date` < date('now', 'localtime');

-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.3.12-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             10.2.0.5599
-- --------------------------------------------------------
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
-- Dumping structure for view redbot.active
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `active` (
  `tag` VARCHAR(45) NULL COLLATE 'utf8mb4_unicode_ci',
  `user` VARCHAR(18) NOT NULL COLLATE 'utf8mb4_unicode_ci',
  `end` TIMESTAMP NOT NULL,
  `final` TIMESTAMP NOT NULL,
  `final_id` INT(11) NOT NULL,
  `active` INT(1) NOT NULL,
  `updated` TIMESTAMP NULL
) ENGINE = MyISAM;
-- Dumping structure for table redbot.schema
CREATE TABLE IF NOT EXISTS `schema` (
  `version` int(2) NOT NULL,
  `populated` int(1) DEFAULT 0,
  PRIMARY KEY (`version`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Data exporting was unselected.
-- Dumping structure for table redbot.subscriptions
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `begin` timestamp NOT NULL DEFAULT current_timestamp(),
  `woocomerce_id` bigint(20) DEFAULT NULL,
  `end` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `end_timestamp` (`end`),
  KEY `FK_subscriptions_users` (`user`)
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Data exporting was unselected.
-- Dumping structure for table redbot.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discrim` int(4) NOT NULL,
  `joined` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) unsigned NOT NULL DEFAULT 0,
  `avatar` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tag` varchar(45) GENERATED ALWAYS AS (concat(`username`, '#', lpad(`discrim`, 4, '0'))) VIRTUAL,
  PRIMARY KEY (`id`),
  KEY `joined` (`joined`),
  KEY `top_role` (`active`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- Data exporting was unselected.
-- Dumping structure for view active
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `active`;
CREATE ALGORITHM = MERGE DEFINER = `root` @`localhost` SQL SECURITY DEFINER VIEW `active` AS
select
  `g`.`tag` AS `tag`,
  `f`.`user` AS `user`,
  `f`.`end` AS `end`,
  `c`.`final` AS `final`,
  `c`.`final_id` AS `final_id`,
  if(`c`.`final` > current_timestamp(), 1, 0) AS `active`,
  `c`.`updated` AS `updated`
from
  (
    (
      (
        (
          select
            `b`.`user` AS `user`,
            `b`.`end` AS `final`,
            `b`.`id` AS `final_id`,
            `b`.`updated` AS `updated`
          from
            (
              (
                (
                  select
                    max(`subscriptions`.`end`) AS `mxend`,
                    `subscriptions`.`user` AS `user`
                  from
                    `subscriptions`
                  group by
                    `subscriptions`.`user`
                )
              ) `a`
              join `subscriptions` `b` on(
                `a`.`user` = `b`.`user`
                and `a`.`mxend` = `b`.`end`
              )
            )
        )
      ) `c`
      join (
        select
          `e`.`end` AS `end`,
          `e`.`user` AS `user`
        from
          (
            (
              (
                select
                  max(`subscriptions`.`end`) AS `mxend`,
                  `subscriptions`.`user` AS `user`
                from
                  `subscriptions`
                where
                  `subscriptions`.`begin` < current_timestamp()
                group by
                  `subscriptions`.`user`
              )
            ) `d`
            join `subscriptions` `e` on(
              `d`.`user` = `e`.`user`
              and `d`.`mxend` = `e`.`end`
            )
          )
      ) `f`
    )
    join `users` `g` on(
      `c`.`user` = `f`.`user`
      and `g`.`id` = `f`.`user`
    )
  ) WITH LOCAL CHECK OPTION;
  /*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
  /*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
  /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
CREATE TABLE IF NOT EXISTS `bot` (
  `version` int(2) NOT NULL,
  `populated` int(1) DEFAULT 0,
  PRIMARY KEY (`version`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(18) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `begin` timestamp NOT NULL DEFAULT current_timestamp(),
  `woocomerce_id` bigint(20) DEFAULT NULL,
  `end` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `end_timestamp` (`end`),
  KEY `FK_subscriptions_users` (`user`),
  KEY `updated` (`updated`)
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf32 COLLATE = utf32_unicode_ci;
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(18) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discrim` int(4) NOT NULL,
  `joined` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created` timestamp NULL DEFAULT NULL,
  `avatar` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tag` varchar(45) GENERATED ALWAYS AS (concat(`username`, '#', lpad(`discrim`, 4, '0'))) VIRTUAL,
  PRIMARY KEY (`id`),
  KEY `joined` (`joined`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
CREATE ALGORITHM = MERGE VIEW `active` AS
select
  `a`.`tag` AS `tag`,
  `a`.`id` AS `user`,
  `b`.`end` AS `final`,
  `b`.`updated` AS `updated`,
  `b`.`id` AS `final_id`,
  if(`b`.`end` > current_timestamp(), 1, 0) AS `active`
from
  (
    `users` `a`
    join (
      select
        `l`.`id` AS `id`,
        `l`.`user` AS `user`,
        `l`.`created_by` AS `created_by`,
        `l`.`begin` AS `begin`,
        `l`.`woocomerce_id` AS `woocomerce_id`,
        `l`.`end` AS `end`,
        `l`.`updated` AS `updated`
      from
        (
          `subscriptions` `l`
          left join `subscriptions` `b` on(
            `l`.`user` = `b`.`user`
            and `l`.`end` < `b`.`end`
          )
        )
      where
        `b`.`end` is null
    ) `b` on(`a`.`id` = `b`.`user`)
  ) WITH LOCAL CHECK OPTION;
INSERT INTO
  `bot` (`version`, `populated`)
VALUES
  (1, 0);
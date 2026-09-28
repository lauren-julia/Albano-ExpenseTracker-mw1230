CREATE DATABASE IF NOT EXISTS `expenses_db`;
USE `expenses_db`;

DROP TABLE IF EXISTS `expenses`;

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `category` varchar(50) NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `expenses` (`id`, `name`, `amount`, `category`, `date`) VALUES
(1, 'Grocery Store', 142.80, 'Food', '2026-09-14'),
(2, 'Electricity Bill', 95.50, 'Utilities', '2026-09-10'),
(3, 'Gas Station Fuel', 45.00, 'Transport', '2026-09-09'),
(4, 'Movie Tickets', 32.00, 'Entertainment', '2026-09-08'),
(5, 'Coffee & Snacks', 18.25, 'Food', '2026-09-05'),
(6, 'Internet Subscription', 60.00, 'Utilities', '2026-09-01');

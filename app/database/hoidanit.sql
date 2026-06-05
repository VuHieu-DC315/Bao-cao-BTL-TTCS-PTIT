-- =====================================================
-- 1) THIẾT LẬP MÔI TRƯỜNG & LÀM SẠCH DỮ LIỆU
-- =====================================================
CREATE DATABASE IF NOT EXISTS `hoidanit`;
USE `hoidanit`;

-- Tắt kiểm tra khóa ngoại để có thể xóa bảng dễ dàng
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `carts`;
DROP TABLE IF EXISTS `vouchers`;
DROP TABLE IF EXISTS `tutorials`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `PasswordResetRequests`;
DROP TABLE IF EXISTS `Users`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 2) CẤU TRÚC BẢNG & DỮ LIỆU USERS
-- =====================================================
CREATE TABLE `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tk` varchar(255) NOT NULL,
  `mk` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `tk_unique` (`tk`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

INSERT INTO `Users` (`id`, `tk`, `mk`, `email`, `role`) VALUES 
(1,'admin','123456','admin@gmail.com','admin'),
(2,'user1','123456','user1@gmail.com','user'),
(3,'user2','123456','user2@gmail.com','user'),
(4,'user3','123456','user3@gmail.com','user'),
(5,'user4','123456','user4@gmail.com','user'),
(6,'user5','123456','user5@gmail.com','user'),
(7,'user6','123456','user6@gmail.com','user'),
(8,'user7','123456','user7@gmail.com','user'),
(9,'user8','123456','user8@gmail.com','user'),
(10,'user9','123456','user9@gmail.com','user'),
(11,'user10','123456','user10@gmail.com','user'),
(12,'khachhang123','123456','123456@gmail.com','user');

-- =====================================================
-- 3) CẤU TRÚC BẢNG & DỮ LIỆU TUTORIALS (SẢN PHẨM)
-- =====================================================
CREATE TABLE `tutorials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `published` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `price` int(11) NOT NULL DEFAULT '0',
  `quantity` int(11) NOT NULL DEFAULT '0',
  `imageData` longblob DEFAULT NULL,
  `imageMimeType` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tutorials` (`id`, `title`, `description`, `published`, `createdAt`, `updatedAt`, `price`, `quantity`) VALUES 
(1,'iPhone 15 Pro Max','Điện thoại Apple cao cấp, chip A17 Pro',1,'2026-03-16 17:18:47','2026-04-11 13:57:46',32990000,12),
(2,'Samsung Galaxy S24 Ultra','Màn hình 120Hz, Camera 200MP AI',1,'2026-03-16 17:18:47','2026-04-11 15:59:18',28990000,8),
(3,'Xiaomi 14','Chip Snapdragon 8 Gen 3 cực mạnh',1,'2026-03-16 17:18:47','2026-04-11 13:16:59',17990000,14),
(4,'OPPO Reno11','Thiết kế mỏng nhẹ, chuyên gia chân dung',1,'2026-03-16 17:18:47','2026-04-11 06:25:23',10990000,19),
(5,'Vivo V30','Sạc nhanh 80W, thiết kế mặt lưng kính',1,'2026-03-16 17:18:47','2026-04-12 15:39:47',9990000,16),
(6,'MacBook Air M3','Laptop mỏng nhẹ, hiệu năng ổn định',1,'2026-03-16 17:18:47','2026-04-12 15:33:28',31990000,5),
(7,'Dell XPS 13','Màn hình vô cực, vỏ nhôm nguyên khối',1,'2026-03-16 17:18:47','2026-04-12 14:59:55',27990000,5),
(8,'Asus ROG Strix G16','Laptop gaming, card đồ họa rời RTX 4060',1,'2026-03-16 17:18:47','2026-04-12 15:19:49',35990000,5),
(9,'iPad Air 6','Màn hình Liquid Retina, hỗ trợ Apple Pencil',1,'2026-03-16 17:18:47','2026-04-12 15:23:37',16990000,2),
(10,'AirPods Pro 2','Chống ồn chủ động vượt trội',1,'2026-03-16 17:18:47','2026-04-12 15:16:35',5990000,15);

-- Nếu database đã tạo trước đó thì chạy thêm 2 lệnh này thay vì import lại từ đầu:
-- ALTER TABLE tutorials ADD COLUMN imageData LONGBLOB NULL;
-- ALTER TABLE tutorials ADD COLUMN imageMimeType VARCHAR(100) NULL;


-- =====================================================
-- 4) CẤU TRÚC BẢNG VOUCHERS
-- =====================================================
CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `discountType` enum('percent','fixed') NOT NULL DEFAULT 'fixed',
  `discountValue` int(11) NOT NULL DEFAULT '0',
  `maxDiscount` int(11) DEFAULT NULL,
  `minOrderTotal` int(11) NOT NULL DEFAULT '0',
  `appliesTo` enum('all','product') NOT NULL DEFAULT 'all',
  `tutorialId` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `usedCount` int(11) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `fk_vouchers_tutorial` FOREIGN KEY (`tutorialId`) REFERENCES `tutorials` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `vouchers` (`code`, `name`, `discountType`, `discountValue`, `maxDiscount`, `minOrderTotal`, `appliesTo`, `tutorialId`, `quantity`, `usedCount`, `isActive`, `startDate`, `endDate`) VALUES 
('GIAM10', 'Giảm 10% đơn hàng', 'percent', 10, 200000, 500000, 'all', NULL, 100, 5, 1, '2026-04-01 00:00:00', '2026-05-01 23:59:59'),
('TRIAN500', 'Giảm trực tiếp 500k', 'fixed', 500000, NULL, 5000000, 'all', NULL, 50, 0, 1, '2026-04-10 00:00:00', '2026-04-20 23:59:59'),
('IPHONE15', 'Ưu đãi iPhone 15', 'fixed', 1000000, NULL, 0, 'product', 1, 20, 0, 1, '2026-04-11 00:00:00', '2026-04-30 23:59:59'),
('NGUOIMOI', 'Chào mừng bạn mới', 'percent', 15, 300000, 100000, 'all', NULL, 1000, 0, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59');

-- =====================================================
-- 5) CẤU TRÚC BẢNG ANNOUNCEMENTS
-- =====================================================
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` mediumtext COLLATE utf8mb4_unicode_ci,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `isPermanent` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `announcements` VALUES 
(1,'Siêu sale tháng 4','Nhập mã GIAM10 để được giảm ngay 10%!','2026-04-01 00:00:00','2026-04-30 23:59:59',0,NOW(),NOW()),
(2,'Chính sách bảo hành','Bảo hành 1 đổi 1 trong 30 ngày cho mọi thiết bị Apple.',NULL,NULL,1,NOW(),NOW());

-- =====================================================
-- 6) CẤU TRÚC BẢNG CARTS & ITEMS
-- =====================================================
CREATE TABLE `carts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `carts` VALUES 
(1,2,NOW(),NOW()),
(2,12,NOW(),NOW());

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cartId` int(11) NOT NULL,
  `tutorialId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `cart_items_ibfk_61` FOREIGN KEY (`cartId`) REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_items_ibfk_62` FOREIGN KEY (`tutorialId`) REFERENCES `tutorials` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- 7) CẤU TRÚC BẢNG ORDERS
-- =====================================================
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tutorialId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` int(11) NOT NULL DEFAULT '0',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `originalAmount` int(11) NOT NULL DEFAULT '0',
  `voucherCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voucherDiscount` int(11) NOT NULL DEFAULT '0',
  `finalAmount` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `orders` VALUES 
(1, 1, 2, 'iPhone 15 Pro Max', 1, 'user1@gmail.com', '0987654321', 32990000, 'completed', '2026-04-12 10:00:00', '2026-04-12 15:00:00', 32990000, 'IPHONE15', 1000000, 31990000),
(2, 6, 3, 'MacBook Air M3', 1, 'user2@gmail.com', '0123456789', 31990000, 'pending', '2026-04-13 08:00:00', '2026-04-13 08:00:00', 31990000, NULL, 0, 31990000);

-- =====================================================
-- 8) CẤU TRÚC BẢNG PASSWORD RESET
-- =====================================================
CREATE TABLE `PasswordResetRequests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `tk` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hoàn tất
SET FOREIGN_KEY_CHECKS = 1;
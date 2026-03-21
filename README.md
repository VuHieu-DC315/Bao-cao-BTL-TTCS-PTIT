tên Sinh Viên: Vũ Quốc Hiếu
Mã Sinh Viên: B23DCCN315

SQL:
USE hoidanit;
SHOW TABLES;

USE `hoidanit`;

-- =========================
-- 1) Users
-- =========================
INSERT INTO `Users` (`tk`, `mk`, `email`, `role`) VALUES
('user01', '123456', 'user01@gmail.com', 'USER'),
('user02', '123456', 'user02@gmail.com', 'USER'),
('user03', '123456', 'user03@gmail.com', 'USER'),
('user04', '123456', 'user04@gmail.com', 'USER'),
('user05', '123456', 'user05@gmail.com', 'USER'),
('user06', '123456', 'user06@gmail.com', 'USER'),
('user07', '123456', 'user07@gmail.com', 'USER'),
('user08', '123456', 'user08@gmail.com', 'USER'),
('user09', '123456', 'user09@gmail.com', 'USER'),
('admin01', '123456', 'admin01@gmail.com', 'ADMIN');

-- =========================
-- 2) tutorials
-- Giữ nguyên tên bảng/cột, nhưng data là sản phẩm điện tử
-- =========================
ALTER TABLE tutorials CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO `tutorials` (`title`, `description`, `price`, `published`, `createdAt`, `updatedAt`) VALUES
('iPhone 15 128GB', 'Điện thoại Apple iPhone 15 bản 128GB, màn hình OLED 6.1 inch', 18990000, 1, '2026-03-17 15:00:00', '2026-03-17 15:00:00'),
('Samsung Galaxy S24 256GB', 'Điện thoại Samsung flagship, bộ nhớ 256GB, camera AI', 20990000, 1, '2026-03-17 15:01:00', '2026-03-17 15:01:00'),
('Xiaomi Redmi Note 13', 'Điện thoại tầm trung, pin lớn, sạc nhanh', 6490000, 1, '2026-03-17 15:02:00', '2026-03-17 15:02:00'),
('MacBook Air M2 13 inch', 'Laptop Apple MacBook Air chip M2, RAM 8GB, SSD 256GB', 24990000, 1, '2026-03-17 15:03:00', '2026-03-17 15:03:00'),
('Dell Inspiron 15', 'Laptop văn phòng Dell Inspiron 15, Intel Core i5, RAM 16GB', 15990000, 1, '2026-03-17 15:04:00', '2026-03-17 15:04:00'),
('iPad Air 5 WiFi', 'Máy tính bảng Apple iPad Air 5, màn hình 10.9 inch', 14990000, 1, '2026-03-17 15:05:00', '2026-03-17 15:05:00'),
('AirPods Pro 2', 'Tai nghe không dây Apple chống ồn chủ động', 5990000, 1, '2026-03-17 15:06:00', '2026-03-17 15:06:00'),
('Loa Bluetooth JBL Flip 6', 'Loa Bluetooth chống nước, âm thanh mạnh mẽ', 2890000, 1, '2026-03-17 15:07:00', '2026-03-17 15:07:00'),
('LG Smart TV 55 inch 4K', 'Tivi LG 55 inch độ phân giải 4K, hỗ trợ HDR', 11990000, 0, '2026-03-17 15:08:00', '2026-03-17 15:08:00'),
('Chuột Logitech MX Master 3S', 'Chuột không dây cao cấp cho dân văn phòng và thiết kế', 2490000, 1, '2026-03-17 15:09:00', '2026-03-17 15:09:00');

-- =========================
-- 3) carts
-- userId map tới Users.id = 1..10
-- =========================
INSERT INTO `carts` (`userId`, `createdAt`, `updatedAt`) VALUES
(1, '2026-03-17 15:10:00', '2026-03-17 15:10:00'),
(2, '2026-03-17 15:11:00', '2026-03-17 15:11:00'),
(3, '2026-03-17 15:12:00', '2026-03-17 15:12:00'),
(4, '2026-03-17 15:13:00', '2026-03-17 15:13:00'),
(5, '2026-03-17 15:14:00', '2026-03-17 15:14:00'),
(6, '2026-03-17 15:15:00', '2026-03-17 15:15:00'),
(7, '2026-03-17 15:16:00', '2026-03-17 15:16:00'),
(8, '2026-03-17 15:17:00', '2026-03-17 15:17:00'),
(9, '2026-03-17 15:18:00', '2026-03-17 15:18:00'),
(10, '2026-03-17 15:19:00', '2026-03-17 15:19:00');

-- =========================
-- 4) cart_items
-- cartId map tới carts.id = 1..10
-- tutorialId map tới tutorials.id = 1..10
-- =========================
INSERT INTO `cart_items` (`cartId`, `tutorialId`, `quantity`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, '2026-03-17 15:20:00', '2026-03-17 15:20:00'),
(1, 7, 1, '2026-03-17 15:20:30', '2026-03-17 15:20:30'),
(2, 2, 1, '2026-03-17 15:21:00', '2026-03-17 15:21:00'),
(3, 3, 2, '2026-03-17 15:22:00', '2026-03-17 15:22:00'),
(4, 4, 1, '2026-03-17 15:23:00', '2026-03-17 15:23:00'),
(5, 5, 1, '2026-03-17 15:24:00', '2026-03-17 15:24:00'),
(6, 6, 1, '2026-03-17 15:25:00', '2026-03-17 15:25:00'),
(7, 8, 2, '2026-03-17 15:26:00', '2026-03-17 15:26:00'),
(8, 10, 1, '2026-03-17 15:27:00', '2026-03-17 15:27:00'),
(9, 9, 1, '2026-03-17 15:28:00', '2026-03-17 15:28:00'),
(10, 3, 1, '2026-03-17 15:29:00', '2026-03-17 15:29:00');

-- =========================
-- 5) orders
-- Có thêm cột price ở cuối
-- Nếu bảng orders của bạn không có updatedAt thì xóa cột updatedAt khỏi câu INSERT
-- =========================
ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO `orders` (`tutorialId`, `title`, `quantity`, `email`, `phone`, `createdAt`, `updatedAt`, `price`) VALUES
(1, 'iPhone 15 128GB', 1, 'customer01@gmail.com', '0900000001', '2026-03-17 15:30:00', '2026-03-17 15:30:00', 18990000),
(7, 'AirPods Pro 2', 1, 'customer01@gmail.com', '0900000001', '2026-03-17 15:30:30', '2026-03-17 15:30:30', 5990000),
(2, 'Samsung Galaxy S24 256GB', 1, 'customer02@gmail.com', '0900000002', '2026-03-17 15:31:00', '2026-03-17 15:31:00', 20990000),
(3, 'Xiaomi Redmi Note 13', 2, 'customer03@gmail.com', '0900000003', '2026-03-17 15:32:00', '2026-03-17 15:32:00', 6490000),
(4, 'MacBook Air M2 13 inch', 1, 'customer04@gmail.com', '0900000004', '2026-03-17 15:33:00', '2026-03-17 15:33:00', 24990000),
(5, 'Dell Inspiron 15', 1, 'customer05@gmail.com', '0900000005', '2026-03-17 15:34:00', '2026-03-17 15:34:00', 15990000),
(8, 'Loa Bluetooth JBL Flip 6', 2, 'customer06@gmail.com', '0900000006', '2026-03-17 15:35:00', '2026-03-17 15:35:00', 2890000),
(6, 'iPad Air 5 WiFi', 1, 'customer07@gmail.com', '0900000007', '2026-03-17 15:36:00', '2026-03-17 15:36:00', 14990000),
(10, 'Chuột Logitech MX Master 3S', 1, 'customer08@gmail.com', '0900000008', '2026-03-17 15:37:00', '2026-03-17 15:37:00', 2490000),
(9, 'LG Smart TV 55 inch 4K', 1, 'customer09@gmail.com', '0900000009', '2026-03-17 15:38:00', '2026-03-17 15:38:00', 11990000),
(3, 'Xiaomi Redmi Note 13', 1, 'customer10@gmail.com', '0900000010', '2026-03-17 15:39:00', '2026-03-17 15:39:00', 6490000);

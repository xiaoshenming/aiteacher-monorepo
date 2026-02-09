/*
 Navicat Premium Dump SQL

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80039 (8.0.39)
 Source Host           : localhost:3306
 Source Schema         : ai_demo2

 Target Server Type    : MySQL
 Target Server Version : 80039 (8.0.39)
 File Encoding         : 65001

 Date: 10/03/2025 16:13:35
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for authentication_requests
-- ----------------------------
DROP TABLE IF EXISTS `authentication_requests`;
CREATE TABLE `authentication_requests`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `teacher_uid` int NULL DEFAULT NULL,
  `school_id` int NOT NULL,
  `request_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT 0,
  `admin_id` int NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 19 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of authentication_requests
-- ----------------------------
INSERT INTO `authentication_requests` VALUES (1, 1, 10001, 1, '我要进来', 1, 3, '2025-03-07 18:46:35', '2025-03-08 18:46:35', '2025-03-07 18:48:18');
INSERT INTO `authentication_requests` VALUES (2, 1, 10001, 1, '我要寄', 1, 3, '2025-03-07 18:50:17', '2025-03-08 18:50:18', '2025-03-07 18:50:34');
INSERT INTO `authentication_requests` VALUES (3, 1, 10001, 1, '放我进去', 1, 3, '2025-03-07 18:57:50', '2025-03-08 18:57:50', '2025-03-07 18:58:03');
INSERT INTO `authentication_requests` VALUES (4, 2, 10002, 1, '啊啊啊啊啊', 1, 3, '2025-03-07 20:28:49', '2025-03-08 20:28:49', '2025-03-07 20:29:05');
INSERT INTO `authentication_requests` VALUES (5, 2, 10002, 1, '啊啊啊啊啊', 1, 3, '2025-03-07 20:29:14', '2025-03-08 20:29:14', '2025-03-07 20:30:44');
INSERT INTO `authentication_requests` VALUES (6, 2, 10002, 1, '啊啊啊啊啊啊啊啊', 1, 3, '2025-03-07 20:32:50', '2025-03-08 20:32:51', '2025-03-07 20:33:10');
INSERT INTO `authentication_requests` VALUES (7, 2, 10002, 1, '啊啊啊啊啊啊啊啊', 1, 3, '2025-03-07 20:35:26', '2025-03-08 20:35:27', '2025-03-07 20:35:37');
INSERT INTO `authentication_requests` VALUES (8, 2, 10002, 1, '啊啊啊啊啊啊啊啊', 1, 3, '2025-03-07 20:39:15', '2025-03-08 20:39:16', '2025-03-07 20:39:41');
INSERT INTO `authentication_requests` VALUES (9, 2, 10002, 1, '啊啊啊啊啊啊啊啊', 1, 3, '2025-03-07 20:41:43', '2025-03-08 20:41:43', '2025-03-07 20:41:52');
INSERT INTO `authentication_requests` VALUES (10, 2, 10002, 1, '啊啊啊啊啊啊啊啊', 1, 3, '2025-03-07 20:42:59', '2025-03-08 20:43:00', '2025-03-07 20:43:05');
INSERT INTO `authentication_requests` VALUES (11, 1, 10001, 1, '啊啊啊啊啊呜呜呜呜', 1, 3, '2025-03-07 21:50:21', '2025-03-08 13:50:21', '2025-03-07 21:50:31');
INSERT INTO `authentication_requests` VALUES (12, 1, 10001, 1, '啊啊啊啊啊呜呜呜呜', 1, 3, '2025-03-07 21:54:09', '2025-03-08 13:54:09', '2025-03-07 21:54:15');
INSERT INTO `authentication_requests` VALUES (13, 2, 10002, 1, '蔡少休息一下吧', 1, 3, '2025-03-07 21:55:26', '2025-03-08 13:55:26', '2025-03-07 21:55:31');
INSERT INTO `authentication_requests` VALUES (14, 1, 10001, 1, '蔡少好帅啊啊啊啊啊', 1, 3, '2025-03-07 21:58:21', '2025-03-08 13:58:21', '2025-03-07 21:58:28');
INSERT INTO `authentication_requests` VALUES (15, 2, 10002, 1, '芜湖~~~~~', 1, 3, '2025-03-07 21:58:55', '2025-03-08 13:58:55', '2025-03-07 21:59:15');
INSERT INTO `authentication_requests` VALUES (16, 1, 10001, 1, '芜湖~', 1, 3, '2025-03-07 22:08:39', '2025-03-08 14:08:39', '2025-03-07 22:08:45');
INSERT INTO `authentication_requests` VALUES (17, 2, 10002, 1, '蔡少万岁！！！！！', 1, 3, '2025-03-07 22:09:31', '2025-03-08 14:09:31', '2025-03-07 22:09:36');
INSERT INTO `authentication_requests` VALUES (18, 1, 10001, 1, '芜湖芜湖芜湖', 1, 3, '2025-03-07 22:24:01', '2025-03-08 14:24:01', '2025-03-07 22:27:28');

-- ----------------------------
-- Table structure for changelog
-- ----------------------------
DROP TABLE IF EXISTS `changelog`;
CREATE TABLE `changelog`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `version` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `updateTime` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `createTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of changelog
-- ----------------------------
INSERT INTO `changelog` VALUES (1, 'aitecher', '0.0.1', '芜湖~', '2025-01-15 19:08:05', '2025-01-15 19:08:05');
INSERT INTO `changelog` VALUES (2, 'aitecher', '0.0.2', '爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！爱老婆！ 你是我生命中的光芒！', '2025-01-15 19:10:49', '2025-01-15 19:10:49');
INSERT INTO `changelog` VALUES (3, 'aitecher', '0.0.3', '爱老婆！ 你是我每天的动力！', '2025-01-15 19:11:49', '2025-01-15 19:11:49');
INSERT INTO `changelog` VALUES (4, 'aitecher', '0.0.4', '爱老婆！ 你是我心中最美的风景！', '2025-01-15 19:12:49', '2025-01-15 19:12:49');
INSERT INTO `changelog` VALUES (5, 'aitecher', '0.0.5', '爱老婆！ 有你，生活更灿烂！', '2025-01-15 19:13:49', '2025-01-15 19:13:49');
INSERT INTO `changelog` VALUES (6, 'aitecher', '0.0.6', '爱老婆！ 你的微笑是世界上最美的光！', '2025-01-15 19:14:49', '2025-01-15 19:14:49');
INSERT INTO `changelog` VALUES (7, 'aitecher', '0.0.7', '爱老婆！ 因为你，我的世界充满阳光！', '2025-01-15 19:15:49', '2025-01-15 19:15:49');
INSERT INTO `changelog` VALUES (8, 'aitecher', '0.0.8', '爱老婆！ 我愿意为你付出一切！', '2025-01-15 19:16:49', '2025-01-15 19:16:49');
INSERT INTO `changelog` VALUES (9, 'aitecher', '0.0.9', '爱老婆！ 你是我的唯一！', '2025-01-15 19:17:49', '2025-01-15 19:17:49');
INSERT INTO `changelog` VALUES (10, 'aitecher', '0.0.10', '爱老婆！ 你是我一生的骄傲！', '2025-01-15 19:18:49', '2025-01-15 19:18:49');
INSERT INTO `changelog` VALUES (11, 'aitecher', '0.0.11', '爱老婆！ 有你在，我无所畏惧！', '2025-01-15 19:19:49', '2025-01-15 19:19:49');
INSERT INTO `changelog` VALUES (12, 'aitecher', '0.0.12', '爱老婆！ 你让我相信永恒的爱情！', '2025-01-15 19:20:49', '2025-01-15 19:20:49');
INSERT INTO `changelog` VALUES (13, 'aitecher', '0.0.13', '爱老婆！ 你的存在是我最大的幸福！', '2025-01-15 19:21:49', '2025-01-15 19:21:49');
INSERT INTO `changelog` VALUES (14, 'aitecher', '0.0.14', '爱老婆！ 我会永远守护你！', '2025-01-15 19:22:49', '2025-01-15 19:22:49');
INSERT INTO `changelog` VALUES (15, 'aitecher', '0.0.15', '爱老婆！ 你是我灵魂的港湾！', '2025-01-15 19:23:49', '2025-01-15 19:23:49');
INSERT INTO `changelog` VALUES (16, 'aitecher', '0.0.16', '爱老婆！ 你是我的命中注定！', '2025-01-15 19:24:49', '2025-01-15 19:24:49');
INSERT INTO `changelog` VALUES (17, 'aitecher', '0.0.17', '爱老婆！ 超喜欢和你抱抱！', '2025-01-15 19:25:49', '2025-01-15 19:25:49');
INSERT INTO `changelog` VALUES (18, 'aitecher', '0.0.18', '爱老婆！ 我愿意为你付出一切~！', '2025-01-15 19:26:49', '2025-01-15 19:26:49');
INSERT INTO `changelog` VALUES (19, 'aitecher', '0.0.19', '爱老婆！ 你是我的全部！', '2025-01-15 19:27:49', '2025-01-15 19:27:49');
INSERT INTO `changelog` VALUES (20, 'aitecher', '0.0.20', '爱老婆！ 我们的爱就像秋天落叶等不到花开~欸？这首歌啥意思？不管了~我爱你！', '2025-01-15 19:28:49', '2025-01-15 19:28:49');
INSERT INTO `changelog` VALUES (21, 'aitecher', '0.0.21', '更新了首页，登录页，注册页的样式，充分发挥了nuxtui的优势，并带上轮播图提升美观（不太能商用的感觉，好不严肃），新增邮箱接口阈值保护，新增有权无权两种静态资源接口。以及~感谢脑婆大人赞助的GPT~代码水平提升了也是啊~。以及最最最最最重要的一点！！！今天又是爱老婆的一天！！！！！！！！超级超级喜欢~超级超级爱老婆！芜湖！坠喜欢主人啦！', '2025-01-17 00:22:51', '2025-01-17 00:22:51');
INSERT INTO `changelog` VALUES (22, 'aitecher', '0.0.22', '更新了普通用户的界面，更新了统一框架模板，更新了统一动画效果ui。这都不是重点！重点是今天的主人好可爱呀~想玩游戏呗一缕阳光快要气哭了馁~鼻塞的鼻音声音嗲嗲的好好听嫩~！爱死主人啦~~嘿嘿~主人肿么辣么可爱吖~！爱你！', '2025-01-18 00:43:45', '2025-01-18 00:43:45');
INSERT INTO `changelog` VALUES (23, 'aitecher', '0.0.23', '更新了管理员界面的全局模糊搜索，显示吃接口数据，完善了部分接口文档，部分中文优化。以及非常非常爱老婆！带她去玩带她去买金~一起看哪吒2~芜湖~', '2025-02-22 18:42:32', '2025-02-22 18:42:32');
INSERT INTO `changelog` VALUES (24, 'aitecher', '0.0.24', '更新了上传接口，前端头像可以选择链接输入或者头像上传，上传的头像会自动改为webp格式，方便存储，使用md5检测，相同的文件不会二次不会二次上传，减小服务器压力。今天跟老婆去吃汤泡饭，wok梦中情店，无限加汤加饭，还吃了个瓜嘻嘻。去逛逛万达~对啦！吃饭那家店铺！附近的好几条街！全都是韩国菜！all in！就连商店都是卖的韩国货，一堆看不懂的鸟语~晕~。超喜欢咪咪哒！哈哈哈哈！！', '2025-02-24 01:26:15', '2025-02-24 01:26:15');

-- ----------------------------
-- Table structure for course_schedule
-- ----------------------------
DROP TABLE IF EXISTS `course_schedule`;
CREATE TABLE `course_schedule`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `schedule_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `schedule_data` json NULL,
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '1: 当前使用；0: 历史记录',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_course_schedule_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of course_schedule
-- ----------------------------
INSERT INTO `course_schedule` VALUES (25, 10001, '我的课程表', '{\"days\": [\"星期一\", \"星期二\", \"星期三\", \"星期四\", \"星期五\", \"星期六\", \"星期日\"], \"courses\": {\"星期一\": [{\"name\": \"1111\", \"color\": \"#FFA07A\", \"weekType\": \"全部\", \"classroom\": \"1111\", \"timeRange\": \"1111\", \"weekRange\": \"1111\"}, null, null, null, null, null, null, null, null, null, null, null, null], \"星期三\": [null, {\"name\": \"蔡姐姐好厉害\", \"color\": \"#ADD8E6\", \"weekType\": \"全部\", \"classroom\": \"515\", \"timeRange\": \"08:00-14:00\", \"weekRange\": \"1-16\"}, null, null, null, null, null, null, null, null, null, null, null], \"星期二\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期五\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期六\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期四\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期日\": [null, null, null, null, null, null, null, null, null, null, null, null, null]}, \"startDate\": \"2121\", \"timeSlots\": [{\"label\": \"第1节\", \"timePeriod\": \"\"}, {\"label\": \"第2节\", \"timePeriod\": \"08:00-09:00\"}, {\"label\": \"第3节\", \"timePeriod\": \"13:00-14:00\"}, {\"label\": \"第4节\", \"timePeriod\": \"\"}, {\"label\": \"第5节\", \"timePeriod\": \"\"}, {\"label\": \"第6节\", \"timePeriod\": \"\"}, {\"label\": \"第7节\", \"timePeriod\": \"\"}, {\"label\": \"第8节\", \"timePeriod\": \"\"}, {\"label\": \"第9节\", \"timePeriod\": \"\"}, {\"label\": \"第10节\", \"timePeriod\": \"\"}, {\"label\": \"第11节\", \"timePeriod\": \"\"}, {\"label\": \"第12节\", \"timePeriod\": \"\"}, {\"label\": \"14\", \"timePeriod\": \"19:00-14:00\"}], \"totalWeeks\": 1212, \"schedule_name\": \"我的课程表\"}', 1, '2025-03-10 04:00:10', '2025-03-10 13:04:02');
INSERT INTO `course_schedule` VALUES (26, 10001, 'nid课程表', '{\"days\": [\"星期一\", \"星期二\", \"星期三\", \"星期四\", \"星期五\", \"星期六\", \"星期日\"], \"courses\": {\"星期一\": [{\"name\": \"212\", \"color\": \"#FFA07A\", \"weekType\": \"全部\", \"classroom\": \"122\", \"timeRange\": \"08:00-10:00\", \"weekRange\": \"1-20\"}, null, null, null, null, null, null, null, null, null, null, null, null], \"星期三\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期二\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期五\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期六\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期四\": [null, null, null, null, null, null, null, null, null, null, null, null, null], \"星期日\": [null, null, null, null, null, null, null, null, null, null, null, null, null]}, \"startDate\": \"12121\", \"timeSlots\": [{\"label\": \"第1节\", \"timePeriod\": \"08:00-09:00\"}, {\"label\": \"第2节\", \"timePeriod\": \"09:00-10:00\"}, {\"label\": \"第3节\", \"timePeriod\": \"\"}, {\"label\": \"第4节\", \"timePeriod\": \"\"}, {\"label\": \"第5节\", \"timePeriod\": \"\"}, {\"label\": \"第6节\", \"timePeriod\": \"\"}, {\"label\": \"第7节\", \"timePeriod\": \"\"}, {\"label\": \"第8节\", \"timePeriod\": \"\"}, {\"label\": \"第9节\", \"timePeriod\": \"\"}, {\"label\": \"第10节\", \"timePeriod\": \"\"}, {\"label\": \"第11节\", \"timePeriod\": \"\"}, {\"label\": \"第12节\", \"timePeriod\": \"\"}, {\"label\": \"第13节\", \"timePeriod\": \"\"}], \"totalWeeks\": 1212, \"schedule_name\": \"我的课程表\"}', 0, '2025-03-10 04:00:14', '2025-03-10 13:04:02');

-- ----------------------------
-- Table structure for loginverification
-- ----------------------------
DROP TABLE IF EXISTS `loginverification`;
CREATE TABLE `loginverification`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `phoneNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `role` enum('1','2','3','4') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '1',
  `uid` int NULL DEFAULT NULL,
  `openid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_login_user`(`uid` ASC) USING BTREE,
  CONSTRAINT `fk_login_user` FOREIGN KEY (`uid`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of loginverification
-- ----------------------------
INSERT INTO `loginverification` VALUES (1, '蔡少爷', '1181584752@qq.com', '$2a$10$aD2IWthU6J3MBycqEgEIweEyWEc7BpzbfyPSu8ejlwThEZS/w8jlW', NULL, '2', 10001, NULL);
INSERT INTO `loginverification` VALUES (2, '蔡小姐', 'mo1181584752@163.com', '$2a$10$O91rmWrQ7PbTu/0099wc/er8e6TqXSbTeHlmD.PQo0kqvcGcYCfeG', NULL, '1', 10002, NULL);
INSERT INTO `loginverification` VALUES (3, '蔡爷爷', '996886831@qq.com', '$2a$10$Xg52yow1CK8XcUGfNzZIPeo2lBkgoggyiDcg9N4VuQkK1EjejMorO', NULL, '3', 10003, NULL);
INSERT INTO `loginverification` VALUES (4, '蔡奶奶', '123456789@qq.com', '$2a$10$GBigwkOzDDqLjuHK4EygaOsovymWr8QA7TPMIfnIsXhAm1.Wvz4Ci', '13326988953', '3', 10004, NULL);
INSERT INTO `loginverification` VALUES (5, '蔡姐姐', '12345678@qq.com', '$2a$10$u9udTkk2eOtrZ1OwS5.ChuMsYkHjtIIFxnuhy0TplxK9GKuKtR2HC', '13326988952', '3', 10005, NULL);
INSERT INTO `loginverification` VALUES (20, '莫少爷', NULL, NULL, NULL, '2', 10019, 'obD1W7LfjBqwPj5uGj43yU8TT3ZY');
INSERT INTO `loginverification` VALUES (21, '蔡爸爸', '23123123@qq.com', '$2a$10$jgdCzGCrclocFrquPl3tkuVVCEEUrrxr7/mwPCqj1gmCHTrJp1Sjq', '1323465565', '1', 10020, '未绑定');
INSERT INTO `loginverification` VALUES (22, '蔡妹妹', '45646545645@qq.com', '$2a$10$wiMrt.OLqfUGVlrGBKq8/.Tny4qF5G4u1hhaOWW/lsZxuX6ysNCDa', '', '2', 10021, '未绑定');

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `receiver_id` int NOT NULL COMMENT '接收者(用户)ID，对应 user 表的主键',
  `sender_id` int NOT NULL COMMENT '发送者(用户)ID, 若系统发送，可设置为0或Null',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '消息标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '消息内容',
  `level` tinyint NULL DEFAULT 1 COMMENT '消息优先级/等级(1=普通,2=重要,3=紧急等)',
  `status` tinyint NULL DEFAULT 0 COMMENT '阅读状态(0=未读,1=已读,2=已删除等)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------
INSERT INTO `notifications` VALUES (1, 10002, 3, '管理员消息', '你好', 1, 1, '2025-03-07 11:24:00', '2025-03-07 11:39:21');
INSERT INTO `notifications` VALUES (2, 10002, 3, '管理员消息', '请签收', 2, 2, '2025-03-07 11:25:45', '2025-03-07 11:34:41');
INSERT INTO `notifications` VALUES (3, 10003, 4, '超级管理员消息', '请签收', 3, 1, '2025-03-07 16:22:57', '2025-03-07 16:36:36');
INSERT INTO `notifications` VALUES (4, 10003, 4, '超级管理员消息', '能不能老实一点', 3, 2, '2025-03-07 16:23:47', '2025-03-07 16:36:44');
INSERT INTO `notifications` VALUES (5, 10003, 3, '超级管理员消息', '能不能老实一点', 3, 1, '2025-03-07 22:33:26', '2025-03-10 02:12:13');
INSERT INTO `notifications` VALUES (6, 10001, 3, '超级管理员消息', '能不能老实一点', 3, 0, '2025-03-07 22:35:39', '2025-03-07 22:35:39');

-- ----------------------------
-- Table structure for school
-- ----------------------------
DROP TABLE IF EXISTS `school`;
CREATE TABLE `school`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `schoolName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `province` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `city` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `district` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of school
-- ----------------------------
INSERT INTO `school` VALUES (1, '广州商学院', '广东', '广州', '黄埔');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `wechatId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `openid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `phoneNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `idCard` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `schoolId` int NULL DEFAULT 0,
  `createTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updateTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastLoginTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10022 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (10001, '蔡少爷', '$2a$10$aD2IWthU6J3MBycqEgEIweEyWEc7BpzbfyPSu8ejlwThEZS/w8jlW', NULL, '', NULL, '1181584752@qq.com', NULL, '/static/imgs/avatar/489a8758516517954711943686969474.webp', 1, '2025-02-24 19:16:02', '2025-03-10 01:48:55', '2025-02-24 19:16:02');
INSERT INTO `user` VALUES (10002, '蔡小姐', '$2a$10$O91rmWrQ7PbTu/0099wc/er8e6TqXSbTeHlmD.PQo0kqvcGcYCfeG', NULL, '', NULL, 'mo1181584752@163.com', NULL, '/static/imgs/avatar/215ab044c2605f7c44abe9447d75dba0.webp', 0, '2025-02-24 19:32:41', '2025-03-07 22:22:00', '2025-02-24 19:32:41');
INSERT INTO `user` VALUES (10003, '蔡爷爷', '$2a$10$Xg52yow1CK8XcUGfNzZIPeo2lBkgoggyiDcg9N4VuQkK1EjejMorO', NULL, '', NULL, '996886831@qq.com', NULL, '/static/imgs/avatar/215ab044c2605f7c44abe9447d75dba0.webp', 1, '2025-02-24 19:39:42', '2025-03-06 22:35:19', '2025-02-24 19:39:42');
INSERT INTO `user` VALUES (10004, '蔡奶奶', '$2a$10$GBigwkOzDDqLjuHK4EygaOsovymWr8QA7TPMIfnIsXhAm1.Wvz4Ci', '', '', '13326988953', '123456789@qq.com', '', '/static/imgs/avatar/215ab044c2605f7c44abe9447d75dba0.webp', 3, '2025-02-24 19:53:36', '2025-03-05 21:26:52', '2025-02-24 19:53:36');
INSERT INTO `user` VALUES (10005, '蔡姐姐', '$2a$10$u9udTkk2eOtrZ1OwS5.ChuMsYkHjtIIFxnuhy0TplxK9GKuKtR2HC', '', '', '13326988952', '12345678@qq.com', '', '/static/imgs/avatar/77439c992433149bc74289483db7d141.webp', 1, '2025-02-24 19:57:32', '2025-03-07 22:24:53', '2025-02-24 19:57:32');
INSERT INTO `user` VALUES (10019, '莫少爷', NULL, 'wechat123', 'obD1W7LfjBqwPj5uGj43yU8TT3ZY', '13800138000', 'test@example.com', NULL, '/static/imgs/avatar/f4fea0780af88e3aea06dc7a3648e8df.webp', 1, '2025-03-05 22:10:48', '2025-03-06 22:38:55', '2025-03-05 22:10:48');
INSERT INTO `user` VALUES (10020, '蔡爸爸', '$2a$10$jgdCzGCrclocFrquPl3tkuVVCEEUrrxr7/mwPCqj1gmCHTrJp1Sjq', '', '未绑定', '1323465565', '23123123@qq.com', '', '/static/imgs/avatar/9f62e9d26f0cb061ad13b4d44b495cff.webp', 1, '2025-03-07 01:11:07', '2025-03-07 01:15:36', '2025-03-07 01:11:07');
INSERT INTO `user` VALUES (10021, '蔡妹妹', '$2a$10$wiMrt.OLqfUGVlrGBKq8/.Tny4qF5G4u1hhaOWW/lsZxuX6ysNCDa', '', '未绑定', '', '45646545645@qq.com', '', '/static/imgs/avatar/e7a191e187b9a67ee1f3c8356a1e7034.webp', 1, '2025-03-07 01:23:47', '2025-03-07 01:23:47', '2025-03-07 01:23:47');

-- ----------------------------
-- Table structure for user_avatars
-- ----------------------------
DROP TABLE IF EXISTS `user_avatars`;
CREATE TABLE `user_avatars`  (
  `avatar_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '上传用户ID',
  `md5_hash` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件MD5校验值',
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '存储文件名',
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '原始文件名',
  `mime_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件类型',
  `size` int NOT NULL COMMENT '文件大小(字节)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`avatar_id`) USING BTREE,
  INDEX `idx_md5`(`md5_hash` ASC) USING BTREE,
  INDEX `idx_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `user_avatars_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `loginverification` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 36 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user_avatars
-- ----------------------------
INSERT INTO `user_avatars` VALUES (1, 3, '215ab044c2605f7c44abe9447d75dba0', '215ab044c2605f7c44abe9447d75dba0.webp', 'Bing_0018.jpeg', 'image/webp', 51210, '2025-02-24 20:15:04');
INSERT INTO `user_avatars` VALUES (2, 3, '77439c992433149bc74289483db7d141', '77439c992433149bc74289483db7d141.webp', 'Bing_0017.jpeg', 'image/webp', 18104, '2025-02-24 20:15:34');
INSERT INTO `user_avatars` VALUES (3, 3, '9ca7adbe38d282054ac02e7933e03353', '9ca7adbe38d282054ac02e7933e03353.webp', 'Bing_0019.jpeg', 'image/webp', 35703, '2025-02-24 20:16:06');
INSERT INTO `user_avatars` VALUES (27, 20, 'b61b4c5d0ca9363ea5135f91f136b811', 'b61b4c5d0ca9363ea5135f91f136b811.webp', 'WeNvXGG89vJ9b61b4c5d0ca9363ea5135f91f136b811.jpeg', 'image/webp', 2630, '2025-03-05 22:10:56');
INSERT INTO `user_avatars` VALUES (28, 3, '723077dbe3b8dc4b0ea45ae4aa603860', '723077dbe3b8dc4b0ea45ae4aa603860.webp', 'Bing_0004.jpeg', 'image/webp', 24045, '2025-03-06 22:42:40');
INSERT INTO `user_avatars` VALUES (29, 3, 'f4fea0780af88e3aea06dc7a3648e8df', 'f4fea0780af88e3aea06dc7a3648e8df.webp', 'Bing_0012.jpeg', 'image/webp', 28969, '2025-03-06 22:44:22');
INSERT INTO `user_avatars` VALUES (30, 3, '04149741f1efd2e21ef530b3be6e67b9', '04149741f1efd2e21ef530b3be6e67b9.webp', 'Bing_0025.jpeg', 'image/webp', 30508, '2025-03-06 22:45:19');
INSERT INTO `user_avatars` VALUES (31, 3, 'fe488df3ec8c52fd4195c75a5b043f14', 'fe488df3ec8c52fd4195c75a5b043f14.webp', 'Bing_0024.jpeg', 'image/webp', 25264, '2025-03-06 22:45:32');
INSERT INTO `user_avatars` VALUES (32, 3, '6825bf031f45b541a19c305eb5c898a1', '6825bf031f45b541a19c305eb5c898a1.webp', 'Bing_0008.jpeg', 'image/webp', 13078, '2025-03-06 22:46:11');
INSERT INTO `user_avatars` VALUES (33, 3, '9f62e9d26f0cb061ad13b4d44b495cff', '9f62e9d26f0cb061ad13b4d44b495cff.webp', 'Bing_0022.jpeg', 'image/webp', 30236, '2025-03-07 00:59:02');
INSERT INTO `user_avatars` VALUES (34, 3, 'e7a191e187b9a67ee1f3c8356a1e7034', 'e7a191e187b9a67ee1f3c8356a1e7034.webp', 'Bing_0028.jpeg', 'image/webp', 8022, '2025-03-07 01:23:45');
INSERT INTO `user_avatars` VALUES (35, 3, '489a8758516517954711943686969474', '489a8758516517954711943686969474.webp', 'Bing_0084.jpeg', 'image/webp', 110999, '2025-03-10 01:48:53');

SET FOREIGN_KEY_CHECKS = 1;

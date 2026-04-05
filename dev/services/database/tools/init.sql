/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: localhost    Database: workfrom
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ASSIGNED_TASK`
--

DROP TABLE IF EXISTS `ASSIGNED_TASK`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ASSIGNED_TASK` (
  `assigned_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Task Assigned ID',
  `task_id` int(11) NOT NULL COMMENT 'Task ID',
  `user_id` int(11) NOT NULL COMMENT 'User ID',
  `task_progress_status` enum('not_started','pending','completed') NOT NULL DEFAULT 'not_started' COMMENT 'Task Progress Status',
  `task_priority` enum('high','medium','low') NOT NULL DEFAULT 'high' COMMENT 'Task Priority',
  `completed_date` datetime NOT NULL COMMENT 'Completed Date',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`assigned_id`),
  KEY `task_id` (`task_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ASSIGNED_TASK_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `TASK` (`task_id`),
  CONSTRAINT `ASSIGNED_TASK_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CREATED_TASK`
--

DROP TABLE IF EXISTS `CREATED_TASK`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CREATED_TASK` (
  `created_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Task Created ID',
  `user_id` int(11) NOT NULL COMMENT 'User ID',
  `task_id` int(11) NOT NULL COMMENT 'Task ID',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date ',
  PRIMARY KEY (`created_id`),
  KEY `user_id` (`user_id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `CREATED_TASK_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `CREATED_TASK_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `TASK` (`task_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DEPARTMENT`
--

DROP TABLE IF EXISTS `DEPARTMENT`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `DEPARTMENT` (
  `dp_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Department ID',
  `dp_name` varchar(255) NOT NULL COMMENT 'Department Name',
  `dp_lead` int(11) DEFAULT NULL COMMENT 'Department Leader',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`dp_id`),
  UNIQUE KEY `dp_name` (`dp_name`),
  KEY `dp_lead` (`dp_lead`),
  CONSTRAINT `DEPARTMENT_ibfk_1` FOREIGN KEY (`dp_lead`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `chk_dp_name_not_empty` CHECK (`dp_name` <> '')
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MEETING`
--

DROP TABLE IF EXISTS `MEETING`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `MEETING` (
  `meet_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Meeting ID',
  `meet_title` varchar(255) NOT NULL COMMENT 'Meeting Title',
  `meet_desc` varchar(255) NOT NULL COMMENT 'Meeting Description',
  `meet_start_time` datetime NOT NULL COMMENT 'Meeting Start Time',
  `meet_end_time` datetime NOT NULL COMMENT 'Meeting End Time',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`meet_id`),
  CONSTRAINT `chk_meet_desc_not_empty` CHECK (`meet_desc` <> ''),
  CONSTRAINT `chk_meet_title_not_empty` CHECK (`meet_title` <> '')
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MEETING_ORGANISER`
--

DROP TABLE IF EXISTS `MEETING_ORGANISER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `MEETING_ORGANISER` (
  `organiser_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Meeting Organiser ID',
  `meet_id` int(11) NOT NULL COMMENT 'Meeting ID',
  `user_id` int(11) NOT NULL COMMENT 'User ID',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`organiser_id`),
  KEY `meet_id` (`meet_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `MEETING_ORGANISER_ibfk_1` FOREIGN KEY (`meet_id`) REFERENCES `MEETING` (`meet_id`),
  CONSTRAINT `MEETING_ORGANISER_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MEETING_PARTICIPANT`
--

DROP TABLE IF EXISTS `MEETING_PARTICIPANT`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `MEETING_PARTICIPANT` (
  `participant_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Meeting Participant ID',
  `meet_id` int(11) NOT NULL COMMENT 'Meeting ID',
  `user_id` int(11) NOT NULL COMMENT 'User ID',
  `attendance_status` enum('absent','present') NOT NULL DEFAULT 'present' COMMENT 'Attendance Status',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`participant_id`),
  KEY `meet_id` (`meet_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `MEETING_PARTICIPANT_ibfk_1` FOREIGN KEY (`meet_id`) REFERENCES `MEETING` (`meet_id`),
  CONSTRAINT `MEETING_PARTICIPANT_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ROLE`
--

DROP TABLE IF EXISTS `ROLE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ROLE` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Role ID',
  `role_name` varchar(255) NOT NULL COMMENT 'Role Name',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`),
  CONSTRAINT `chk_role_name_not_empty` CHECK (`role_name` <> '')
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TASK`
--

DROP TABLE IF EXISTS `TASK`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `TASK` (
  `task_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Task ID',
  `task_title` varchar(255) NOT NULL COMMENT 'Task Title',
  `task_desc` varchar(255) NOT NULL COMMENT 'Task Description',
  `task_overall_status` enum('not_started','pending','completed') NOT NULL DEFAULT 'pending' COMMENT 'Task Overall Status',
  `assigned_date` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Task Assigned Date',
  `due_date` datetime NOT NULL COMMENT 'Task Due Date',
  `completed_date` datetime NOT NULL COMMENT 'Task Completed Date',
  `created_at` datetime NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`task_id`),
  CONSTRAINT `chk_task_title_not_empty` CHECK (`task_title` <> ''),
  CONSTRAINT `chk_task_desc_not_empty` CHECK (`task_desc` <> '')
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `USER`
--

DROP TABLE IF EXISTS `USER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `USER` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'User ID',
  `user_email` varchar(255) NOT NULL COMMENT 'User Email',
  `user_password` varchar(255) NOT NULL COMMENT 'User Password',
  `user_name` varchar(255) NOT NULL COMMENT 'User Name',
  `user_status` enum('inactive','active','do_not_disturb','in_meeting') NOT NULL DEFAULT 'inactive' COMMENT 'User Working Status',
  `role_id` int(11) NOT NULL COMMENT 'Role ID (FK)',
  `dp_id` int(11) NOT NULL COMMENT 'Department ID (FK)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Created Date',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_email` (`user_email`),
  KEY `dp_id` (`dp_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `USER_ibfk_2` FOREIGN KEY (`dp_id`) REFERENCES `DEPARTMENT` (`dp_id`),
  CONSTRAINT `USER_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `ROLE` (`role_id`),
  CONSTRAINT `chk_email_format` CHECK (`user_email` like '%@%'),
  CONSTRAINT `chk_user_password_not_empty` CHECK (`user_password` <> ''),
  CONSTRAINT `chk_user_name_not_empty` CHECK (`user_name` <> '')
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-05  7:26:52

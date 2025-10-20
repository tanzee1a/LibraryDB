CREATE DATABASE  IF NOT EXISTS `group5libraryDb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `group5libraryDb`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: group5librarydb.c3y682cskaij.us-east-2.rds.amazonaws.com    Database: group5libraryDb
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `BOOK`
--

DROP TABLE IF EXISTS `BOOK`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BOOK` (
  `item_id` char(13) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `publisher` varchar(255) DEFAULT NULL,
  `published_year` year DEFAULT NULL,
  `shelf_location` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `BOOK_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `ITEM` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BOOK`
--

LOCK TABLES `BOOK` WRITE;
/*!40000 ALTER TABLE `BOOK` DISABLE KEYS */;
/*!40000 ALTER TABLE `BOOK` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `BOOK_AUTHOR`
--

DROP TABLE IF EXISTS `BOOK_AUTHOR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BOOK_AUTHOR` (
  `item_id` char(13) NOT NULL,
  `author_name` varchar(255) NOT NULL,
  PRIMARY KEY (`item_id`,`author_name`),
  CONSTRAINT `BOOK_AUTHOR_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `BOOK` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BOOK_AUTHOR`
--

LOCK TABLES `BOOK_AUTHOR` WRITE;
/*!40000 ALTER TABLE `BOOK_AUTHOR` DISABLE KEYS */;
/*!40000 ALTER TABLE `BOOK_AUTHOR` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `BOOK_GENRE`
--

DROP TABLE IF EXISTS `BOOK_GENRE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BOOK_GENRE` (
  `item_id` char(13) NOT NULL,
  `genre_name` varchar(100) NOT NULL,
  PRIMARY KEY (`item_id`,`genre_name`),
  CONSTRAINT `BOOK_GENRE_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `BOOK` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BOOK_GENRE`
--

LOCK TABLES `BOOK_GENRE` WRITE;
/*!40000 ALTER TABLE `BOOK_GENRE` DISABLE KEYS */;
/*!40000 ALTER TABLE `BOOK_GENRE` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `BOOK_TAG`
--

DROP TABLE IF EXISTS `BOOK_TAG`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BOOK_TAG` (
  `item_id` char(13) NOT NULL,
  `tag_name` varchar(100) NOT NULL,
  PRIMARY KEY (`item_id`,`tag_name`),
  CONSTRAINT `BOOK_TAG_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `BOOK` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BOOK_TAG`
--

LOCK TABLES `BOOK_TAG` WRITE;
/*!40000 ALTER TABLE `BOOK_TAG` DISABLE KEYS */;
/*!40000 ALTER TABLE `BOOK_TAG` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `BORROW`
--

DROP TABLE IF EXISTS `BORROW`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BORROW` (
  `borrow_id` int NOT NULL AUTO_INCREMENT,
  `borrow_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `user_id` varchar(13) NOT NULL,
  `item_id` char(13) NOT NULL,
  PRIMARY KEY (`borrow_id`),
  KEY `user_id` (`user_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `BORROW_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `BORROW_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `ITEM` (`item_id`),
  CONSTRAINT `chk_return_date` CHECK ((`return_date` >= `borrow_date`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BORROW`
--

LOCK TABLES `BORROW` WRITE;
/*!40000 ALTER TABLE `BORROW` DISABLE KEYS */;
/*!40000 ALTER TABLE `BORROW` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DEVICE`
--

DROP TABLE IF EXISTS `DEVICE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DEVICE` (
  `item_id` char(13) NOT NULL,
  `serial_number` varchar(50) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `description` text,
  `type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  CONSTRAINT `DEVICE_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `ITEM` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DEVICE`
--

LOCK TABLES `DEVICE` WRITE;
/*!40000 ALTER TABLE `DEVICE` DISABLE KEYS */;
/*!40000 ALTER TABLE `DEVICE` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FINE`
--

DROP TABLE IF EXISTS `FINE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FINE` (
  `borrow_id` varchar(15) NOT NULL,
  `user_id` varchar(10) NOT NULL,
  `date_issued` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date_paid` date NOT NULL,
  `is_paid_off` tinyint DEFAULT '0',
  PRIMARY KEY (`borrow_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `FINE_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FINE`
--

LOCK TABLES `FINE` WRITE;
/*!40000 ALTER TABLE `FINE` DISABLE KEYS */;
/*!40000 ALTER TABLE `FINE` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ITEM`
--

DROP TABLE IF EXISTS `ITEM`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ITEM` (
  `item_id` char(13) NOT NULL,
  `available` int NOT NULL DEFAULT '0',
  `on_hold` int NOT NULL DEFAULT '0',
  `loaned_out` int NOT NULL DEFAULT '0',
  `quantity` int GENERATED ALWAYS AS (((`available` + `on_hold`) + `loaned_out`)) STORED,
  `thumbnail` blob,
  `earliest_available_date` date DEFAULT NULL,
  `category` enum('BOOK','MOVIE','DEVICE') DEFAULT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ITEM`
--

LOCK TABLES `ITEM` WRITE;
/*!40000 ALTER TABLE `ITEM` DISABLE KEYS */;
/*!40000 ALTER TABLE `ITEM` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MOVIE`
--

DROP TABLE IF EXISTS `MOVIE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MOVIE` (
  `item_id` char(13) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `MOVIE_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `ITEM` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MOVIE`
--

LOCK TABLES `MOVIE` WRITE;
/*!40000 ALTER TABLE `MOVIE` DISABLE KEYS */;
/*!40000 ALTER TABLE `MOVIE` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MOVIE_DIRECTOR`
--

DROP TABLE IF EXISTS `MOVIE_DIRECTOR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MOVIE_DIRECTOR` (
  `item_id` char(13) NOT NULL,
  `director_name` varchar(100) NOT NULL,
  PRIMARY KEY (`item_id`,`director_name`),
  CONSTRAINT `MOVIE_DIRECTOR_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `MOVIE` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MOVIE_DIRECTOR`
--

LOCK TABLES `MOVIE_DIRECTOR` WRITE;
/*!40000 ALTER TABLE `MOVIE_DIRECTOR` DISABLE KEYS */;
/*!40000 ALTER TABLE `MOVIE_DIRECTOR` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MOVIE_GENRE`
--

DROP TABLE IF EXISTS `MOVIE_GENRE`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MOVIE_GENRE` (
  `item_id` char(13) NOT NULL,
  `genre` varchar(50) NOT NULL,
  PRIMARY KEY (`item_id`,`genre`),
  CONSTRAINT `MOVIE_GENRE_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `MOVIE` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MOVIE_GENRE`
--

LOCK TABLES `MOVIE_GENRE` WRITE;
/*!40000 ALTER TABLE `MOVIE_GENRE` DISABLE KEYS */;
/*!40000 ALTER TABLE `MOVIE_GENRE` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MOVIE_TAG`
--

DROP TABLE IF EXISTS `MOVIE_TAG`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MOVIE_TAG` (
  `item_id` char(13) NOT NULL,
  `tag` varchar(50) NOT NULL,
  PRIMARY KEY (`item_id`,`tag`),
  CONSTRAINT `MOVIE_TAG_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `MOVIE` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MOVIE_TAG`
--

LOCK TABLES `MOVIE_TAG` WRITE;
/*!40000 ALTER TABLE `MOVIE_TAG` DISABLE KEYS */;
/*!40000 ALTER TABLE `MOVIE_TAG` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `REPORT`
--

DROP TABLE IF EXISTS `REPORT`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `REPORT` (
  `idReport` int NOT NULL,
  `ReportDate` date NOT NULL,
  `StaffID` int NOT NULL,
  PRIMARY KEY (`idReport`),
  KEY `StaffID` (`StaffID`),
  CONSTRAINT `StaffID` FOREIGN KEY (`StaffID`) REFERENCES `STAFF` (`StaffID`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `REPORT`
--

LOCK TABLES `REPORT` WRITE;
/*!40000 ALTER TABLE `REPORT` DISABLE KEYS */;
/*!40000 ALTER TABLE `REPORT` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `STAFF`
--

DROP TABLE IF EXISTS `STAFF`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `STAFF` (
  `StaffID` int NOT NULL AUTO_INCREMENT,
  `NameStaff` varchar(45) NOT NULL,
  `LastNameStaff` varchar(45) NOT NULL,
  `PasswordStaff` varchar(20) NOT NULL,
  PRIMARY KEY (`StaffID`),
  UNIQUE KEY `staffID_UNIQUE` (`StaffID`) /*!80000 INVISIBLE */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `STAFF`
--

LOCK TABLES `STAFF` WRITE;
/*!40000 ALTER TABLE `STAFF` DISABLE KEYS */;
/*!40000 ALTER TABLE `STAFF` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `USER`
--

DROP TABLE IF EXISTS `USER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `USER` (
  `user_id` varchar(13) NOT NULL,
  `role` varchar(20) NOT NULL,
  `password` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `firstName` varchar(50) DEFAULT NULL,
  `lastName` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USER`
--

LOCK TABLES `USER` WRITE;
/*!40000 ALTER TABLE `USER` DISABLE KEYS */;
/*!40000 ALTER TABLE `USER` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WAITLIST`
--

DROP TABLE IF EXISTS `WAITLIST`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WAITLIST` (
  `waitlist_id` int NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL,
  `user_id` varchar(13) NOT NULL,
  `item_id` char(13) NOT NULL,
  PRIMARY KEY (`waitlist_id`),
  UNIQUE KEY `user_id` (`user_id`,`item_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `WAITLIST_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`),
  CONSTRAINT `WAITLIST_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `ITEM` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WAITLIST`
--

LOCK TABLES `WAITLIST` WRITE;
/*!40000 ALTER TABLE `WAITLIST` DISABLE KEYS */;
/*!40000 ALTER TABLE `WAITLIST` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-07 20:46:23

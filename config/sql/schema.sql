CREATE DATABASE  IF NOT EXISTS `fw` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `fw`;
-- phpMyAdmin SQL Dump
-- version 4.6.5.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 17, 2017 at 05:03 PM
-- Server version: 10.1.21-MariaDB
-- PHP Version: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fw`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `username` varchar(20) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `question` varchar(100) DEFAULT NULL,
  `answer` varchar(20) DEFAULT NULL,
  `verified_ind` tinyint(1) DEFAULT NULL,
  `attempts` int(11) NOT NULL DEFAULT '3'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `users`
--
LOCK TABLES `users` WRITE;

INSERT INTO `users` (`id`, `name`, `username`, `password`, `email`, `question`, `answer`, `verified_ind`, `attempts`) VALUES
(31, 'J Jeris Alan', '001980351', '$2a$10$gPuugy7Mm9cJmIIvPOTrp..PBMIArma2j3EIbpCfNoNUTyRdSi/gu', 'alan.jeris@gmail.com', 'What is the name of your first pet?', 'Jerry', 1, 3),
(32, 'Sushant Gupta', 'sushant1206', '$2a$10$FQSmVxgy7.SR2yco70rc7eIqjCAB36D2MqabkI/nAiO5UVFnzzRMK', 'sagupta@ncsu.edu', 'In which year were you born?', '1993', 1, 3);
UNLOCK TABLES;

-- --------------------------------------------------------

--
-- Table structure for table `user_verification`
--
DROP TABLE IF EXISTS `user_verification`;

CREATE TABLE `user_verification` (
  `username` varchar(30) NOT NULL,
  `token` varchar(150) DEFAULT NULL,
  `created_dttm` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user_verification`
--
LOCK TABLES `user_verification` WRITE;

INSERT INTO `user_verification` (`username`, `token`, `created_dttm`) VALUES
('001980351', '$2a$10$0GtPfasKEDuBY/SqIlm5...Hk2nFR1HWFQxa1xyTVp81X7F3k4pCS', '2017-07-02 01:27:32'),
('sushant1206', '$2a$10$PxGwrad5rvm5rEP1mhKW/.8nlr3AbVdcPD5gOgKcPJRiJ/IxqrxBi', '2017-07-17 01:38:18');
UNLOCK TABLES;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_verification`
--
ALTER TABLE `user_verification`
  ADD KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `user_verification`
--
ALTER TABLE `user_verification`
  ADD CONSTRAINT `user_verification_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

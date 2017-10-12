-- MySQL dump 10.13  Distrib 5.7.17, for Win64 (x86_64)
--
-- Host: localhost    Database: fw
-- ------------------------------------------------------
-- Server version	5.7.18-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `conseq_policies`
--

DROP TABLE IF EXISTS `conseq_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conseq_policies` (
  `cid` int(11) DEFAULT NULL,
  `pid` int(11) DEFAULT NULL,
  `policyid` varchar(10) DEFAULT NULL,
  KEY `cid` (`cid`),
  KEY `pid` (`pid`),
  KEY `policyid` (`policyid`),
  CONSTRAINT `conseq_policies_ibfk_1` FOREIGN KEY (`cid`) REFERENCES `consequences` (`cid`),
  CONSTRAINT `conseq_policies_ibfk_2` FOREIGN KEY (`pid`) REFERENCES `projects` (`pid`),
  CONSTRAINT `conseq_policies_ibfk_3` FOREIGN KEY (`policyid`) REFERENCES `policies` (`policyid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conseq_policies`
--


--
-- Table structure for table `consequences`
--

DROP TABLE IF EXISTS `consequences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consequences` (
  `cid` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `cnodeid` int(11) DEFAULT NULL,
  `cparentnodeid` int(11) DEFAULT NULL,
  `likelihood` int(11) DEFAULT NULL,
  `impact` varchar(10) DEFAULT NULL,
  `importance` varchar(8) DEFAULT NULL,
  `notes` varchar(250) DEFAULT NULL,
  `pid` int(11) DEFAULT NULL,
  PRIMARY KEY (`cid`),
  KEY `pid` (`pid`),
  CONSTRAINT `consequences_ibfk_1` FOREIGN KEY (`pid`) REFERENCES `projects` (`pid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consequences`
--



--
-- Table structure for table `policies`
--

DROP TABLE IF EXISTS `policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `policies` (
  `policyid` varchar(10) NOT NULL,
  `policy_name` varchar(50) DEFAULT NULL,
  `policy_category` varchar(30) NOT NULL,
  `policy_desc` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`policyid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policies`
--

LOCK TABLES `policies` WRITE;
/*!40000 ALTER TABLE `policies` DISABLE KEYS */;
INSERT INTO `policies` VALUES ('1.1','Greenhouse Gas Reduction','Environmental Protection','Promote best practices for reducing greenhouse gas emissions'),('1.2','Vehicle Electrification','Environmental Protection','Promote the electrification of transportation, both public and private.'),('1.3','Green Building','Environmental Protection','Advance green building practices in the public and private sectors by encouraging LEED Gold-level certification'),('2.1','Housing Preservation','Housing','Encourage the preservation of existing housing units whenever feasible, especially structures of historic or architectural significance.'),('2.2','Energy Efficiency','Housing','Ensure that all new publicly-supported housing construction and rehabilitation meet energy efficiency standards'),('2.3','Removing Housing Barriers','Housing','Address regulatory and policy barriers to affordable housing development'),('T 3.1','Transit Availability','Transportation','Expand public transit to serve housing in all parts of the City.'),('T 3.2','Integration of Travel Modes','Transportation','Promote and develop an integrated, multi-modal transportation system'),('T 3.3','Lane Additions','Transportation','Consider adding lanes to increase roadway capacity only after the roadway exceeds 20 percent of full capacity');
/*!40000 ALTER TABLE `policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `pname` varchar(50) NOT NULL,
  `powner` varchar(20) DEFAULT NULL,
  `created_dttm` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`pid`),
  KEY `powner` (`powner`),
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`powner`) REFERENCES `users` (`username`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--



--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `uid` varchar(30) NOT NULL,
  `token` varchar(200) DEFAULT NULL,
  `username` varchar(30) NOT NULL,
  `email` varchar(30) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--



--
-- Dumping events for database 'fw'
--

--
-- Dumping routines for database 'fw'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-10-12  0:15:09

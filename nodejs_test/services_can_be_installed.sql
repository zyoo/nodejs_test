-- MySQL dump 10.13  Distrib 5.1.69, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: cluster_manager
-- ------------------------------------------------------
-- Server version	5.1.69-0ubuntu0.11.10.1

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
-- Table structure for table `services_can_be_installed`
--

DROP TABLE IF EXISTS `services_can_be_installed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services_can_be_installed` (
  `service_id` int(3) NOT NULL AUTO_INCREMENT,
  `service_name` char(30) NOT NULL,
  `role_name` text,
  `default_config` text NOT NULL,
  PRIMARY KEY (`service_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services_can_be_installed`
--

LOCK TABLES `services_can_be_installed` WRITE;
/*!40000 ALTER TABLE `services_can_be_installed` DISABLE KEYS */;
INSERT INTO `services_can_be_installed` VALUES (1,'hdfs','datanode,namenode,secondarynamenode','namenode:namenode-directories^/home/hadoop/hdfs/namenode,namenode-JavaHeapSize^1024,namenode-NewGenerationSize^200,;secondarynamenode:secondarynamenode-directories^/home/hadoop/hdfs/secondarynamenode,;datanode:datanode-directories^/home/hadoop/hdfs/datanode,datanode-VolumesFailureToleration^0,datanode-MaximumJavaHeapSize^1024,;gerneral:hadoop-MaximumJavaHeapSize^1024,hdfs-MaximumCheckpointDelay^21600,ReservedSpaceForHDFS^1,WebHDFS-enabled^1,;');
/*!40000 ALTER TABLE `services_can_be_installed` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2013-11-13 15:01:46

-- MySQL dump 10.11
--
-- Host: localhost    Database: cluster_manager
-- ------------------------------------------------------
-- Server version	5.0.45

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
-- Table structure for table `host_info`
--

DROP TABLE IF EXISTS `host_info`;
CREATE TABLE `host_info` (
  `host` char(20) NOT NULL,
  `ip` char(20) NOT NULL,
  `cpu` char(10) NOT NULL,
  `ram` char(10) NOT NULL,
  `disk` char(10) NOT NULL,
  `os` char(20) NOT NULL,
  `load_info` char(10) NOT NULL,
  `key_file_path` text,
  `port` char(10) default NULL,
  `status` char(10) default NULL,
  PRIMARY KEY  (`host`,`ip`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `host_info`
--
--
-- Table structure for table `host_info_temp`
--

DROP TABLE IF EXISTS `host_info_temp`;
CREATE TABLE `host_info_temp` (
  `host` char(20) NOT NULL,
  `ip` char(20) default NULL,
  `cpu` char(10) default NULL,
  `ram` char(10) default NULL,
  `disk` char(10) default NULL,
  `os` char(20) default NULL,
  `load_info` char(10) default NULL,
  `key_file_path` char(40) default NULL,
  `port` char(10) default NULL,
  `status` char(10) default NULL,
  PRIMARY KEY  (`host`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `host_info_temp`
--
--
-- Table structure for table `role_unique`
--

DROP TABLE IF EXISTS `role_unique`;
CREATE TABLE `role_unique` (
  `role_id` int(4) NOT NULL auto_increment,
  `role_name` char(30) default NULL,
  `service_name` char(30) default NULL,
  `unique_flag` int(1) default NULL,
  PRIMARY KEY  (`role_id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `role_unique`
--

LOCK TABLES `role_unique` WRITE;
/*!40000 ALTER TABLE `role_unique` DISABLE KEYS */;
INSERT INTO `role_unique` VALUES (4,'namenode','hdfs',1),(5,'secondarynamenode','hdfs',1),(6,'datanode','hdfs',0),(7,'jobtracker','mapreduce',1),(8,'tasktracker','mapreduce',0);
/*!40000 ALTER TABLE `role_unique` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services_can_be_installed`
--

DROP TABLE IF EXISTS `services_can_be_installed`;
CREATE TABLE `services_can_be_installed` (
  `service_id` int(3) NOT NULL auto_increment,
  `service_name` char(30) NOT NULL,
  `role_name` text,
  `default_config` text NOT NULL,
  PRIMARY KEY  (`service_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `services_can_be_installed`
--

LOCK TABLES `services_can_be_installed` WRITE;
/*!40000 ALTER TABLE `services_can_be_installed` DISABLE KEYS */;
INSERT INTO `services_can_be_installed` VALUES (1,'hdfs','datanode,namenode,secondarynamenode','namenode:namenode-directories^/home/hadoop/hdfs/namenode,namenode-JavaHeapSize^1024,namenode-NewGenerationSize^200,;secondarynamenode:secondarynamenode-directories^/home/hadoop/hdfs/secondarynamenode,;datanode:datanode-directories^/home/hadoop/hdfs/datanode,datanode-VolumesFailureToleration^0,datanode-MaximumJavaHeapSize^1024,;gerneral:hadoop-MaximumJavaHeapSize^1024,hdfs-MaximumCheckpointDelay^21600,ReservedSpaceForHDFS^1,WebHDFS-enabled^1,;'),(2,'mapreduce','jobtracker,tasktracker','jobtracker:jobtracker-heapsize^1024,;tasktracker:tasktracker-heapsize^1024,;');
/*!40000 ALTER TABLE `services_can_be_installed` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services_on_running`
--

DROP TABLE IF EXISTS `services_on_running`;
CREATE TABLE `services_on_running` (
  `service_id` int(3) NOT NULL auto_increment,
  `service_name` char(30) NOT NULL,
  `role_name` text,
  `current_config` text NOT NULL,
  PRIMARY KEY  (`service_id`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `services_on_running`
--
--
-- Table structure for table `services_on_the_hosts_info`
--

DROP TABLE IF EXISTS `services_on_the_hosts_info`;
CREATE TABLE `services_on_the_hosts_info` (
  `host` char(20) NOT NULL,
  `ip` char(20) NOT NULL,
  `service_name` char(30) NOT NULL,
  `role_name` char(30) NOT NULL,
  `service_status` char(10) NOT NULL,
  `log_info` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `services_on_the_hosts_info`
--
--
-- Table structure for table `services_on_the_hosts_info_temp`
--

DROP TABLE IF EXISTS `services_on_the_hosts_info_temp`;
CREATE TABLE `services_on_the_hosts_info_temp` (
  `host` char(20) NOT NULL,
  `ip` char(20) NOT NULL,
  `service_name` char(30) NOT NULL,
  `role_name` char(30) NOT NULL,
  `service_status` char(10) NOT NULL,
  `log_info` text NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `services_on_the_hosts_info_temp`
--
--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `user_id` int(3) NOT NULL auto_increment,
  `user_name` char(20) NOT NULL,
  `password` char(20) NOT NULL,
  `permission_level` enum('0','1','2','3','4','5') default NULL COMMENT '0:root;1:admin;2:service_admin;3:normal_user',
  PRIMARY KEY  (`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2013-11-15  7:47:11

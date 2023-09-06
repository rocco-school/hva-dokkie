-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema Dokkie
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `Dokkie` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `Dokkie` ;

-- -----------------------------------------------------
-- Table `Dokkie`.`Event`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Dokkie`.`Event` (
  `eventId` INT NOT NULL AUTO_INCREMENT,
  `description` VARCHAR(100) NOT NULL,
  `dateCreated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`eventId`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `Dokkie`.`User`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Dokkie`.`User` (
  `userId` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `username` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`userId`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `Dokkie`.`Participant`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Dokkie`.`Participant` (
  `eventId` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  `userId` INT NULL,
  PRIMARY KEY (`eventId`, `name`),
  INDEX `event_idx` (`eventId` ASC),
  INDEX `user_idx` (`userId` ASC),
  CONSTRAINT `fk_participant_event`
    FOREIGN KEY (`eventId`)
    REFERENCES `Dokkie`.`Event` (`eventId`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_participant_user`
    FOREIGN KEY (`userId`)
    REFERENCES `Dokkie`.`User` (`userId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `Dokkie`.`Payment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Dokkie`.`Payment` (
  `paymentId` INT NOT NULL AUTO_INCREMENT,
  `datePaid` DATE NOT NULL,
  `description` VARCHAR(100) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `eventId` INT NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`paymentId`),
  INDEX `participant_idx` (`eventId` ASC, `name` ASC),
  CONSTRAINT `fk_payment_participant`
    FOREIGN KEY (`eventId` , `name`)
    REFERENCES `Dokkie`.`Participant` (`eventId` , `name`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT)
ENGINE = InnoDB;

USE `Dokkie` ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

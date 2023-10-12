-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema pb1b2324_reusrjc_live
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `pb1b2324_reusrjc_live` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `pb1b2324_reusrjc_live` ;

-- -----------------------------------------------------
-- Table `pb1b2324_reusrjc_live`.`Event`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pb1b2324_reusrjc_live`.`Event` (
  `eventId` VARCHAR(36) NOT NULL,
  `description` VARCHAR(100) NOT NULL,
  `dateCreated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`eventId`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `pb1b2324_reusrjc_live`.`User`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pb1b2324_reusrjc_live`.`User` (
  `userId` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `username` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`userId`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `pb1b2324_reusrjc_live`.`Participant`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pb1b2324_reusrjc_live`.`Participant` (
  `participantId` INT NOT NULL AUTO_INCREMENT, /** veranderd **/
  `eventId` VARCHAR(36) NOT NULL,
  `userId` INT NOT NULL,
  PRIMARY KEY (`participantId`,`eventId`, `userId`),
  INDEX `event_idx` (`eventId` ASC),
  INDEX `user_idx` (`userId` ASC),
  CONSTRAINT `fk_participant_event`
    FOREIGN KEY (`eventId`)
    REFERENCES `pb1b2324_reusrjc_live`.`Event` (`eventId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_participant_user`
    FOREIGN KEY (`userId`)
    REFERENCES `pb1b2324_reusrjc_live`.`User` (`userId`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Table `pb1b2324_reusrjc_live`.`Payment`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pb1b2324_reusrjc_live`.`Payment` (
`paymentId` INT NOT NULL AUTO_INCREMENT,
`datePaid` DATE,
`description` VARCHAR(100) NOT NULL,
`amount` DOUBLE NOT NULL,
`eventId` VARCHAR(36) NOT NULL,
PRIMARY KEY (`paymentId`),
INDEX `event_idx` (`eventId` ASC),
CONSTRAINT `fk_payment_event`
  FOREIGN KEY (`eventId`)
      REFERENCES `pb1b2324_reusrjc_live`.`Event` (`eventId`)
      ON DELETE RESTRICT
      ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `pb1b2324_reusrjc_live`.`expenses`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `pb1b2324_reusrjc_live`.`Expense` (
`expenseId` INT NOT NULL AUTO_INCREMENT,
`totalAmount` DOUBLE NOT NULL,
`eventId` VARCHAR(36) NOT NULL,
PRIMARY KEY (`expenseId`),
INDEX `event_idx` (`eventId` ASC),
CONSTRAINT `fk_expense_event`
  FOREIGN KEY (`eventId`)
      REFERENCES `pb1b2324_reusrjc_live`.`Event` (`eventId`)
      ON DELETE CASCADE
      ON UPDATE CASCADE
)
ENGINE = InnoDB;

USE `pb1b2324_reusrjc_live` ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

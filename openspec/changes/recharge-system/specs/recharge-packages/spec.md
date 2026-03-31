## ADDED Requirements

### Requirement: Recharge packages are seed data
The system SHALL provide predefined recharge packages as seed data for the database.

#### Scenario: System seeds 6 recharge packages on startup
- **WHEN** the system initializes
- **THEN** the database SHALL contain 6 recharge packages

### Requirement: Recharge package entity schema
The system SHALL store recharge packages with the following fields:
- id (UUID, primary key)
- name (string, e.g., "小宝石袋")
- price (decimal, CNY)
- gemsAmount (integer, base gems without bonus)
- bonusGems (integer, extra gems from promotions)
- isFirstRechargeBonus (boolean, whether first purchase doubles gems)
- isActive (boolean, whether package is available for purchase)
- iconUrl (string, optional, icon image URL)
- sortOrder (integer, display order)
- metadata (JSON, additional data like recommended tag)

#### Scenario: Recharge package has correct structure
- **WHEN** a recharge package is retrieved from database
- **THEN** it SHALL contain all specified fields with correct types

### Requirement: List active recharge packages
The API SHALL return only active recharge packages, ordered by sortOrder.

#### Scenario: GET /api/recharge/packages returns active packages
- **WHEN** client requests GET /api/recharge/packages
- **THEN** the response SHALL contain only packages where isActive=true
- **AND** packages SHALL be ordered by sortOrder ascending

### Requirement: Get single recharge package
The API SHALL return a specific recharge package by ID.

#### Scenario: GET /api/recharge/packages/:id returns package
- **WHEN** client requests GET /api/recharge/packages/:id with valid UUID
- **THEN** the response SHALL contain the package with that ID
- **AND** the response SHALL include total gems = gemsAmount + bonusGems

#### Scenario: Package not found
- **WHEN** client requests GET /api/recharge/packages/:id with non-existent ID
- **THEN** the response SHALL return 404 Not Found

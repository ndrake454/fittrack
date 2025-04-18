<?php
/**
 * Database Connection
 * Path: /exercise-app/api/db.php
 */

// Include configuration file
require_once 'config.php';

/**
 * Database Connection Class
 */
class Database {
    private $conn;
    private static $instance = null;

    /**
     * Constructor - Connect to the database
     */
    private function __construct() {
        try {
            $this->conn = new PDO(
                "mysql:host=" . DB_SERVER . ";dbname=" . DB_NAME,
                DB_USERNAME,
                DB_PASSWORD,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ]
            );
        } catch (PDOException $e) {
            $this->handleError($e);
        }
    }

    /**
     * Singleton pattern implementation
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get database connection
     * @return PDO
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Begin a transaction
     * @return bool
     */
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }

    /**
     * Commit a transaction
     * @return bool
     */
    public function commit() {
        return $this->conn->commit();
    }

    /**
     * Rollback a transaction
     * @return bool
     */
    public function rollback() {
        return $this->conn->rollBack();
    }

    /**
     * Execute a query and return the statement
     * @param string $sql SQL query
     * @param array $params Parameters for the query
     * @return PDOStatement
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->handleError($e);
        }
    }

    /**
     * Get a single row from the database
     * @param string $sql SQL query
     * @param array $params Parameters for the query
     * @return array|null
     */
    public function getRow($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Get multiple rows from the database
     * @param string $sql SQL query
     * @param array $params Parameters for the query
     * @return array
     */
    public function getRows($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Get a single value from the database
     * @param string $sql SQL query
     * @param array $params Parameters for the query
     * @return mixed
     */
    public function getValue($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchColumn();
    }

    /**
     * Insert a row into the database
     * @param string $table Table name
     * @param array $data Data to insert
     * @return int Last insert ID
     */
    public function insert($table, $data) {
        $placeholders = array_fill(0, count($data), '?');
        $fields = array_keys($data);
        $values = array_values($data);

        $sql = sprintf(
            "INSERT INTO %s (%s) VALUES (%s)",
            $table,
            implode(', ', $fields),
            implode(', ', $placeholders)
        );

        $this->query($sql, $values);
        return (int) $this->conn->lastInsertId();
    }

    /**
     * Update a row in the database
     * @param string $table Table name
     * @param array $data Data to update
     * @param string $where Where clause
     * @param array $params Parameters for the where clause
     * @return int Number of affected rows
     */
    public function update($table, $data, $where, $params = []) {
        $sets = [];
        $values = [];

        foreach ($data as $field => $value) {
            $sets[] = "$field = ?";
            $values[] = $value;
        }

        $sql = sprintf(
            "UPDATE %s SET %s WHERE %s",
            $table,
            implode(', ', $sets),
            $where
        );

        $values = array_merge($values, $params);
        $stmt = $this->query($sql, $values);

        return $stmt->rowCount();
    }

    /**
     * Delete a row from the database
     * @param string $table Table name
     * @param string $where Where clause
     * @param array $params Parameters for the where clause
     * @return int Number of affected rows
     */
    public function delete($table, $where, $params = []) {
        $sql = sprintf("DELETE FROM %s WHERE %s", $table, $where);
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Handle database errors
     * @param PDOException $e
     */
    private function handleError($e) {
        // In production, log the error instead of displaying it
        // error_log('Database Error: ' . $e->getMessage());
        
        // For development, we'll display the error
        http_response_code(HTTP_INTERNAL_SERVER_ERROR);
        echo json_encode([
            'error' => true,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
        exit;
    }
}
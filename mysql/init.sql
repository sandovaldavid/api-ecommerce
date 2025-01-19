-- Otorgar permisos al usuario developer
GRANT ALL PRIVILEGES ON ecommerce.* TO 'developer'@'%';
GRANT SELECT ON performance_schema.* TO 'developer'@'%';
GRANT PROCESS ON *.* TO 'developer'@'%';
GRANT SELECT ON mysql.* TO 'developer'@'%';
FLUSH PRIVILEGES;
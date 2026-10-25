CREATE ROLE catalog_app
    LOGIN PASSWORD 'catalog_local';

CREATE ROLE execution_app
    LOGIN PASSWORD 'execution_local';

CREATE SCHEMA catalog AUTHORIZATION catalog_app;
CREATE SCHEMA executions AUTHORIZATION execution_app;

ALTER ROLE catalog_app IN DATABASE algorithm_lab
    SET search_path TO catalog;

ALTER ROLE execution_app IN DATABASE algorithm_lab
    SET search_path TO executions;

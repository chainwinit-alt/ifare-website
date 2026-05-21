USE [IFare];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'[dbo].[search_query_log]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[search_query_log] (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        query_text NVARCHAR(200) NOT NULL,
        normalized_query NVARCHAR(200) NOT NULL,
        selected_term_id BIGINT NULL,
        source_page NVARCHAR(50) NOT NULL,
        filters_json NVARCHAR(MAX) NULL,
        result_count INT NOT NULL CONSTRAINT DF_search_query_log_result_count DEFAULT (0),
        clicked_policy_id BIGINT NULL,
        session_id NVARCHAR(100) NULL,
        user_id BIGINT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_search_query_log_created_at DEFAULT (SYSUTCDATETIME())
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_query_log_created_at'
      AND object_id = OBJECT_ID(N'[dbo].[search_query_log]')
)
BEGIN
    CREATE INDEX IX_search_query_log_created_at
        ON [dbo].[search_query_log](created_at DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_query_log_normalized_query'
      AND object_id = OBJECT_ID(N'[dbo].[search_query_log]')
)
BEGIN
    CREATE INDEX IX_search_query_log_normalized_query
        ON [dbo].[search_query_log](normalized_query);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_search_query_log_source_page_created_at'
      AND object_id = OBJECT_ID(N'[dbo].[search_query_log]')
)
BEGIN
    CREATE INDEX IX_search_query_log_source_page_created_at
        ON [dbo].[search_query_log](source_page, created_at DESC);
END;
GO




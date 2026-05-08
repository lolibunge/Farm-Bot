function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function listTableColumns(client, tableName, schemaName = 'public') {
  const result = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = $2
    `,
    [schemaName, tableName]
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function ensureTableColumns(client, tableName, columns, schemaName = 'public') {
  const existingColumns = await listTableColumns(client, tableName, schemaName);
  const qualifiedTableName = `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`;

  for (const column of Array.isArray(columns) ? columns : []) {
    if (!column?.name || !column?.definition || existingColumns.has(column.name)) {
      continue;
    }

    await client.query(
      `
      ALTER TABLE ${qualifiedTableName}
      ADD COLUMN ${quoteIdentifier(column.name)} ${column.definition}
      `
    );

    existingColumns.add(column.name);
  }
}

module.exports = {
  ensureTableColumns,
};

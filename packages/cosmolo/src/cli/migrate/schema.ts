export interface SqlColumn {
	name: string;
	type: 'TEXT' | 'INTEGER';
	notNull: boolean;
	defaultValue?: string | number;
	primaryKey?: boolean;
}

// Derived from articleFrontmatterSchema in articles.ts.
// Arrays are stored as JSON text. Booleans as INTEGER (0/1, SQLite convention).
export const ARTICLE_COLUMNS: SqlColumn[] = [
	{ name: 'slug', type: 'TEXT', notNull: true, primaryKey: true },
	{ name: 'title', type: 'TEXT', notNull: true },
	{ name: 'category', type: 'TEXT', notNull: true },
	{ name: 'excerpt', type: 'TEXT', notNull: true },
	{ name: 'sort', type: 'INTEGER', notNull: true, defaultValue: 0 },
	{ name: 'date', type: 'TEXT', notNull: true, defaultValue: '' },
	{ name: 'tags', type: 'TEXT', notNull: true, defaultValue: '[]' },
	{ name: 'series', type: 'TEXT', notNull: false },
	{ name: 'series_order', type: 'INTEGER', notNull: false },
	{ name: 'draft', type: 'INTEGER', notNull: true, defaultValue: 0 },
	{ name: 'related', type: 'TEXT', notNull: true, defaultValue: '[]' },
	{ name: 'body', type: 'TEXT', notNull: true },
];

export const CATEGORY_COLUMNS: SqlColumn[] = [
	{ name: 'key', type: 'TEXT', notNull: true, primaryKey: true },
	{ name: 'label', type: 'TEXT', notNull: true },
	{ name: 'description', type: 'TEXT', notNull: true, defaultValue: '' },
];

function columnDef(col: SqlColumn): string {
	let def = `  ${col.name} ${col.type}`;
	if (col.primaryKey) {
		def += ' PRIMARY KEY';
	} else {
		if (col.notNull) def += ' NOT NULL';
		if (col.defaultValue !== undefined) {
			const val =
				typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue;
			def += ` DEFAULT ${val}`;
		}
	}
	return def;
}

export function createTableSql(tableName: string, columns: SqlColumn[]): string {
	const defs = columns.map(columnDef).join(',\n');
	return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${defs}\n);`;
}

export function escapeSql(val: string): string {
	return val.replace(/'/g, "''");
}

export function toSqlLiteral(val: unknown): string {
	if (val === null || val === undefined) return 'NULL';
	if (typeof val === 'boolean') return val ? '1' : '0';
	if (typeof val === 'number') return String(val);
	if (val instanceof Date) return `'${escapeSql(val.toISOString().split('T')[0])}'`;
	if (Array.isArray(val)) return `'${escapeSql(JSON.stringify(val))}'`;
	return `'${escapeSql(String(val))}'`;
}

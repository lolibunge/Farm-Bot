const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');
const { toIsoDateString } = require('./date-helpers');

// Medición de pasto por el método del cuadro (corte y pesada).
// kg MS/ha = gramos de materia seca por m² × 10.

let ensurePromise = null;

const PASTURE_MEASUREMENT_COLUMNS = [
  { name: 'frame_area_m2', definition: 'NUMERIC(6,3) NOT NULL DEFAULT 1' },
  { name: 'weigh_mode', definition: "TEXT NOT NULL DEFAULT 'green'" },
  { name: 'dry_matter_pct', definition: 'NUMERIC(5,2)' },
  { name: 'cut_height', definition: 'TEXT' },
  { name: 'sample_grams', definition: "JSONB NOT NULL DEFAULT '[]'::jsonb" },
  { name: 'avg_sample_grams', definition: 'NUMERIC(10,2)' },
  { name: 'kg_dm_per_ha', definition: 'NUMERIC(10,2)' },
  { name: 'size_ha', definition: 'NUMERIC(10,2)' },
  { name: 'notes', definition: 'TEXT' },
  { name: 'created_by', definition: 'TEXT' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

async function ensurePastureMeasurementsTable() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pasture_measurements (
        id BIGSERIAL PRIMARY KEY,
        paddock_id BIGINT NOT NULL,
        measured_on DATE NOT NULL,
        frame_area_m2 NUMERIC(6,3) NOT NULL DEFAULT 1,
        weigh_mode TEXT NOT NULL DEFAULT 'green',
        dry_matter_pct NUMERIC(5,2),
        cut_height TEXT,
        sample_grams JSONB NOT NULL DEFAULT '[]'::jsonb,
        avg_sample_grams NUMERIC(10,2),
        kg_dm_per_ha NUMERIC(10,2),
        size_ha NUMERIC(10,2),
        notes TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'pasture_measurements', PASTURE_MEASUREMENT_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS pasture_measurements_paddock_date_idx
      ON pasture_measurements (paddock_id, measured_on DESC, id DESC)
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

function toNumberOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeKgDryMatterPerHa({ sampleGrams, frameAreaM2, weighMode, dryMatterPct }) {
  const valid = (Array.isArray(sampleGrams) ? sampleGrams : [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!valid.length || !(frameAreaM2 > 0)) {
    return { avgSampleGrams: null, kgDmPerHa: null };
  }

  const avgSampleGrams = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const gramsPerM2 = avgSampleGrams / frameAreaM2;
  const dryGramsPerM2 = weighMode === 'dry' ? gramsPerM2 : (gramsPerM2 * (dryMatterPct || 0)) / 100;

  return {
    avgSampleGrams,
    kgDmPerHa: dryGramsPerM2 * 10,
  };
}

function normalizePastureMeasurementRow(row) {
  if (!row) {
    return null;
  }

  const sizeHa = toNumberOrNull(row.size_ha);
  const kgDmPerHa = toNumberOrNull(row.kg_dm_per_ha);
  let sampleGrams = row.sample_grams;
  if (typeof sampleGrams === 'string') {
    try {
      sampleGrams = JSON.parse(sampleGrams);
    } catch (error) {
      sampleGrams = [];
    }
  }

  return {
    id: Number(row.id),
    paddock_id: Number(row.paddock_id),
    measured_on: toIsoDateString(row.measured_on),
    frame_area_m2: toNumberOrNull(row.frame_area_m2),
    weigh_mode: row.weigh_mode === 'dry' ? 'dry' : 'green',
    dry_matter_pct: toNumberOrNull(row.dry_matter_pct),
    cut_height: row.cut_height || null,
    sample_grams: Array.isArray(sampleGrams) ? sampleGrams.map(Number).filter(Number.isFinite) : [],
    avg_sample_grams: toNumberOrNull(row.avg_sample_grams),
    kg_dm_per_ha: kgDmPerHa,
    size_ha: sizeHa,
    total_kg_dm: kgDmPerHa != null && sizeHa != null ? kgDmPerHa * sizeHa : null,
    notes: row.notes || null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at || null,
  };
}

async function savePastureMeasurement(input) {
  await ensurePastureMeasurementsTable();

  const paddockId = Number(input.paddockId);
  const frameAreaM2 = toNumberOrNull(input.frameAreaM2) || 1;
  const weighMode = input.weighMode === 'dry' ? 'dry' : 'green';
  const dryMatterPct = weighMode === 'green' ? toNumberOrNull(input.dryMatterPct) : null;
  const sampleGrams = (Array.isArray(input.sampleGrams) ? input.sampleGrams : [])
    .map((value) => Number(String(value).replace(',', '.')))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 50);

  const paddockResult = await pool.query('SELECT id, size_ha FROM paddocks WHERE id = $1', [paddockId]);
  const paddock = paddockResult.rows[0];
  if (!paddock) {
    const error = new Error('Paddock not found');
    error.statusCode = 404;
    throw error;
  }

  const { avgSampleGrams, kgDmPerHa } = computeKgDryMatterPerHa({
    sampleGrams,
    frameAreaM2,
    weighMode,
    dryMatterPct,
  });

  const result = await pool.query(
    `
    INSERT INTO pasture_measurements (
      paddock_id, measured_on, frame_area_m2, weigh_mode, dry_matter_pct, cut_height,
      sample_grams, avg_sample_grams, kg_dm_per_ha, size_ha, notes, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)
    RETURNING *
    `,
    [
      paddockId,
      input.measuredOn,
      frameAreaM2,
      weighMode,
      dryMatterPct,
      input.cutHeight || null,
      JSON.stringify(sampleGrams),
      avgSampleGrams,
      kgDmPerHa,
      paddock.size_ha,
      input.notes || null,
      input.createdBy || 'admin_panel',
    ]
  );

  return normalizePastureMeasurementRow(result.rows[0]);
}

async function deletePastureMeasurement(measurementId) {
  await ensurePastureMeasurementsTable();
  const result = await pool.query('DELETE FROM pasture_measurements WHERE id = $1 RETURNING *', [
    Number(measurementId),
  ]);
  return normalizePastureMeasurementRow(result.rows[0]);
}

async function listLatestPastureMeasurementsByPaddock() {
  await ensurePastureMeasurementsTable();
  const result = await pool.query(`
    SELECT DISTINCT ON (paddock_id) *
    FROM pasture_measurements
    ORDER BY paddock_id, measured_on DESC, id DESC
  `);

  const byPaddock = new Map();
  result.rows.forEach((row) => {
    const normalized = normalizePastureMeasurementRow(row);
    byPaddock.set(normalized.paddock_id, normalized);
  });
  return byPaddock;
}

async function listPastureMeasurements({ paddockId, limit = 12 }) {
  await ensurePastureMeasurementsTable();
  const result = await pool.query(
    `
    SELECT *
    FROM pasture_measurements
    WHERE paddock_id = $1
    ORDER BY measured_on DESC, id DESC
    LIMIT $2
    `,
    [Number(paddockId), Math.min(Math.max(Number(limit) || 12, 1), 100)]
  );
  return result.rows.map(normalizePastureMeasurementRow);
}

module.exports = {
  ensurePastureMeasurementsTable,
  computeKgDryMatterPerHa,
  savePastureMeasurement,
  deletePastureMeasurement,
  listLatestPastureMeasurementsByPaddock,
  listPastureMeasurements,
};

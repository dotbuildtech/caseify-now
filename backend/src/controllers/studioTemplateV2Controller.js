const { PrismaClient } = require('@prisma/client');
const { uploadFromBuffer, deleteImage, getPublicIdFromUrl } = require('../services/cloudinaryService');

const prisma = new PrismaClient();
const STUDIO_FOLDER = 'phone-cover-platform/studio-templates';

const TABLE = '"StudioTemplatesV2"';
const BRAND_TABLE = '"Brands"';
const MODEL_TABLE = '"DeviceModels"';

const SELECT = `t.*, json_build_object('id', b.id, 'name', b.name, 'slug', b.slug) AS brand, json_build_object('id', m.id, 'name', m.name, 'slug', m.slug) AS model`;

const findOne = async (id) => {
  const [row] = await prisma.$queryRawUnsafe(
    `SELECT ${SELECT} FROM ${TABLE} t JOIN ${BRAND_TABLE} b ON t."brandId" = b.id JOIN ${MODEL_TABLE} m ON t."modelId" = m.id WHERE t.id = $1`, id
  );
  return row || null;
};

const uploadFile = async (file, fieldName) => {
  if (!file) return null;
  const result = await uploadFromBuffer(file.buffer, `${STUDIO_FOLDER}/${fieldName}s`);
  return result.secure_url;
};

exports.listTemplates = async (req, res) => {
  const { brandId, modelId, status, search } = req.query;
  let sql = `SELECT ${SELECT} FROM ${TABLE} t JOIN ${BRAND_TABLE} b ON t."brandId" = b.id JOIN ${MODEL_TABLE} m ON t."modelId" = m.id WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (brandId) { sql += ` AND t."brandId" = $${idx++}`; params.push(parseInt(brandId)); }
  if (modelId) { sql += ` AND t."modelId" = $${idx++}`; params.push(parseInt(modelId)); }
  if (status) { sql += ` AND t.status = $${idx++}`; params.push(status); }
  if (search) { sql += ` AND t.name ILIKE $${idx++}`; params.push(`%${search}%`); }
  sql += ' ORDER BY t."createdAt" DESC';

  const templates = await prisma.$queryRawUnsafe(sql, ...params);
  res.json({ success: true, data: templates });
};

exports.getTemplate = async (req, res) => {
  const id = parseInt(req.params.id);
  const template = await findOne(id);
  if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
  res.json({ success: true, data: template });
};

exports.getTemplateByBrandModel = async (req, res) => {
  const { brandId, modelId } = req.query;
  if (!brandId || !modelId) return res.status(400).json({ success: false, message: 'brandId and modelId required' });
  const [template] = await prisma.$queryRawUnsafe(
    `SELECT ${SELECT} FROM ${TABLE} t JOIN ${BRAND_TABLE} b ON t."brandId" = b.id JOIN ${MODEL_TABLE} m ON t."modelId" = m.id WHERE t."brandId" = $1 AND t."modelId" = $2 AND t.status = 'active' ORDER BY t.version DESC LIMIT 1`,
    parseInt(brandId), parseInt(modelId)
  );
  if (!template) return res.status(404).json({ success: false, message: 'No active template found for this device' });
  res.json({ success: true, data: template });
};

exports.createTemplate = async (req, res) => {
  const { brandId, modelId, name, version, description, status, metadataJson } = req.body;
  if (!brandId || !modelId || !name) return res.status(400).json({ success: false, message: 'brandId, modelId, name are required' });

  const v = version || '1.0';
  const [existing] = await prisma.$queryRawUnsafe(
    `SELECT id FROM ${TABLE} WHERE "brandId" = $1 AND "modelId" = $2 AND version = $3 LIMIT 1`,
    parseInt(brandId), parseInt(modelId), v
  );
  if (existing) return res.status(409).json({ success: false, message: 'Template already exists for this brand, model, and version' });

  const files = req.files || {};
  const previewImage = await uploadFile(files.previewImage?.[0], 'preview');
  if (!previewImage) return res.status(400).json({ success: false, message: 'previewImage is required' });
  const maskSvg = await uploadFile(files.maskSvg?.[0], 'mask');
  if (!maskSvg) return res.status(400).json({ success: false, message: 'maskSvg is required' });
  const cameraSvg = await uploadFile(files.cameraSvg?.[0], 'camera');
  if (!cameraSvg) return res.status(400).json({ success: false, message: 'cameraSvg is required' });

  const thumbnail = await uploadFile(files.thumbnail?.[0], 'thumbnail');
  const safeAreaSvg = await uploadFile(files.safeAreaSvg?.[0], 'safearea');
  const bleedSvg = await uploadFile(files.bleedSvg?.[0], 'bleed');
  const outlineSvg = await uploadFile(files.outlineSvg?.[0], 'outline');

  let meta = null;
  if (metadataJson) {
    try { meta = typeof metadataJson === 'string' ? JSON.parse(metadataJson) : metadataJson; } catch { return res.status(400).json({ success: false, message: 'Invalid metadataJson' }); }
  }

  const [inserted] = await prisma.$queryRawUnsafe(
    `INSERT INTO ${TABLE} ("brandId", "modelId", name, version, description, status, "previewImage", thumbnail, "maskSvg", "cameraSvg", "safeAreaSvg", "bleedSvg", "outlineSvg", "metadataJson") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb) RETURNING id`,
    parseInt(brandId), parseInt(modelId), name, v, description || null, status || 'active',
    previewImage, thumbnail, maskSvg, cameraSvg, safeAreaSvg, bleedSvg, outlineSvg,
    meta ? JSON.stringify(meta) : null
  );

  const template = await findOne(inserted.id);
  res.status(201).json({ success: true, data: template });
};

exports.updateTemplate = async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await prisma.$queryRawUnsafe(`SELECT * FROM ${TABLE} WHERE id = $1`, id);
  if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });

  const { name, version, description, status, metadataJson } = req.body;
  const files = req.files || {};
  const sets = [];
  const params = [id];
  let idx = 2;

  if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name); }
  if (version !== undefined) { sets.push(`version = $${idx++}`); params.push(version); }
  if (description !== undefined) { sets.push(`description = $${idx++}`); params.push(description); }
  if (status !== undefined) { sets.push(`status = $${idx++}`); params.push(status); }
  if (metadataJson !== undefined) {
    let parsed;
    try { parsed = typeof metadataJson === 'string' ? JSON.parse(metadataJson) : metadataJson; } catch { return res.status(400).json({ success: false, message: 'Invalid metadataJson' }); }
    sets.push(`"metadataJson" = $${idx++}::jsonb`);
    params.push(JSON.stringify(parsed));
  }

  const uploadField = async (field, column) => {
    if (files[field]?.[0]) {
      if (existing[column]) {
        const pid = getPublicIdFromUrl(existing[column]);
        if (pid) deleteImage(pid).catch(() => {});
      }
      const url = await uploadFile(files[field][0], field);
      sets.push(`"${column}" = $${idx++}`);
      params.push(url);
    }
  };
  await uploadField('previewImage', 'previewImage');
  await uploadField('thumbnail', 'thumbnail');
  await uploadField('maskSvg', 'maskSvg');
  await uploadField('cameraSvg', 'cameraSvg');
  await uploadField('safeAreaSvg', 'safeAreaSvg');
  await uploadField('bleedSvg', 'bleedSvg');
  await uploadField('outlineSvg', 'outlineSvg');

  if (sets.length > 0) {
    sets.push(`"updatedAt" = NOW()`);
    await prisma.$executeRawUnsafe(`UPDATE ${TABLE} SET ${sets.join(', ')} WHERE id = $1`, ...params);
  }

  const template = await findOne(id);
  res.json({ success: true, data: template });
};

exports.deleteTemplate = async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await prisma.$queryRawUnsafe(`SELECT * FROM ${TABLE} WHERE id = $1`, id);
  if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });

  const del = async (url) => {
    if (url) { const pid = getPublicIdFromUrl(url); if (pid) deleteImage(pid).catch(() => {}); }
  };
  await Promise.all([
    del(existing.previewImage), del(existing.thumbnail), del(existing.maskSvg),
    del(existing.cameraSvg), del(existing.safeAreaSvg), del(existing.bleedSvg), del(existing.outlineSvg),
  ]);

  await prisma.$executeRawUnsafe(`DELETE FROM ${TABLE} WHERE id = $1`, id);
  res.json({ success: true, message: 'Template deleted' });
};

exports.duplicateTemplate = async (req, res) => {
  const id = parseInt(req.params.id);
  const [orig] = await prisma.$queryRawUnsafe(`SELECT * FROM ${TABLE} WHERE id = $1`, id);
  if (!orig) return res.status(404).json({ success: false, message: 'Template not found' });

  const [inserted] = await prisma.$queryRawUnsafe(
    `INSERT INTO ${TABLE} ("brandId", "modelId", name, version, description, status, "previewImage", thumbnail, "maskSvg", "cameraSvg", "safeAreaSvg", "bleedSvg", "outlineSvg", "metadataJson") VALUES ($1, $2, $3, $4, $5, 'inactive', $6, $7, $8, $9, $10, $11, $12, $13::jsonb) RETURNING id`,
    orig.brandId, orig.modelId, `${orig.name} (Copy)`, `${orig.version}-copy-${Date.now()}`, orig.description,
    orig.previewImage, orig.thumbnail, orig.maskSvg, orig.cameraSvg,
    orig.safeAreaSvg, orig.bleedSvg, orig.outlineSvg,
    orig.metadataJson ? JSON.stringify(orig.metadataJson) : null
  );

  const template = await findOne(inserted.id);
  res.status(201).json({ success: true, data: template });
};

exports.toggleStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await prisma.$queryRawUnsafe(`SELECT status FROM ${TABLE} WHERE id = $1`, id);
  if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });

  const newStatus = existing.status === 'active' ? 'inactive' : 'active';
  await prisma.$executeRawUnsafe(`UPDATE ${TABLE} SET status = $1, "updatedAt" = NOW() WHERE id = $2`, newStatus, id);
  const template = await findOne(id);
  res.json({ success: true, data: template });
};

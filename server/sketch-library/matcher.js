import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, 'catalog', 'manifest.json');
const imagesDir = path.join(__dirname, 'images');

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchSketchLibrary(query, limit = 10) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const words = normalize(query).split(' ').filter(word => word.length > 1);

  const results = await Promise.all(
    manifest.sketches.map(async sketch => {
      const searchable = normalize([
        sketch.id,
        sketch.description,
        ...(sketch.tags || []),
        ...(sketch.attributes || [])
      ].join(' '));

      const matched = words.filter(word => searchable.includes(word));
      const score = words.length ? matched.length / words.length : 0;
      const imagePath = path.resolve(imagesDir, sketch.filename || '');

      if (!imagePath.startsWith(imagesDir + path.sep)) return null;

      try {
        await fs.access(imagePath);
      } catch {
        return null;
      }

      return {
        id: sketch.id,
        description: sketch.description,
        tags: sketch.tags || [],
        score: Number(score.toFixed(3)),
        matchedTerms: matched,
        license: sketch.license,
        attribution: sketch.attribution,
        imageUrl: `/api/sketch-library/images/${encodeURIComponent(sketch.id)}`
      };
    })
  );

  return results
    .filter(item => item && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(20, Math.max(1, limit)));
}

export async function getSketchLibraryImage(sketchId) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const sketch = manifest.sketches.find(item => item.id === sketchId);
  if (!sketch) return null;

  const imagePath = path.resolve(imagesDir, sketch.filename || '');
  if (!imagePath.startsWith(imagesDir + path.sep)) return null;

  try {
    await fs.access(imagePath);
    return { imagePath, sketch };
  } catch {
    return null;
  }
}

// Собирает public/pack/ в public/ai-team-skills.zip перед сборкой сайта.
// Свой zip-писатель на zlib: в CI нет гарантии, что есть утилита zip, а зависимость ради 60 строк не нужна.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const PACK_DIR = join(ROOT, 'public', 'pack');
export const ZIP_NAME = 'ai-team-skills.zip';
const ZIP_PATH = join(ROOT, 'public', ZIP_NAME);
const ZIP_ROOT = 'ai-team-skills/';
const SKIPPED_NAMES = new Set(['.DS_Store', '__pycache__']);
// Фиксированная дата у всех файлов: одинаковый пак даёт одинаковый архив.
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const FLAG_UTF8 = 0x0800;
const METHOD_DEFLATE = 8;

export function listPackFiles(dir = PACK_DIR) {
  const files = [];
  for (const name of readdirSync(dir).sort()) {
    if (SKIPPED_NAMES.has(name) || name.endsWith('.pyc')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) files.push(...listPackFiles(full));
    else files.push(full);
  }
  return files;
}

function buildZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(ZIP_ROOT + relative(PACK_DIR, file).split(sep).join('/'));
    const data = readFileSync(file);
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const isExecutable = (statSync(file).mode & 0o111) !== 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(FLAG_UTF8, 6);
    local.writeUInt16LE(METHOD_DEFLATE, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, packed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4); // unix: сохраняем права, скрипты остаются исполняемыми
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(FLAG_UTF8, 8);
    central.writeUInt16LE(METHOD_DEFLATE, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(((isExecutable ? 0o100755 : 0o100644) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + packed.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, end]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = listPackFiles();
  const zip = buildZip(files);
  writeFileSync(ZIP_PATH, zip);
  console.log(`pack: ${files.length} файлов → public/${ZIP_NAME} (${(zip.length / 1024).toFixed(0)} КБ)`);
}

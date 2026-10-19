// Writes a sample workbook with the real writer and validates the zip and XML structure with Python's standard library.
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
    const { buildXlsx } = await server.ssrLoadModule('/src/lib/xlsx.ts');
    const file = join(tmpdir(), 'isonga-check.xlsx');
    writeFileSync(file, buildXlsx([['Name', 'Count', 'Note'], ['Bigogwe <A&B>', '12', 'Ikarita "yahuye"'], ['Jenda', '007', 'ok']], 'Test'));
    const py = `
import zipfile, sys, xml.etree.ElementTree as ET
z = zipfile.ZipFile(sys.argv[1])
assert z.testzip() is None, 'bad crc'
names = set(z.namelist())
need = {'[Content_Types].xml','_rels/.rels','xl/workbook.xml','xl/_rels/workbook.xml.rels','xl/styles.xml','xl/worksheets/sheet1.xml'}
assert need <= names, need - names
for n in names: ET.fromstring(z.read(n))
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
rows = ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:row', ns)
print(len(rows), [c.attrib['r'] for c in rows[1].findall('m:c', ns)], ''.join(rows[1].itertext()))
`;
    const out = execFileSync('python3', ['-I', '-c', py, file]).toString().trim();
    assert(out.startsWith('3 [\'A2\', \'B2\', \'C2\']'), out);
    assert(out.includes('Bigogwe <A&B>') && out.includes('Ikarita "yahuye"'), 'special characters survive');
    console.log('XLSX is a valid package:', out);
} finally { await server.close(); }

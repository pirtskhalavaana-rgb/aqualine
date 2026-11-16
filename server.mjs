import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, extname } from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';
import { handle } from './app.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const site = new URL(process.env.SITE_URL || 'http://localhost:' + port);
const prefix = site.pathname.replace(/\/$/, '');
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 16) throw Error('Set ADMIN_PASSWORD to at least 16 characters');
const hash = value => createHash('sha256').update(value).digest();
const expected = hash('Basic ' + Buffer.from('admin:' + password).toString('base64'));
function authorize(request) {
  if (timingSafeEqual(expected, hash(request.headers.get('authorization') || ''))) return null;
  return new Response('Administrator login required', {status:401, headers:{
    'WWW-Authenticate':'Basic realm="Aqualine admin", charset="UTF-8"', 'Cache-Control':'no-store'
  }});
}
const dbPath = resolve(process.env.DATA_DIR || resolve(root,'data'), 'campaign.sqlite');
mkdirSync(dirname(dbPath), {recursive:true});
const sqlite = new DatabaseSync(dbPath);
sqlite.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS migrations(name TEXT PRIMARY KEY);');
for (const name of readdirSync(resolve(root,'drizzle')).filter(n=>n.endsWith('.sql')).sort()) {
  sqlite.exec('BEGIN IMMEDIATE');
  try {
    if (!sqlite.prepare('SELECT name FROM migrations WHERE name=?').get(name)) {
      sqlite.exec(readFileSync(resolve(root,'drizzle',name),'utf8'));
      sqlite.prepare('INSERT INTO migrations VALUES (?)').run(name);
    }
    sqlite.exec('COMMIT');
  } catch (e) { sqlite.exec('ROLLBACK'); throw e; }
}
const DB = {
  prepare(query) {
    const statement = sqlite.prepare(query);
    let args = [];
    return {bind(...values){args=values;return this},
      first(){return statement.get(...args)},run(){return statement.run(...args)},
      all(){return {results:statement.all(...args)}}};
  },
  batch(statements){return statements.map(statement=>statement.all())}
};
const read = name => readFileSync(resolve(root,name),'utf8');
const pages = {home:read('index.html'),admin:read('admin.html')};
const types = {'.woff':'font/woff','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.css':'text/css','.js':'text/javascript'};
const assets = Object.create(null);
for (const file of ['style.css','measure.js','analytics-config.js', ...readdirSync(resolve(root,'art')).map(n=>'art/'+n)]) {
  assets['/'+file] = [types[extname(file)],readFileSync(resolve(root,file)).toString('base64')];
}
const server = http.createServer(async (incoming,outgoing) => {
  try {
    const url = new URL(incoming.url,site.origin);
    if (prefix && url.pathname === prefix) {
      outgoing.writeHead(308,{location:prefix+'/'+url.search});return outgoing.end();
    }
    if (!url.pathname.startsWith(prefix+'/')) {outgoing.writeHead(404);return outgoing.end()}
    url.pathname=url.pathname.slice(prefix.length);
    const chunks=[];let size=0;
    for await (const chunk of incoming) {
      size += chunk.length;
      if(size>32768){outgoing.writeHead(413);return outgoing.end()}
      chunks.push(chunk);
    }
    const request = new Request(url,{method:incoming.method,headers:incoming.headers,
      body:chunks.length?Buffer.concat(chunks):undefined});
    const response = await handle(request,{DB,pages,assets,authorize});
    outgoing.writeHead(response.status,Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {console.error(error.message);outgoing.writeHead(500);outgoing.end('Request failed')}
});
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log('Aqualine ready at '+site.href));

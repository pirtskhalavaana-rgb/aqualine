import json,base64,pathlib
from pathlib import Path
a={}
for f in [*Path('art').glob('*'),Path('measure.js'),Path('style.css'),Path('analytics-config.js')]:
 a['/'+str(f)]=[{'svg':'image/svg+xml','woff':'font/woff','png':'image/png','webp':'image/webp','js':'text/javascript;charset=utf-8','css':'text/css;charset=utf-8'}[f.suffix[1:]],base64.b64encode(f.read_bytes()).decode()]
p={'home':Path('index.html').read_text(),'admin':Path('admin.html').read_text()}
Path('dist/server').mkdir(exist_ok=True,parents=True);Path('dist/server/index.js').write_text('const pages='+json.dumps(p,ensure_ascii=False)+'; const assets='+json.dumps(a)+';\n'+Path('app.mjs').read_text()+'\n'+Path('worker.mjs').read_text().split('\n',1)[1])

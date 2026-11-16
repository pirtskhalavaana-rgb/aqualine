import {pages,assets} from './bundled.mjs';
const owners=['pirtskhalavaana@gmail.com','ana.pirtskhalava@betterfly.ge'];
function authorize(req,path){
 if(owners.includes((req.headers.get('oai-authenticated-user-email')||'').toLowerCase()))return null;
 if(path==='/analytics'&&!req.headers.get('oai-authenticated-user-id'))return Response.redirect(new URL('/signin-with-chatgpt?return_to=/analytics',req.url),302);
 return new Response('Forbidden',{status:403});
}
export default {fetch(req,env){return handle(req,{DB:env.DB,pages,assets,authorize})}};

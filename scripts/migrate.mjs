import fs from 'node:fs';
import {parse,serialize} from 'parse5';
const doc=parse(fs.readFileSync('index.html','utf8'));
const find=(node,name)=>node.tagName===name?node:(node.childNodes||[]).map(n=>find(n,name)).find(Boolean);
const body=find(doc,'body'),head=find(doc,'head');
const fields=[]; let group='Home';
function walk(node){
 if(node.tagName==='section')group=node.attrs.find(a=>a.name==='id')?.value||group;
 node.childNodes=(node.childNodes||[]).filter(n=>n.nodeName!=='#comment'&&n.tagName!=='script');
 if(node.nodeName==='#text'&&node.value.trim()){
   const key='field_'+fields.length, value=node.value.trim();
   fields.push({key,group,label:value.slice(0,75),value});
   node.value=` {{ value('${key}') }} `;
 }
 for(const a of node.attrs||[]){
   if(['href','src','alt','data-typed-items','aria-valuenow'].includes(a.name)&&a.value&&!a.value.startsWith('#')&&!a.value.startsWith('javascript:')){
     const key='field_'+fields.length; fields.push({key,group,label:`${node.tagName} ${a.name}: ${a.value.slice(0,55)}`,value:a.value});
     a.name=`[attr.${a.name}]`; a.value=`value('${key}')`;
   }
 }
 for(const n of node.childNodes||[])walk(n);
}
walk(body);
fs.mkdirSync('src',{recursive:true});fs.mkdirSync('public',{recursive:true});
fs.writeFileSync('src/page.html',serialize(body));
fs.writeFileSync('public/content.json',JSON.stringify(fields,null,2));
head.childNodes=head.childNodes.filter(n=>n.tagName!=='script');
fs.writeFileSync('src/index.html','<!doctype html><html lang="en"><head><base href="/">'+serialize(head)+'</head><body><app-root>Loading Miguel?s site?</app-root></body></html>');

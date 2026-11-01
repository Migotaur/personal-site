import { Component, OnInit, ChangeDetectorRef, inject, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
interface Field { key: string; group: string; label: string; value: string; }
@Component({selector:'site-page',standalone:true,templateUrl:'./page.html'})
class PageComponent {
 static fields: Field[] = [];
 value(key:string) { return PageComponent.fields.find(f=>f.key===key)?.value ?? ''; }
}
@Component({selector:'app-root',standalone:true,imports:[PageComponent,FormsModule],template:`
@if (admin) {
 <main class="editor">
 <a href="./">? Back to site</a><h1>Edit site content</h1>
 <p>Update text, image paths, links, and skill percentages. Publish to make changes visible to everyone.</p>
 @if (!configured) { <p>Database setup is pending. You can edit and export content locally. Follow README.md to connect publishing.</p> }
 @if (configured && !signedIn) {
 <form (ngSubmit)="login()"><label>Email<input type="email" name="email" [(ngModel)]="email" required autocomplete="username"></label>
 <label>Password<input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password"></label><button [disabled]="busy">Sign in</button></form>
 } @else {
 <div class="toolbar"><label>Section<select [(ngModel)]="group">@for (g of groups;track g) {<option>{{g}}</option>}</select></label>
 <button (click)="exportContent()">Export content</button>
 @if (configured) {<button (click)="publish()" [disabled]="busy">{{busy ? 'Publishing?' : 'Publish changes'}}</button><button (click)="logout()">Sign out</button>}
 </div>
 @for (field of fields;track field.key) { @if (field.group===group) {
 <label>{{field.label}}<textarea [(ngModel)]="field.value" rows="3"></textarea></label>
 }}
 }
 <p role="status">{{message}}</p>
 </main>
} @else if (loaded) { <site-page /> } @else { <p class="loading" role="status">{{message || 'Loading site?'}}</p> }
`})
class AppComponent implements OnInit {
 private cdr=inject(ChangeDetectorRef);
 client?:SupabaseClient; fields:Field[]=[]; groups:string[]=[]; group='Home';
 admin=location.hash==='#admin'; configured=false; signedIn=false; loaded=false; busy=false;
 email='';password='';message='';
 async ngOnInit(){
  try {
   const response=await fetch('content.json'); if(!response.ok)throw Error('Unable to load site content.');
   this.fields=await response.json();
   const config=await fetch('content-config.json').then(r=>r.json());
   if(config.supabaseUrl && config.supabasePublishableKey){
    this.client=createClient(config.supabaseUrl,config.supabasePublishableKey); this.configured=true;
    const {data,error}=await this.client.from('site_content').select('fields').eq('id','main').maybeSingle();
    if(error){this.message='Database unavailable; bundled content is displayed.';console.warn(error.message);}
    if(Array.isArray(data?.fields)) {
     const remote=new Map(data.fields.filter((f:Field)=>typeof f.key==='string'&&typeof f.value==='string').map((f:Field)=>[f.key,f.value]));
     this.fields=this.fields.map(f=>({...f,value:(remote.get(f.key) as string|undefined)??f.value}));
    }
    this.signedIn=!!(await this.client.auth.getSession()).data.session;
   }
   this.groups=[...new Set(this.fields.map(f=>f.group))];
   PageComponent.fields=this.fields;this.loaded=true;this.cdr.detectChanges();
   if(!this.admin) await this.interactions();
  }catch(e){this.message=String(e);this.cdr.detectChanges();}
 }
 async login(){this.busy=true;try{const {error}=await this.client!.auth.signInWithPassword({email:this.email,password:this.password});if(error)throw error;this.signedIn=true;this.password='';this.message='Signed in.';}catch(e){this.message=String(e);}finally{this.busy=false;this.cdr.detectChanges();}}
 async logout(){await this.client?.auth.signOut();this.signedIn=false;this.cdr.detectChanges();}
 async publish(){this.busy=true;try{
  for(const f of this.fields){if(/^(a href|img src):/.test(f.label)&&!this.safeUrl(f.value))throw Error('Use https URLs, relative paths, or mailto links.');}
  const {error}=await this.client!.from('site_content').upsert({id:'main',fields:this.fields,updated_at:new Date().toISOString()});if(error)throw error;this.message='Published. Reload the public site to see your changes.';
 }catch(e){this.message=String(e);}finally{this.busy=false;this.cdr.detectChanges();}}
 safeUrl(value:string){try{return ['https:','http:','mailto:','tel:'].includes(new URL(value,location.href).protocol);}catch{return false;}}
 exportContent(){const url=URL.createObjectURL(new Blob([JSON.stringify(this.fields,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='content.json';a.click();URL.revokeObjectURL(url);}
 async interactions(){
  for(const src of ['assets/vendor/typed.js/typed.umd.js','assets/vendor/bootstrap/js/bootstrap.bundle.min.js','assets/vendor/glightbox/js/glightbox.min.js','assets/vendor/isotope-layout/isotope.pkgd.min.js','assets/vendor/swiper/swiper-bundle.min.js','assets/vendor/waypoints/noframework.waypoints.js','assets/vendor/purecounter/purecounter_vanilla.js','assets/js/angular-page.js']){
   await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=()=>resolve();script.onerror=()=>reject(Error('Could not load '+src));document.body.append(script);});
  }
 }
}
bootstrapApplication(AppComponent,{providers:[provideZonelessChangeDetection()]}).catch(console.error);

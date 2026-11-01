import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageInteractionsService {
  async initialize(): Promise<void> {
  for(const src of ['assets/vendor/typed.js/typed.umd.js','assets/vendor/bootstrap/js/bootstrap.bundle.min.js','assets/vendor/glightbox/js/glightbox.min.js','assets/vendor/isotope-layout/isotope.pkgd.min.js','assets/vendor/swiper/swiper-bundle.min.js','assets/vendor/waypoints/noframework.waypoints.js','assets/vendor/purecounter/purecounter_vanilla.js','assets/js/angular-page.js']){
   await new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=()=>resolve();script.onerror=()=>reject(Error('Could not load '+src));document.body.append(script);});
  }
 }
}

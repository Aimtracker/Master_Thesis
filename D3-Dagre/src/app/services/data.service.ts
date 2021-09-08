import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient,) { }

  getDataJson(path:string){
    return this.http.get(path,{responseType: 'json'});
  }

  getVueCode(path:string){
    return this.http.get(path,{responseType: 'text'});
  }
}

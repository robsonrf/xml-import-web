import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class UploadService {

  SERVER_URL: string = environment.API + environment.BASE_URL + '/file-upload';

  headers = new HttpHeaders().set('Access-Control-Allow-Origin', '**');

  constructor(private httpClient: HttpClient) {}

  public upload(xmlData: any) {

    let headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token');
    headers.set('Origin', 'http://localhost:4200');

    return this.httpClient.post<any>(this.SERVER_URL, xmlData, {
      headers: headers,
      responseType: 'json',
      reportProgress: true,
      observe: 'events'
    });

  }

}

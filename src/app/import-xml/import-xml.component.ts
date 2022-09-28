import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UploadService } from  '../upload.service';

import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-import-xml',
  templateUrl: './import-xml.component.html',
  styleUrls: ['./import-xml.component.scss']
})
export class ImportXmlComponent implements OnInit {

  @ViewChild("fileUpload", {static: false}) fileUpload: ElementRef;

  files = [];
  public loadingPercent = 0;
  public sizeTotalFiles = 0;
  public totalSent = 0;

  SERVER_URL = "http://localhost:3000/upload";
  uploadForm: FormGroup;

  constructor( private uploadService: UploadService) { }

  ngOnInit(): void { }


  onFileSelect(event: any) {
    console.log(event);
  }

  resetProgressCount() {
    this.totalSent = 0;
    this.sizeTotalFiles = 0;
    this.loadingPercent = 0;
  }

  onClick() {
    this.resetProgressCount();

    const fileUpload = this.fileUpload.nativeElement;
    fileUpload.onchange = () => {
      for (let index = 0; index < fileUpload.files.length; index++) {
        const file = fileUpload.files[index];
        let jsonFile = {
          data: file,
          inProgress: false,
          progress: 0
        };
        this.sizeTotalFiles += file.size;
        // @ts-ignore
        this.files.push( jsonFile );
      }
      this.uploadFiles();
    };
    fileUpload.click();
  }

  private uploadFiles() {
    this.fileUpload.nativeElement.value = '';
    this.files.forEach(file => {
      this.uploadFile(file);
    });
  }

  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file.data);
    file.inProgress = true;
    this.uploadService.upload(formData)
      .pipe(
        map(event => {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              // @ts-ignore
              file.progress = Math.round(event.loaded * 100 / event.total);
              this.totalSent += event.loaded;
              this.loadingPercent = Math.round(this.totalSent * 100 / this.sizeTotalFiles);
              break;
            case HttpEventType.Response:
              return event;
          }
        }),
        catchError((error: HttpErrorResponse) => {
          file.inProgress = false;
          return of(`${file.data.name} Erro ao fazer o upload.`);
        }))
      .subscribe((event: any) => {
        if (typeof (event) === 'object') {
          console.log(event.body);
          this.loadingPercent = 0;    // TODO mover para apos concluir o serviço
        }
    });
  }

}

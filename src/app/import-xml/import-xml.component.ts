import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UploadService } from  '../upload.service';

import * as converter from 'xml-js';

import { FormGroup } from '@angular/forms';
import {MatSnackBar} from "@angular/material/snack-bar";


@Component({
  selector: 'app-import-xml',
  templateUrl: './import-xml.component.html',
  styleUrls: ['./import-xml.component.scss']
})
export class ImportXmlComponent implements OnInit {

  @ViewChild("fileUpload", {static: false}) fileUpload: ElementRef;

  files = [];
  public loading: boolean = false;
  public loadingPercent = 0;
  public sizeTotalFiles = 0;
  public totalSent = 0;
  public totalSentFiles = 0;
  xml: string;
  agenteList: any = []

  uploadForm: FormGroup;

  constructor( private uploadService: UploadService, private snackbar: MatSnackBar) { }

  ngOnInit(): void { }


  resetCounts() {
    this.totalSent = 0;
    this.totalSentFiles = 0;
    this.sizeTotalFiles = 0;
    this.loading = false;
    this.loadingPercent = 0;
  }

  onClick() {
    this.resetCounts();
    this.loading = true;
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

              if (file.progress == 100) {  // 100%
                // @ts-ignore
                this.loadFileData(file.data);
              }
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
          // evento (do browser) apenas indicando que conclui o carregamento do arquivo
          // console.log(event.body);
        }
    });
  }


  private loadFileData(file) {

    const reader = new FileReader();
    reader.onload = (e: any) => {
      let xmlObj = converter.xml2json(e.target.result, {compact: true, spaces: 2});
      const JSONData = JSON.parse(xmlObj);
      this.xml = JSONData;
      this.agenteList = [];

      let agentes: any = Array.isArray(JSONData.agentes.agente)
                    ? JSONData.agentes.agente
                    : Array.of(JSONData.agentes.agente);

      let index: number = 0;
      if (agentes) {
        for (let i of agentes) {
          let agente: any = {
            codigo: i.codigo._text ? i.codigo._text : '',
            data: i.data._text ? i.data._text : '',
            regiao: {}
          };

          // regiao
          for (let reg of i.regiao) {

            agente.regiao.sigla = reg._attributes.sigla ? reg._attributes.sigla : '';

            // geracao
            agente.regiao.geracao = [];
            for (let item of reg.geracao.valor) {
              agente.regiao.geracao.push( item._text );
            }

            // compra
            agente.regiao.compra = [];
            for (let item of reg.compra.valor) {
              agente.regiao.compra.push( item._text );
            }

            // precoMedio
            // Regra de Negócio: dados confidenciais - não deve ser importado. Informando valor vazio
            agente.regiao.precoMedio = [];
            for (let item of reg.precoMedio.valor) {
              agente.regiao.precoMedio.push( "" );
            }
          }

          this.agenteList.push(agente)
          index++;
        }
      }

      this.totalSentFiles++;

      // TODO enviar dados pro back

      console.log("Total importado: " + this.totalSentFiles + "\t\tImportando dados do arquivo:" + file.name, this.agenteList );

      if (this.totalSentFiles == this.files.length) {
        console.log("Ocultando progress");
        this.openSnackBar();
        this.resetCounts();
      }
    }

    reader.readAsText(file)

  }


  private openSnackBar() {
    const snackBar = this.snackbar.open('Arquivos enviados com sucesso', 'Fechar', {
      duration: 4000
    })

    snackBar.afterDismissed().subscribe(_ => {
      console.log('Dismissed');
    })

    snackBar.onAction().subscribe(_ => {
      console.log('After Action');
    })
  }

}

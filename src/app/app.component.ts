import {Component, Signal, signal, WritableSignal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {CharacterInfoProviderService} from "./services/character-info-provider.service";
import {CharacterInfo} from "./models/characterInfo";
import {HttpClient} from "@angular/common/http";
import pdfMake from "pdfmake/build/pdfmake";
import {forkJoin, map, of, switchMap} from "rxjs";
import {ContentTable, TableCell} from "pdfmake/interfaces";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  inputText = signal('');
  footerText = signal('');
  characterInfos!: Signal<Map<string, CharacterInfo>>
  trainingRows = signal(1);

  constructor(private http: HttpClient, private characterInfoProvider: CharacterInfoProviderService) {
    this.characterInfos = characterInfoProvider.characterInfos
  }

  generatePdf() {
    if (this.inputText().length === 0) {
      return;
    }

    const pdf = pdfMake;
    pdfMake.vfs = vfs;

    pdfMake.fonts = {
      NotoSans: {
        normal: 'NotoSansJP-Regular.ttf',
        bold: 'NotoSansJP-Regular.ttf',
        italics: 'NotoSansJP-Regular.ttf',
        bolditalics: 'NotoSansJP-Regular.ttf'
      }
    };

    const chars = Array.from(this.inputText())
      .filter(c => this.characterInfos().has(c))
      .map(c => this.characterInfos().get(c)!)

    of(chars)
      .pipe(
        switchMap(chars => forkJoin(
          chars
            .map(c =>
              this.http
                .get(`assets/${c.unicode}-still.svg`, { responseType: 'text' })
                .pipe(map(svg => {
                  return {
                    svg: svg.replace("text {", "text {opacity: 0;\n"),
                    characterInfo: c,
                  }
                }))
            )
        )),
        map(svgsWithCharInfos => {
          return  svgsWithCharInfos.map(sc => {
            const strokes = sc.characterInfo.matches.map((_, index) => {
              let strokesDiagram = sc.svg
                .replace(/fill:\s*#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3});/g, 'fill: #bcbcbc;');

                for (let strokeNum = 0; strokeNum <= index; strokeNum++) {
                  strokesDiagram = strokesDiagram.replace(`.stroke${strokeNum + 1} {fill: #bcbcbc;}`, `.stroke${index + 1} {fill: #000000;}`)
                }

                return strokesDiagram;
            })

            const characterSvgBlack = sc.svg
              .replace(/fill:\s*#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3});/g, 'fill: #000000;')

            const characterSvgGray = sc.svg
              .replace(/fill:\s*#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3});/g, 'fill: #bcbcbc;')

            return {
              strokesSvgs: strokes,
              characterSvgBlack: characterSvgBlack,
              characterSvgGray: characterSvgGray,
              characterInfo: sc.characterInfo,
            }
          })
        })
      )
      .subscribe(strokesWithCharInfos => {
        strokesWithCharInfos.map(sc => this.createCharacterTrainingSection(sc))

        pdf.createPdf({
          defaultStyle: {
            font: 'NotoSans'
          },
          footer: {
            columns: [
              '',
              {
                text: this.footerText(),
                fontSize: 10,
                alignment: 'center',
              }
            ]
          },
          //Signals that node should break page before, when any of the elements of the table is on the different page than other table nodes
          pageBreakBefore: function(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
            if (currentNode.table) {
              //initialize currentPage as -1
              let currentPage = -1;
              for (let i = 0; i < currentNode.table.body.length; i++) {
                let tableCells = currentNode.table.body[i];

                for (let j = 0; j < tableCells.length; j++ ) {
                  let tableCell = tableCells[j];

                  // @ts-ignore
                  const pageNumber = tableCell['nodeInfo']?.startPosition?.pageNumber as number;

                  /** when currentPage was set by the another table's node (set above 0) and pageNumber value exists and is higher than 0 and currentPage does not equal
                   *  to the page of the currently checked node, it means that the currently checked element is on the different page than previously iterated node
                   */

                  if (currentPage > 0 && pageNumber > 0 && currentPage !== pageNumber) {
                    currentPage = pageNumber
                    return true;
                  } else if (pageNumber > 0) {
                    currentPage = pageNumber
                  }
                }
              }

              return false;
            }

            return false;
          },
          content: [
            ...strokesWithCharInfos.map(sc => this.createCharacterTrainingSection(sc)),
          ]
        }).download('test.pdf');
      });
  }

  createCharacterTrainingSection(characterInfo: { strokesSvgs: string[], characterSvgBlack: string, characterSvgGray:string, characterInfo: CharacterInfo }): ContentTable {
    const strokesContentSvg = characterInfo.strokesSvgs.map(svg => {
      const contentSvg: TableCell = {
        svg: svg,
        width: 20,
        height: 20,
        alignment: "center",
        border: [false, false, false, false],
      }

      return contentSvg
    })

    const chunkSize = 15;
    const chunkedStrokesContentSvgs: Array<Array<TableCell>> = [];

    for (let i = 0; i < strokesContentSvg.length; i += chunkSize) {
      const chunk = strokesContentSvg.slice(i, i + chunkSize);
      if (chunk.length < chunkSize) {
        chunk.push(...new Array(chunkSize - chunk.length).fill({
          text: '',
          border: [false, false, false, false],
        }))
      }

      chunkedStrokesContentSvgs.push(chunk);
    }


    const contentTable: ContentTable = {
      headlineLevel: 1,
      table: {
        widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
        heights: [45, 45, 45],
        body: [
          [
            {
              rowSpan: 2,
              svg: characterInfo.characterSvgBlack,
              width: 40,
              height: 40,
              alignment: 'center',
              marginTop: 30
            },
            {
              colSpan: 9,
              rowSpan: 2,
              table: {
                heights: 26,
                widths: '*',
                body: [
                  [
                    {
                      text: `${characterInfo.characterInfo.pinyin.toString()}       ${characterInfo.characterInfo.definition}`,
                      colSpan: 15,
                      fontSize: 10,
                      border: [false, false, false, false],
                    },
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                  ],
                  ...chunkedStrokesContentSvgs
                ]
              }
            },
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
          ],
          [
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
          ],
          ...this.generateTrainingRows(characterInfo.characterSvgGray),
        ]
      }
    };

    return contentTable;
  }

  private generateTrainingRows(characterSvgGray: string): Array<Array<TableCell>> {
    const arr: Array<Array<TableCell>> = [];

    for (let i = 0; i < this.trainingRows(); i++) {
      arr.push([
        {
          svg: `${characterSvgGray}`,
          width: 42,
          height: 42,
          alignment: 'center',
        },
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ])
    }

    return arr;
  }
}

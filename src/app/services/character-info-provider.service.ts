import {Injectable, signal, WritableSignal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CharacterInfo} from '../models/characterInfo';

@Injectable({
  providedIn: 'root'
})
export class CharacterInfoProviderService {
  private _characterInfos: WritableSignal<Map<string, CharacterInfo>> = signal(new Map<string, CharacterInfo>());
  characterInfos = this._characterInfos.asReadonly();

  constructor(private http: HttpClient) {
    this.loadDictionary();
  }

  private loadDictionary() {
    this.http.get('assets/dictionary.txt', { responseType: "text" })
      .subscribe(dictionaryString => {
        let dict = new Map<string, CharacterInfo>();

        dictionaryString.split('\n')
          .forEach(line => {
            try {
              let dictionaryRecord: CharacterInfo = JSON.parse(line);
              dictionaryRecord.unicode = dictionaryRecord.character.charCodeAt(0);
              dict.set(dictionaryRecord.character, dictionaryRecord);
            } catch {}
          });

        console.log(dict)

        this._characterInfos.set(dict);
      });
  }

}

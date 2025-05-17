import {Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {CharacterInfoProviderService} from "./services/character-info-provider.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'HanziPracticeSheetGen';

  constructor(private characterInfoProviderService: CharacterInfoProviderService) {
  }

  ngOnInit(): void {
  }
}

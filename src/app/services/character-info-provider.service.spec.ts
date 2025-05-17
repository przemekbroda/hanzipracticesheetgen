import { TestBed } from '@angular/core/testing';

import { CharacterInfoProviderService } from './character-info-provider.service';

describe('CharacterInfoProviderService', () => {
  let service: CharacterInfoProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterInfoProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

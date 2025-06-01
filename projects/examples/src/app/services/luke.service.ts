import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Gender, SwapiResponse } from '../models/swapi.model';

type LukeResponse = {
  firstName: string;
  lastName: string;
  gender: Gender;
};

@Injectable({ providedIn: 'root' })
export class LukeService {
  readonly #httpClient = inject(HttpClient);

  getLuke(): Observable<LukeResponse> {
    return this.#httpClient
      .get<SwapiResponse>('https://swapi.dev/api/people/1')
      .pipe(
        map((resp) => {
          const name = resp.name.split(' ');
          return {
            firstName: name[0],
            lastName: name[1],
            gender: resp.gender,
          };
        }),
      );
  }
}

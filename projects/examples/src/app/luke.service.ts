import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LukeService {
  private readonly httpClient = inject(HttpClient);

  getLuke(): Observable<{
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
  }> {
    return this.httpClient
      .get<{
        name: string;
        gender: 'male' | 'female' | 'other';
      }>('http://localhost:3000/people/1')
      .pipe(
        map((resp) => {
          const name = resp.name.split(' ');
          return {
            firstName: name[0],
            lastName: name[1],
            gender: resp.gender,
          };
        })
      );
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly httpClient = inject(HttpClient);
  private readonly peopleUrl = '/api/people';

  userIdExists(id: string): Observable<boolean> {
    return this.httpClient.get(`${this.peopleUrl}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  searchUserById(id: string): Observable<unknown> {
    return this.httpClient.get(`${this.peopleUrl}/${id}`);
  }
}

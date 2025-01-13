import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly httpClient = inject(HttpClient);
  public userIdExists(id: string): Observable<boolean> {
    return this.httpClient.get(`https://swapi.dev/api/people/${id}`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
  public searchUserById(id: string): Observable<any> {
    return this.httpClient.get(`https://swapi.dev/api/people/${id}`);
  }
}

import { Service } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { Product } from './product.type';

const PRODUCTS: Product[] = [
  { id: '0', name: 'Iphone x' },
  { id: '1', name: 'Iphone 11' },
  { id: '2', name: 'Iphone 12' },
  { id: '3', name: 'Iphone 13' },
];

/**
 * Mock product catalog service.
 *
 * Updated to use Angular 22's `@Service()` decorator for simplified
 * service registration instead of `@Injectable({ providedIn: 'root' })`.
 */
@Service()
export class ProductService {
  getAll(): Observable<Product[]> {
    return of(PRODUCTS).pipe(delay(1000));
  }
}

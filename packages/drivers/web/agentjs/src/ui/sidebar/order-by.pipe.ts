/**
 * OrderByPipe - Custom pipe to sort arrays by a specific property
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy',
  standalone: true
})
export class OrderByPipe implements PipeTransform {
  transform(value: any[], property: string): any[] {
    if (!value || !property) return value;
    
    return [...value].sort((a, b) => {
      if (a[property] < b[property]) return -1;
      if (a[property] > b[property]) return 1;
      return 0;
    });
  }
}
    
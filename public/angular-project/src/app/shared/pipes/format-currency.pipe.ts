import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sarCurrency',
  standalone: true,
})
export class SarCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return 'SAR 0';
    return `SAR ${value.toLocaleString()}`;
  }
}

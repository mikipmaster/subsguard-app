// Placeholder - możesz dodać integrację z API (np. fixer.io)
export async function convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<number> {
    if (from === to) return amount;
    
    // TODO: Integrate with exchange rate API
    // For now, return same amount
    return amount;
  }
  
  export function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
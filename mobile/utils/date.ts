export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  export function formatShortDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric',
    });
  }
  
  export function getDaysUntil(date: string | Date): number {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  
  export function getDaysUntilText(date: string | Date): string {
    const days = getDaysUntil(date);
    
    if (days < 0) return 'Zaległe';
    if (days === 0) return 'Dzisiaj';
    if (days === 1) return 'Jutro';
    if (days <= 7) return `Za ${days} dni`;
    return formatShortDate(date);
  }
  
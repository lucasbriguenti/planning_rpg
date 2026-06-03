import { Pipe, PipeTransform } from '@angular/core';
import { levelFromXp, getLevelTitle, xpProgressInLevel } from '../models/user.model';

@Pipe({ name: 'xpLevel', pure: true, standalone: false })
export class XpLevelPipe implements PipeTransform {
  transform(xp: number, format: 'level' | 'title' | 'progress' = 'level'): string | number {
    switch (format) {
      case 'level': return levelFromXp(xp);
      case 'title': return getLevelTitle(levelFromXp(xp));
      case 'progress': {
        const p = xpProgressInLevel(xp);
        return `${p.current}/${p.required}`;
      }
      default: return levelFromXp(xp);
    }
  }
}

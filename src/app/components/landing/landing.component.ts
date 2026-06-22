import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TrackingService } from '../../services/tracking.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly trackingService = inject(TrackingService);

  protected daysLeft = 0;
  protected daysWord = '';
  protected verbWord = '';

  ngOnInit(): void {
    this.calculateCountdown();
    this.trackingService.sendDiscordAlert('🔔 Vlada just opened the link!');
    this.trackingService.trackClarityEvent('landing_opened');
  }

  private calculateCountdown(): void {
    const now = new Date();
    // Setting target date to August 1st, 2026
    const targetDate = new Date(2026, 7, 1, 0, 0, 0); // 7 is August (0-indexed)
    
    // Check if we are already past August 1st, 2026. If so, calculate to the next August 1st.
    let finalTarget = targetDate;
    if (now.getTime() > targetDate.getTime()) {
      const nextYear = now.getFullYear();
      finalTarget = new Date(nextYear, 7, 1, 0, 0, 0);
      if (now.getTime() > finalTarget.getTime()) {
        finalTarget = new Date(nextYear + 1, 7, 1, 0, 0, 0);
      }
    }

    const diffTime = finalTarget.getTime() - now.getTime();
    // Use Math.ceil to include today
    this.daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    this.daysWord = this.getDaysDeclension(this.daysLeft);
    this.verbWord = this.getVerbAgreement(this.daysLeft);
  }

  private getDaysDeclension(days: number): string {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'дней';
    }
    if (lastDigit === 1) {
      return 'день';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'дня';
    }
    return 'дней';
  }

  private getVerbAgreement(days: number): string {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'осталось';
    }
    if (lastDigit === 1) {
      return 'остался';
    }
    return 'осталось';
  }

  protected startQuiz(): void {
    this.trackingService.trackClarityEvent('quiz_started');
    this.router.navigate(['/quiz']);
  }
}

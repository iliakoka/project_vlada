import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackingService } from '../../services/tracking.service';

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleFactor: number;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  speed: number;
  opacity: number;
}

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './success.component.html',
  styleUrl: './success.component.scss'
})
export class SuccessComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly trackingService = inject(TrackingService);
  private readonly ngZone = inject(NgZone);

  wishText = '';
  wishSubmitted = false;

  @ViewChild('starCanvas', { static: true }) 
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D | null;
  private animationFrameId: number | null = null;
  
  // Stars arrays
  private stars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private readonly maxStars = 150;
  
  // Viewport dims
  private width = 0;
  private height = 0;

  ngOnInit(): void {
    this.trackingService.trackClarityEvent('success_screen_opened');
  }

  submitWish(): void {
    if (!this.wishText.trim()) return;
    this.trackingService.trackClarityEvent('wish_submitted');
    this.wishSubmitted = true;
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    this.setupCanvas();
    
    // Listen for resize outside Angular
    window.addEventListener('resize', this.onResize);

    // Run animation loop outside Angular zone to prevent triggering digest cycles
    this.ngZone.runOutsideAngular(() => {
      this.initStars();
      this.tick();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private onResize = (): void => {
    this.setupCanvas();
    this.initStars();
  };

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private initStars(): void {
    this.stars = [];
    this.shootingStars = [];
    
    for (let i = 0; i < this.maxStars; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.3,
        alpha: Math.random(),
        twinkleSpeed: 0.005 + Math.random() * 0.015,
        twinkleFactor: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  private addShootingStar(): void {
    // Only spawn shooting star occasionally (e.g., 2% chance per frame, max 2 active)
    if (this.shootingStars.length < 2 && Math.random() < 0.008) {
      const angle = (Math.PI / 4) + (Math.random() * (Math.PI / 8)); // 45-67 degrees slope
      const speed = 8 + Math.random() * 12;
      
      this.shootingStars.push({
        x: Math.random() * this.width * 0.8,
        y: 0,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: 80 + Math.random() * 100,
        speed: speed,
        opacity: 1.0
      });
    }
  }

  private tick = (): void => {
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private draw(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Clear canvas with romantic deep dark gradient base
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#03040c');
    grad.addColorStop(0.5, '#060718');
    grad.addColorStop(1, '#0e0f2b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw regular twinkling stars
    for (const star of this.stars) {
      // Adjust alpha
      star.alpha += star.twinkleSpeed * star.twinkleFactor;
      if (star.alpha <= 0.1) {
        star.alpha = 0.1;
        star.twinkleFactor = 1;
      } else if (star.alpha >= 1.0) {
        star.alpha = 1.0;
        star.twinkleFactor = -1;
      }

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
      ctx.fill();
    }

    // Process and draw shooting stars
    this.addShootingStar();
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      
      // Update coordinates
      ss.x += ss.dx;
      ss.y += ss.dy;
      ss.opacity -= 0.015; // Slow fade out

      if (ss.opacity <= 0 || ss.x > this.width || ss.y > this.height) {
        this.shootingStars.splice(i, 1);
        continue;
      }

      // Draw shooting star (line with soft glow trail)
      const gradLine = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.dx * 3, ss.y - ss.dy * 3);
      gradLine.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
      gradLine.addColorStop(0.4, `rgba(253, 209, 102, ${ss.opacity * 0.5})`);
      gradLine.addColorStop(1, 'rgba(253, 209, 102, 0)');

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = gradLine;
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - (ss.dx / ss.speed) * ss.length, ss.y - (ss.dy / ss.speed) * ss.length);
      ctx.stroke();
    }
  }
}

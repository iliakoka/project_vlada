import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TrackingService } from '../../services/tracking.service';

interface Question {
  text: string;
  options: string[];
  correctIndex?: number; // For Q1-Q3
  reactions?: string[];  // For Q4 reactions
}

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly trackingService = inject(TrackingService);

  protected currentStep = signal(0);
  protected selectedIndex = signal<number | null>(null);
  protected attemptedWrong = signal<number[]>([]);
  
  // Visual feedback states
  protected isWrong = signal(false);
  protected isCorrect = signal(false);
  protected wrongFeedbackText = signal('');

  // Q4 specifics
  protected showQ4Reaction = signal(false);
  protected q4ReactionText = signal('');

  // Q5 specifics (No-button evasion)
  protected noButtonPosition = signal<{ top: string; left: string; position: string }>({
    top: 'auto',
    left: 'auto',
    position: 'static'
  });
  protected noButtonAttempts = signal(0);
  protected noButtonText = signal('НЕТ');

  private readonly noButtonPhrases = [
    'Ой, мимо! 😜',
    'Мимо! 🎯',
    'Не-а! 💔',
    'Почти! 😊',
    'Даже не думай 👀',
    'Сдавайся уже 💕',
    'Серьёзно? 🧐',
    'Кнопка сломалась! 🛠️',
    'Хи-хи, никак 🏔️',
    'Только ДА! ❤️'
  ];

  protected questions: Question[] = [
    {
      text: 'Сванетия известна своей непредсказуемой погодой и крутым рельефом. Что для Влады важнее всего взять с собой в эту поездку?',
      options: [
        'А) Надежную водонепроницаемую куртку.',
        'Б) Хорошие треккинговые ботинки.',
        'В) Много терпения к моим ужасным шуткам и к тому, что я буду постоянно на тебя смотреть.'
      ],
      correctIndex: 2
    },
    {
      text: 'Мы наконец добрались до Местии и стоим перед невероятной панорамой Кавказских гор. Что в этот момент будет отвлекать больше всего?',
      options: [
        'А) Величественные заснеженные вершины горы Ушба.',
        'Б) Древние каменные башни Сванетии, подсвеченные ночью.',
        'В) Тот факт, что все эти горы абсолютно проигрывают конкуренцию тому, насколько красиво ты выглядишь рядом с ними.'
      ],
      correctIndex: 2
    },
    {
      text: 'В горах разреженный воздух, и подъемы на большую высоту могут заставить сердце биться чаще, а дыхание — перехватывать. Если это случится со мной, когда мы будем гулять вместе, какая настоящая причина?',
      options: [
        'А) Просто крутой склон горы.',
        'Б) Мне нужно подтянуть кардио до августа.',
        'В) Это не имеет никакого отношения к высоте, а полностью связано с тем, что я смотрю на твою улыбку вблизи.'
      ],
      correctIndex: 2
    },
    {
      text: 'Мы едем по долгой извилистой горной дороге в Ушгули. Окна открыты, воздух свежий, и включается песня, которая идеально передает настроение августа. Кто выбирает трек?',
      options: [
        'А) Я, потому что я уже неделями собираю идеальный плейлист для этой поездки.',
        'Б) Ты, потому что любая песня, которую ты включаешь, мгновенно становится моей любимой.',
        'В) Никакой музыки — просто разговаривать всю дорогу, а это втайне то, чего я жду больше всего.'
      ],
      reactions: [
        'Зная твой музыкальный вкус, это будет лучший плейлист. Не могу дождаться услышать его на извилистых дорогах Сванетии! 🏔️✨',
        'Кажется, мой плейлист обречен на второе место. Твои песни всегда попадают мне прямо в сердце. ❤️',
        'Знаешь... это именно то, о чем я мечтаю больше всего. Разговаривать часами под шум ветра за открытым окном. 🥰'
      ]
    },
    {
      text: 'Финальный вопрос. Среди всех планов компании, походов и хаоса поездки с друзьями, ты обещаешь сбежать со мной хотя бы на один тихий вечер? Просто взять что-нибудь выпить, отойти от всего этого шума и посмотреть на звезды?',
      options: [] // Managed with custom Yes/No buttons in HTML
    }
  ];

  private readonly wrongTipsMap: Record<number, string[]> = {
    0: [
      'Куртка — это, конечно, практично для дождливой Сванетии... Но неужели это самое важное? 😉',
      'В горах без удобной обуви никуда, но есть кое-что, без чего поездка точно не сложится! 🥾❤️'
    ],
    1: [
      'Ушба прекрасна, спору нет, но разве заснеженная вершина может греть сердце? 🏔️',
      'Башни Сванетии хранят много вековых тайн, но моя главная загадка в этой поездке — это ты... ✨'
    ],
    2: [
      'Склон действительно крутой, но он тут совершенно ни при чем, поверь мне! 🏔️',
      'Кардио — штука полезная, но даже идеальный пульс зашкаливает рядом с тобой! 💓'
    ]
  };

  ngOnInit(): void {
    this.trackingService.trackClarityEvent('quiz_screen_entered');
  }

  protected selectOption(index: number): void {
    // Prevent double selecting during transition or selecting an already failed option
    if (this.isCorrect() || this.showQ4Reaction() || this.attemptedWrong().includes(index)) return;

    const step = this.currentStep();
    const question = this.questions[step];
    this.selectedIndex.set(index);

    // Track response to Discord
    const optionLetter = index === 0 ? 'A' : index === 1 ? 'B' : 'C';
    this.trackingService.sendDiscordAlert(`🔔 Vlada answered Question [${step + 1}] with Option [${optionLetter}]`);
    this.trackingService.trackClarityEvent(`q${step + 1}_answered_option_${optionLetter}`);

    if (step < 3) {
      // Question 1-3 (Correct answer validation)
      if (index === question.correctIndex) {
        this.isCorrect.set(true);
        this.isWrong.set(false); // Clear error tip on success
        setTimeout(() => {
          this.nextStep();
        }, 1200);
      } else {
        // Toggle isWrong off first to force Angular to destroy the old tip element
        this.isWrong.set(false);
        this.attemptedWrong.update(arr => [...arr, index]);
        
        // Lookup specific tip based on current step and selected wrong option index
        const stepTips = this.wrongTipsMap[step];
        const tip = stepTips && stepTips[index] !== undefined ? stepTips[index] : 'Попробуй другой вариант! 😉';
        this.wrongFeedbackText.set(tip);
        
        // Use a tiny timeout to re-enable isWrong, triggering the entry animation again
        setTimeout(() => {
          this.isWrong.set(true);
        }, 20);
        
        // Reset active selectedIndex to let her tap other options
        this.selectedIndex.set(null);
      }
    } else if (step === 3) {
      // Question 4 (Playlist - all answers valid, shows custom inline reaction text)
      if (question.reactions) {
        this.q4ReactionText.set(question.reactions[index]);
        this.showQ4Reaction.set(true);
      }
    }
  }

  protected nextStep(): void {
    // Reset states
    this.isCorrect.set(false);
    this.isWrong.set(false);
    this.selectedIndex.set(null);
    this.attemptedWrong.set([]);
    this.showQ4Reaction.set(false);
    this.q4ReactionText.set('');

    const next = this.currentStep() + 1;
    if (next < this.questions.length) {
      this.currentStep.set(next);
    }
  }


  // Q5 Evasion Logic
  protected evadeNoButton(event: Event): void {
    event.preventDefault(); // Stop mobile clicks/focus

    // Toggle isWrong off first to force Angular to re-trigger the CSS entry animation
    this.isWrong.set(false);
    this.noButtonAttempts.update(val => val + 1);
    
    // Get phrase and set as error feedback text
    const phraseIndex = Math.min(this.noButtonAttempts() - 1, this.noButtonPhrases.length - 1);
    const phrase = this.noButtonPhrases[phraseIndex];
    this.wrongFeedbackText.set(phrase);

    // Re-enable isWrong in next tick to play animation
    setTimeout(() => {
      this.isWrong.set(true);
    }, 20);

    // Calculate random position in viewport boundaries
    // Keep it tighter (30% - 70% of screen width, 35% - 65% of screen height) to prevent scrollbars
    const randomX = Math.floor(Math.random() * 40) + 30; // 30% - 70%
    const randomY = Math.floor(Math.random() * 30) + 35; // 35% - 65%

    this.noButtonPosition.set({
      position: 'fixed',
      top: `${randomY}vh`,
      left: `${randomX}vw`
    });

    this.trackingService.trackClarityEvent(`no_button_evaded_attempt_${this.noButtonAttempts()}`);
  }

  protected sayYes(): void {
    this.trackingService.sendDiscordAlert('🎉 SUCCESS! Vlada said YES to looking at the stars in Svaneti!');
    this.trackingService.trackClarityEvent('success_yes_clicked');
    
    // Smooth transition to Success route
    this.router.navigate(['/success']);
  }
}

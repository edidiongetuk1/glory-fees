import { GraduationCap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div 
      className="fixed inset-0 z-50 gradient-navy flex items-center justify-center animate-fade-out"
      style={{ animationDelay: '2s', animationDuration: '0.5s', animationFillMode: 'forwards' }}
      onAnimationEnd={onComplete}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
      
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        <div className="animate-scale-in">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gradient-gold flex items-center justify-center shadow-gold mb-6 mx-auto">
            <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Soaring Glory
        </h1>
        <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          International Model Schools
        </p>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <h2 className="text-xl sm:text-2xl font-semibold text-secondary mb-4">
            Enterprise Fee Management
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed max-w-md text-sm sm:text-base">
            A secure, session-based financial platform for managing student fees, 
            payments, and financial reporting across Nursery, Primary, and Secondary sections.
          </p>
        </div>

        <div className="mt-10 animate-fade-in" style={{ animationDelay: '1s' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-secondary/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-secondary/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

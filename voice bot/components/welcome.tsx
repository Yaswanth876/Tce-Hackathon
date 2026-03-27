import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  return (
    <>
      {/* Main Content */}
      <section
        ref={ref}
        inert={disabled}
        className={cn(
          'fixed inset-0 flex flex-col items-center justify-center overflow-y-auto text-center',
          'bg-white text-black',
          'px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8',
          disabled ? 'pointer-events-none z-0' : 'z-20'
        )}
      >
        <div className="mx-auto max-h-[80vh] w-full max-w-5xl space-y-6 overflow-y-auto sm:space-y-8 md:space-y-10">
          {/* Logo - Always visible */}
          <div className="sticky top-0 z-10 flex justify-center bg-white/90 py-2 backdrop-blur-sm">
            <Image
              src="/android-chrome-192x192.png"
              alt="Aqro Intelligence Logo"
              width={96}
              height={96}
              className="h-16 w-16 rounded-xl border-2 border-blue-300 shadow-md sm:h-20 sm:w-20 md:h-24 md:w-24"
              priority
            />
          </div>

          {/* Brand Title */}
          <div className="space-y-3">
            <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold text-black">
              Aqro Intelligence
            </h1>
            <p className="mx-auto max-w-lg text-[clamp(0.9rem,2vw,1.25rem)] leading-relaxed text-gray-700">
              Voice Bot for Madurai Citizens - Report Civic Complaints
            </p>
          </div>

          {/* Description + Instructions */}
          <div className="space-y-4">
            <p className="mx-auto max-w-2xl text-sm font-medium text-gray-700 sm:text-base">
              Help keep Madurai clean - Report complaints easily with AI-powered voice assistance
            </p>

            <div className="mx-auto max-w-2xl rounded-xl border-2 border-blue-200 bg-white p-4 text-left shadow-sm sm:p-6">
              <h3 className="mb-3 text-base font-semibold text-black sm:text-lg">
                Getting Started:
              </h3>
              <ul className="space-y-2 text-sm text-black sm:text-base">
                {[
                  'Click the "Connect" button to begin your conversation',
                  'Allow microphone access when prompted',
                  'Report civic issues like garbage, potholes, or drainage problems',
                  'Get instant confirmation and tracking for your complaints',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 min-w-[1.2rem] items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Features */}
          <div className="mx-auto w-full max-w-4xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: '🚮',
                  title: 'Garbage Collection',
                  desc: 'Report uncollected garbage and waste management issues',
                },
                {
                  icon: '🛣️',
                  title: 'Road & Infrastructure',
                  desc: 'Report potholes, streetlight issues, and road damage',
                },
                {
                  icon: '💧',
                  title: 'Water & Drainage',
                  desc: 'Report water leakage, drainage blocks, and flooding',
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border-2 border-blue-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md sm:p-6"
                >
                  <div className="mb-2 text-2xl sm:text-3xl">{f.icon}</div>
                  <h4 className="mb-1 text-base font-semibold text-black sm:text-lg">{f.title}</h4>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-8 pb-24">
            <p className="text-center text-xs text-gray-500 sm:text-sm">
              Powered by Aqro Intelligence • Helping Madurai Stay Clean
            </p>
          </footer>
        </div>
      </section>

      {/* Fixed Start Call Button */}
      {!disabled && (
        <div className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex items-center justify-center p-4">
          <div className="pointer-events-auto w-full max-w-sm">
            <Button
              variant="primary"
              size="lg"
              onClick={onStartCall}
              className={cn(
                'h-12 w-full px-6 text-base font-semibold sm:h-14 sm:px-8 sm:text-lg',
                'bg-blue-600 text-white hover:bg-blue-700',
                'rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl',
                'hover:scale-[1.02] active:scale-[0.97]',
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                'cursor-pointer touch-manipulation',
                'relative z-[10000]'
              )}
            >
              {startButtonText}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

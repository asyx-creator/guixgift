import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface FloatingPackage {
  id: number;
  x: number;
  emoji: string;
  name: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface DonationTier {
  name: string;
  emoji: string;
  amount: number;
  description: string;
  color: string;
}

// Constants
const PACKAGES = [
  { name: 'emacs', emoji: '📝' },
  { name: 'vim', emoji: '⌨️' },
  { name: 'gcc', emoji: '🔧' },
  { name: 'python', emoji: '🐍' },
  { name: 'rust', emoji: '🦀' },
  { name: 'git', emoji: '📦' },
  { name: 'linux-libre', emoji: '🐧' },
  { name: 'guile', emoji: '🎭' },
  { name: 'gimp', emoji: '🎨' },
  { name: 'blender', emoji: '🧊' },
  { name: 'ffmpeg', emoji: '🎬' },
  { name: 'nginx', emoji: '🌐' },
  { name: 'postgresql', emoji: '🐘' },
  { name: 'redis', emoji: '🔴' },
  { name: 'docker', emoji: '🐳' },
  { name: 'node', emoji: '💚' },
  { name: 'ruby', emoji: '💎' },
  { name: 'go', emoji: '🔵' },
  { name: 'haskell', emoji: 'λ' },
  { name: 'scheme', emoji: '🎋' },
];

const DONATION_TIERS: DonationTier[] = [
  { name: 'Пакетик', emoji: '📦', amount: 1, description: 'Один маленький пакет', color: 'from-green-500 to-green-700' },
  { name: 'Бандл', emoji: '🎁', amount: 5, description: 'Набор из 5 пакетов', color: 'from-blue-500 to-blue-700' },
  { name: 'Мега-пак', emoji: '🚀', amount: 25, description: '25 пакетов разом!', color: 'from-purple-500 to-purple-700' },
  { name: 'Гига-дроп', emoji: '💎', amount: 100, description: '100 пакетов! Легенда!', color: 'from-yellow-500 to-orange-600' },
  { name: 'ГУИКС-БОГ', emoji: '👑', amount: 500, description: '500 пакетов! Ты БОГ!', color: 'from-red-500 to-pink-600' },
];

const FUNNY_MESSAGES = [
  'guix install --donate=love ❤️',
  'Building package from source... with LOVE!',
  'guix package -i happiness',
  'Substitutes loaded from the heart!',
  'guix pull --commitment=100%',
  'Derivation computed successfully! 🎉',
  'gc roots: your generosity',
  'Channel updated: kindness-channel',
  'guix system reconfigure --joy',
  'Store item added to /gnu/store/happiness!',
  'guix environment --pure --donate',
  'Manifest loaded: generosity.scm',
  'Building... (just kidding, it\'s free software!)',
  'guix pack --symlink-buttons',
  'Profile generation: AWESOME',
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'Первый шаг', description: 'Задонать первый пакет', icon: '🌱', unlocked: false },
  { id: 'ten', title: 'Десяточка', description: 'Задонать 10 пакетов', icon: '🔟', unlocked: false },
  { id: 'fifty', title: 'Полтинник', description: 'Задонать 50 пакетов', icon: '💪', unlocked: false },
  { id: 'hundred', title: 'Сотка', description: 'Задонать 100 пакетов', icon: '💯', unlocked: false },
  { id: 'combo5', title: 'Комбо мастер', description: 'Набрать комбо x5', icon: '⚡', unlocked: false },
  { id: 'combo10', title: 'Комбо легенда', description: 'Набрать комбо x10', icon: '🔥', unlocked: false },
  { id: 'speed', title: 'Скорострел', description: '10 донатов за 5 секунд', icon: '⚡', unlocked: false },
  { id: 'mega', title: 'Мега-донатер', description: 'Задонать 500 пакетов', icon: '👑', unlocked: false },
  { id: 'thousand', title: 'ТЫСЯЧА!', description: 'Задонать 1000 пакетов', icon: '🏆', unlocked: false },
  { id: 'allpackages', title: 'Коллекционер', description: 'Задонать все виды пакетов', icon: '🎯', unlocked: false },
];

function App() {
  const [totalDonated, setTotalDonated] = useState(0);
  const [floatingPackages, setFloatingPackages] = useState<FloatingPackage[]>([]);
  const [currentMessage, setCurrentMessage] = useState(FUNNY_MESSAGES[0]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);
  const [donatedPackages, setDonatedPackages] = useState<Set<string>>(new Set());
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [level, setLevel] = useState(1);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const particleId = useRef(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Level calculation
  useEffect(() => {
    const newLevel = Math.floor(totalDonated / 50) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
    }
  }, [totalDonated, level]);

  // Combo reset timer
  useEffect(() => {
    if (combo > 0) {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => {
        setCombo(0);
      }, 3000);
    }
    return () => {
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, [combo]);

  // Check achievements
  const checkAchievements = useCallback((newTotal: number, newCombo: number, newDonatedPackages: Set<string>, timestamps: number[]) => {
    const newAchievements = [...achievements];
    let unlocked: Achievement | null = null;

    const check = (id: string, condition: boolean) => {
      const ach = newAchievements.find(a => a.id === id);
      if (ach && !ach.unlocked && condition) {
        ach.unlocked = true;
        unlocked = ach;
      }
    };

    check('first', newTotal >= 1);
    check('ten', newTotal >= 10);
    check('fifty', newTotal >= 50);
    check('hundred', newTotal >= 100);
    check('combo5', newCombo >= 5);
    check('combo10', newCombo >= 10);
    check('speed', timestamps.length >= 10);
    check('mega', newTotal >= 500);
    check('thousand', newTotal >= 1000);
    check('allpackages', newDonatedPackages.size >= PACKAGES.length);

    setAchievements(newAchievements);
    if (unlocked) {
      setShowAchievement(unlocked);
      setTimeout(() => setShowAchievement(null), 3000);
    }
  }, [achievements]);

  // Handle donation
  const handleDonate = (tier: DonationTier) => {
    const now = Date.now();
    const newTimestamps = [...clickTimestamps.filter(t => now - t < 5000), now];
    setClickTimestamps(newTimestamps);

    // Add floating packages
    const newPackages: FloatingPackage[] = [];
    for (let i = 0; i < Math.min(tier.amount, 10); i++) {
      const pkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
      newPackages.push({
        id: particleId.current++,
        x: Math.random() * 80 + 10,
        emoji: pkg.emoji,
        name: pkg.name,
      });
    }
    setFloatingPackages(prev => [...prev, ...newPackages]);

    // Clean up particles after animation
    setTimeout(() => {
      setFloatingPackages(prev => prev.filter(p => !newPackages.includes(p)));
    }, 2000);

    // Update state
    const newTotal = totalDonated + tier.amount;
    const newCombo = combo + 1;
    const newDonatedPackages = new Set(donatedPackages);
    
    // Add random packages to donated set
    for (let i = 0; i < tier.amount; i++) {
      const pkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
      newDonatedPackages.add(pkg.name);
    }

    setTotalDonated(newTotal);
    setCombo(newCombo);
    setMaxCombo(Math.max(maxCombo, newCombo));
    setDonatedPackages(newDonatedPackages);
    setCurrentMessage(FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)]);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    // Add terminal line
    const randomPkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)];
    setTerminalLines(prev => [
      ...prev.slice(-20),
      `$ guix install ${randomPkg.name}... [OK] ✓`
    ]);

    // Check achievements
    checkAchievements(newTotal, newCombo, newDonatedPackages, newTimestamps);
  };

  // Progress to next level
  const progressToNextLevel = (totalDonated % 50) / 50 * 100;

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating packages animation */}
      {floatingPackages.map(pkg => (
        <div
          key={pkg.id}
          className="particle animate-float-up"
          style={{ left: `${pkg.x}%`, bottom: '20%' }}
        >
          <div className="text-center">
            <span className="text-3xl">{pkg.emoji}</span>
            <div className="text-xs text-green-400 font-mono mt-1">{pkg.name}</div>
          </div>
        </div>
      ))}

      {/* Achievement popup */}
      {showAchievement && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="guix-card p-4 flex items-center gap-3 border-yellow-500/50">
            <div className="achievement-badge">{showAchievement.icon}</div>
            <div>
              <div className="text-yellow-400 font-bold text-sm">🏆 ДОСТИЖЕНИЕ!</div>
              <div className="text-white font-bold">{showAchievement.title}</div>
              <div className="text-gray-400 text-xs">{showAchievement.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-black mb-2">
            <span className="text-green-400">GNU</span>{' '}
            <span className="text-white">Guix</span>{' '}
            <span className="text-purple-400">Donation</span>{' '}
            <span className="text-yellow-400">Simulator</span>
          </h1>
          <p className="text-gray-400 text-lg">Задонать пакетов на сколько влезет 🎁</p>
          <p className="text-gray-500 text-sm mt-1 font-mono">
            (все донаты виртуальные, как и всё остальное в этом мире)
          </p>
        </div>

        {/* Stats bar */}
        <div className={`guix-card p-6 mb-6 ${isShaking ? 'animate-shake' : ''}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-black text-green-400">{totalDonated.toLocaleString()}</div>
              <div className="text-gray-400 text-sm">пакетов задоначено</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-400">Ур. {level}</div>
              <div className="text-gray-400 text-sm">уровень щедрости</div>
            </div>
            <div>
              <div className={`text-3xl font-black ${combo > 5 ? 'animate-rainbow' : 'text-yellow-400'}`}>
                x{combo}
              </div>
              <div className="text-gray-400 text-sm">комбо (макс: x{maxCombo})</div>
            </div>
            <div>
              <div className="text-3xl font-black text-blue-400">{donatedPackages.size}/{PACKAGES.length}</div>
              <div className="text-gray-400 text-sm">видов пакетов</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Уровень {level}</span>
              <span>Уровень {level + 1}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressToNextLevel}%` }}></div>
            </div>
          </div>
        </div>

        {/* Terminal message */}
        <div className="terminal-text mb-6 text-green-400 text-sm md:text-base">
          <span className="text-gray-500">$</span> {currentMessage}
          <span className="animate-pulse">▊</span>
        </div>

        {/* Donation tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {DONATION_TIERS.map((tier) => (
            <button
              key={tier.name}
              onClick={() => handleDonate(tier)}
              className={`guix-card p-4 text-center hover:scale-105 transition-all duration-200 cursor-pointer group`}
            >
              <div className="text-4xl mb-2 group-hover:animate-bounce">{tier.emoji}</div>
              <div className={`text-lg font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                {tier.name}
              </div>
              <div className="text-2xl font-black text-white my-1">+{tier.amount}</div>
              <div className="text-gray-400 text-xs">{tier.description}</div>
              <div className="mt-3 donate-btn text-sm w-full">
                ЗАДОНАТИТЬ
              </div>
            </button>
          ))}
        </div>

        {/* Combo display */}
        {combo >= 3 && (
          <div className="text-center mb-6 animate-bounce-in">
            <div className={`combo-display ${combo >= 10 ? 'animate-rainbow' : 'text-green-400'}`}>
              🔥 КОМБО x{combo}! 🔥
            </div>
            {combo >= 5 && <div className="text-yellow-400 text-lg">НЕВЕРОЯТНО!</div>}
            {combo >= 10 && <div className="text-purple-400 text-xl font-bold">ЛЕГЕНДАРНО!!!</div>}
          </div>
        )}

        {/* Terminal output */}
        <div className="mb-8">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="text-green-400 font-mono text-sm hover:text-green-300 transition-colors"
          >
            {showTerminal ? '▼' : '▶'} Показать терминал ({terminalLines.length} строк)
          </button>
          {showTerminal && (
            <div className="terminal-text mt-2 max-h-48 overflow-y-auto">
              {terminalLines.length === 0 ? (
                <div className="text-gray-500">Начни донатить, чтобы увидеть логи...</div>
              ) : (
                terminalLines.map((line, i) => (
                  <div key={i} className="text-green-400 text-xs md:text-sm py-0.5">
                    {line}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="guix-card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            🏆 Достижения
            <span className="text-sm text-gray-400 font-normal">
              ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3 rounded-lg border text-center transition-all ${
                  ach.unlocked
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-gray-700 bg-gray-800/30 opacity-50'
                }`}
              >
                <div className="text-2xl mb-1">{ach.unlocked ? ach.icon : '🔒'}</div>
                <div className={`text-sm font-bold ${ach.unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {ach.title}
                </div>
                <div className="text-xs text-gray-400 mt-1">{ach.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>🐧 Сделано с любовью к свободному софту 🐧</p>
          <p className="font-mono text-xs mt-2">
            guix install fun --profile=~/.happiness
          </p>
          <p className="text-xs mt-2 text-gray-600">
            Ни один реальный пакет не пострадал при создании этого сайта
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;

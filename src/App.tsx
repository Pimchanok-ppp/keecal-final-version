import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Trainer, FoodEntry, Personality, ActivityLevel, Goal, Gender, Language } from './types';
import { analyzeFoodImage } from './services/geminiService';
import { Icons, COLORS } from './constants';
import { translations } from './translations';

const Button: React.FC<{ 
  onClick?: () => void; 
  className?: string; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
}> = ({ onClick, className = '', children, variant = 'primary', disabled = false }) => {
  const base = "py-4 px-6 rounded-2xl font-black transition-all active:scale-95 text-center flex items-center justify-center gap-2 uppercase italic tracking-wider";
  const variants = {
    primary: `bg-[#C6FF00] text-black hover:bg-[#A3D900] shadow-[0_8px_20px_-4px_rgba(198,255,0,0.4)]`,
    secondary: `bg-[#1E1E1E] text-white hover:bg-[#2A2A2A] border border-white/5`,
    outline: `border-2 border-[#C6FF00] text-[#C6FF00] hover:bg-[#C6FF00]/10`,
    danger: `bg-[#FF3D00] text-white hover:bg-[#D53300] shadow-[0_8px_20px_-4px_rgba(255,61,0,0.4)]`
  };
  return (
    <button onClick={!disabled ? onClick : undefined} className={`${base} ${variants[variant]} ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : ''} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-[#121212] rounded-[2rem] border border-white/5 shadow-2xl p-6 ${className}`}>
    {children}
  </div>
);

const Input: React.FC<{ 
  label: string; 
  type?: string; 
  value: any; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
}> = ({ label, type = 'text', value, onChange, options, placeholder }) => (
  <div className="flex flex-col gap-2 mb-5 w-full text-left">
    <label className="text-[10px] font-black text-[#C6FF00] ml-1 uppercase tracking-[0.2em]">{label}</label>
    {type === 'select' ? (
      <select value={value} onChange={onChange} className="bg-[#1E1E1E] text-white rounded-2xl p-4 outline-none border border-white/5 focus:border-[#C6FF00] transition-colors appearance-none font-bold">
        {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value === 0 && type === 'number' ? '' : value} onChange={onChange} placeholder={placeholder} className="bg-[#1E1E1E] text-white rounded-2xl p-4 outline-none border border-white/5 focus:border-[#C6FF00] transition-colors font-bold placeholder:text-white/20" />
    )}
  </div>
);

const LandingPage: React.FC<{ onStart: () => void, lang: Language, setLang: (l: Language) => void }> = ({ onStart, lang, setLang }) => {
  const t = translations[lang];
  return (
    <div className="flex flex-col items-center justify-between h-screen px-8 py-20 text-center bg-[#050505] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#C6FF00]/10 blur-[100px] rounded-full" />
      <div className="mt-10 z-10 flex gap-2">
         <button onClick={() => setLang('th')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${lang === 'th' ? 'bg-[#C6FF00] text-black' : 'bg-white/5 text-white/40'}`}>TH</button>
         <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${lang === 'en' ? 'bg-[#C6FF00] text-black' : 'bg-white/5 text-white/40'}`}>EN</button>
      </div>
      <div className="mt-10 z-10">
        <h1 className="text-8xl font-black italic text-white mb-2 tracking-tighter uppercase leading-none">{t.landing_title}<span className="text-[#C6FF00]">CAL</span></h1>
        <p className="text-white/40 text-sm font-bold max-w-[250px] mx-auto uppercase tracking-widest">{t.landing_subtitle}</p>
      </div>
      <Button onClick={onStart} className="w-full max-w-xs text-xl py-6 z-10">{t.landing_btn}</Button>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'landing' | 'profile_setup' | 'trainer_setup' | 'main'>('landing');
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'profile'>('home');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [history, setHistory] = useState<FoodEntry[]>([]);
  const [appLang, setAppLang] = useState<Language>('th');
  const [showResetModal, setShowResetModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState<FoodEntry | null>(null);
  const t = translations[appLang];
  const trainerImageInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('keecal_profile');
    const savedTrainer = localStorage.getItem('keecal_trainer');
    const savedHistory = localStorage.getItem('keecal_history');
    if (savedProfile && savedTrainer) {
      setProfile(JSON.parse(savedProfile));
      setTrainer(JSON.parse(savedTrainer));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      setAppLang(JSON.parse(savedProfile).language || 'th');
      setView('main');
    } else {
      initializeDefaults(appLang);
    }
  }, []);

  const initializeDefaults = (lang: Language) => {
    setProfile({ name: '', gender: 'male', age: 0, weight: 0, height: 0, activity: 'moderate', goal: 'maintain', dailyLimit: 2000, language: lang, profileImage: '' });
    setTrainer({ name: 'Coach Ken', personality: 'kind', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop' });
  };

  const handleReset = () => { localStorage.clear(); initializeDefaults(appLang); setHistory([]); setView('landing'); setShowResetModal(false); setCurrentTab('home'); };

  const handleImageUpload = async (file: File) => {
    if (!profile || !trainer) return;
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const result = await analyzeFoodImage(base64);
        const newEntry: FoodEntry = { id: Date.now().toString(), timestamp: Date.now(), imageUrl: base64, name: result.name || 'Food', calories: result.calories || 0, nutrition: result.nutrition || { protein: 0, carbs: 0, fat: 0 }, trainerComment: result.trainerComment || '...' };
        const newHistory = [newEntry, ...history];
        setHistory(newHistory);
        localStorage.setItem('keecal_history', JSON.stringify(newHistory));
        setShowResult(newEntry);
      } catch (err) { alert("Analysis failed."); } finally { setAnalyzing(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'trainer') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'profile' && profile) setProfile({ ...profile, profileImage: reader.result as string });
        else if (type === 'trainer' && trainer) setTrainer({ ...trainer, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTDEE = (p: UserProfile) => {
    let bmr = p.gender === 'male' ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5 : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
    const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra_active: 1.9 };
    let tdee = bmr * factors[p.activity];
    if (p.goal === 'lose') tdee -= 500;
    if (p.goal === 'gain') tdee += 500;
    return Math.round(tdee);
  };

  if (view === 'profile_setup') return (
    <div className="p-8 pb-32 overflow-y-auto min-h-screen bg-[#0A0A0A] text-center">
      <h2 className="text-4xl font-black mb-8 italic text-white tracking-tighter uppercase">{t.setup_profile}</h2>
      <div className="flex flex-col items-center mb-10">
        <div onClick={() => profileImageInputRef.current?.click()} className="relative w-32 h-32 mb-4 group cursor-pointer">
          <div className="w-full h-full rounded-[2.5rem] bg-[#1E1E1E] border-2 border-dashed border-white/20 overflow-hidden flex items-center justify-center group-hover:border-[#C6FF00]">
            {profile?.profileImage ? <img src={profile.profileImage} className="w-full h-full object-cover" /> : <Icons.Upload />}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#C6FF00] text-black p-2 rounded-xl"><Icons.Plus /></div>
          <input type="file" ref={profileImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
        </div>
      </div>
      <div className="space-y-1">
        <Input label={t.name} value={profile?.name || ''} onChange={e => setProfile({...profile!, name: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t.gender} type="select" value={profile?.gender || 'male'} onChange={e => setProfile({...profile!, gender: e.target.value as Gender})} options={[{value:'male', label:t.male}, {value:'female', label:t.female}]} />
          <Input label={t.age} type="number" value={profile?.age || 0} onChange={e => setProfile({...profile!, age: parseInt(e.target.value) || 0})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t.weight} type="number" value={profile?.weight || 0} onChange={e => setProfile({...profile!, weight: parseInt(e.target.value) || 0})} />
          <Input label={t.height} type="number" value={profile?.height || 0} onChange={e => setProfile({...profile!, height: parseInt(e.target.value) || 0})} />
        </div>
        <Input label={t.activity} type="select" value={profile?.activity || 'moderate'} onChange={e => setProfile({...profile!, activity: e.target.value as ActivityLevel})} options={[{value:'sedentary', label:t.sedentary}, {value:'light', label:t.light}, {value:'moderate', label:t.moderate}, {value:'active', label:t.active}, {value:'extra_active', label:t.extra_active}]} />
        <Input label={t.goal} type="select" value={profile?.goal || 'maintain'} onChange={e => setProfile({...profile!, goal: e.target.value as Goal})} options={[{value:'lose', label:t.lose}, {value:'maintain', label:t.maintain}, {value:'gain', label:t.gain}]} />
        <Button className="w-full mt-6" onClick={() => { setProfile({...profile!, dailyLimit: calculateTDEE(profile!)}); setView('trainer_setup'); }} disabled={!profile?.name || !profile.age}>
          {t.continue}
        </Button>
      </div>
    </div>
  );

  if (view === 'trainer_setup') {
    const currentPresets = profile?.gender === 'female' ? ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800'] : ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800'];
    return (
      <div className="p-8 pb-32 overflow-y-auto min-h-screen bg-[#0A0A0A] text-center">
        <h2 className="text-4xl font-black mb-8 italic text-white uppercase">{t.choose_coach}</h2>
        <div className="relative w-48 h-48 mb-6 mx-auto">
          <img src={trainer?.image || currentPresets[0]} className="w-full h-full rounded-[3rem] object-cover border-4 border-[#C6FF00]" />
          <button onClick={() => trainerImageInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-[#C6FF00] text-black p-3 rounded-2xl"><Icons.Plus /></button>
          <input type="file" ref={trainerImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'trainer')} />
        </div>
        <Input label={t.coach_name} value={trainer?.name || ''} onChange={e => setTrainer({...trainer!, name: e.target.value})} />
        <div className="space-y-3 mb-10">
          {(['kind', 'aggressive', 'funny'] as Personality[]).map(p => (
            <div key={p} onClick={() => setTrainer({...trainer!, personality: p})} className={`p-5 rounded-3xl cursor-pointer border-2 transition-all flex items-center justify-between ${trainer?.personality === p ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-white/5 bg-[#121212]'}`}>
              <span className="font-black text-white italic uppercase">{t[p]}</span>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={() => { localStorage.setItem('keecal_profile', JSON.stringify({...profile!, language: appLang})); localStorage.setItem('keecal_trainer', JSON.stringify(trainer!)); setView('main'); }}>{t.start_training}</Button>
      </div>
    );
  }

  const renderHome = () => {
    const todayEntries = history.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString());
    const todayCals = todayEntries.reduce((sum, e) => sum + e.calories, 0);
    const progress = Math.min((todayCals / (profile?.dailyLimit || 2000)) * 100, 100);
    return (
      <div className="p-8 pb-32 overflow-y-auto min-h-screen">
        <header className="flex items-center gap-4 mb-8">
          <img src={trainer?.image} className="w-14 h-14 rounded-2xl object-cover border-2 border-[#C6FF00]" />
          <div className="text-left"><h3 className="font-black text-xl italic text-white uppercase">{trainer?.name}</h3></div>
        </header>
        <Card className="mb-8 text-left">
          <h4 className="text-white/40 text-[10px] font-black uppercase mb-1">{t.daily_intake}</h4>
          <div className="flex items-baseline gap-2 mb-4">
            <span className={`text-5xl font-black italic ${todayCals > (profile?.dailyLimit || 2000) ? 'text-[#FF3D00]' : 'text-white'}`}>{todayCals}</span>
            <span className="text-white/20 font-black text-xl">/ {profile?.dailyLimit}</span>
          </div>
          <div className="w-full bg-[#1E1E1E] h-3 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${todayCals > (profile?.dailyLimit || 2000) ? 'bg-[#FF3D00]' : 'bg-[#C6FF00]'}`} style={{width: `${progress}%`}} />
          </div>
        </Card>
        <div className="grid grid-cols-2 gap-4 mb-10">
          <label className="h-40 bg-[#121212] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            <div className="p-4 rounded-full bg-[#C6FF00]/10 text-[#C6FF00]"><Icons.Camera /></div>
            <span className="font-black italic uppercase text-[10px] tracking-widest text-white/40">{t.snap_food}</span>
          </label>
          <label className="h-40 bg-[#121212] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            <div className="p-4 rounded-full bg-white/5 text-white/40"><Icons.Upload /></div>
            <span className="font-black italic uppercase text-[10px] tracking-widest text-white/40">{t.gallery}</span>
          </label>
        </div>
        <div className="space-y-4">
          {todayEntries.map(entry => (
            <Card key={entry.id} className="flex gap-4 p-4 items-center" onClick={() => setShowResult(entry)}>
              <img src={entry.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
              <div className="flex-1 text-left min-w-0"><div className="font-black text-white text-sm truncate uppercase italic">{entry.name}</div></div>
              <div className="font-black text-[#C6FF00] italic text-xl">{entry.calories}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-[#0A0A0A] text-white relative flex flex-col overflow-hidden shadow-2xl">
      {view === 'landing' && <LandingPage onStart={() => setView('profile_setup')} lang={appLang} setLang={setAppLang} />}
      {view === 'main' && (
        <>
          {currentTab === 'home' && renderHome()}
          {currentTab === 'history' && <div className="p-8 text-center uppercase font-black italic text-white/20">History Coming Soon</div>}
          {currentTab === 'profile' && <div className="p-8 text-center"><Button variant="danger" onClick={() => setShowResetModal(true)}>{t.reset_data}</Button></div>}
          <nav className="absolute bottom-0 left-0 right-0 h-28 bg-[#0A0A0A]/90 backdrop-blur-3xl border-t border-white/5 flex justify-around items-center pb-6">
            <button onClick={() => setCurrentTab('home')} className={currentTab === 'home' ? 'text-[#C6FF00]' : 'text-white/20'}><Icons.Home /></button>
            <button onClick={() => setCurrentTab('history')} className={currentTab === 'history' ? 'text-[#C6FF00]' : 'text-white/20'}><Icons.History /></button>
            <button onClick={() => setCurrentTab('profile')} className={currentTab === 'profile' ? 'text-[#C6FF00]' : 'text-white/20'}><Icons.Profile /></button>
          </nav>
        </>
      )}
      {analyzing && <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-12 text-center text-[#C6FF00] font-black italic uppercase">Analyzing...</div>}
      {showResult && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50 p-8 flex flex-col items-center overflow-y-auto">
          <div className="w-full flex justify-between mb-10"><h2 className="text-3xl font-black italic uppercase">{t.nutrition_analysis}</h2><button onClick={() => setShowResult(null)}>✕</button></div>
          <img src={showResult.imageUrl} className="w-full h-80 rounded-[3rem] object-cover mb-10 shadow-2xl" />
          <div className="text-3xl font-black italic mb-6 uppercase text-[#C6FF00]">{showResult.calories} KCAL</div>
          <div className="text-xl font-black italic mb-10 uppercase">{showResult.name}</div>
          <Card className="mb-10 text-left italic font-bold">"{showResult.trainerComment}"</Card>
          <Button onClick={() => setShowResult(null)} className="w-full">{t.back}</Button>
        </div>
      )}
      {showResetModal && <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8"><Card className="border-2 border-[#FF3D00]"><Button variant="danger" onClick={handleReset} className="mb-4">{t.reset_data}</Button><Button variant="secondary" onClick={() => setShowResetModal(false)}>{t.back}</Button></Card></div>}
    </div>
  );
}

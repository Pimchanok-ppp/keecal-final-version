import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Trainer, FoodEntry, Personality, ActivityLevel, Goal, Gender, Language } from './types';
import { analyzeFoodImage } from './service/geminiService';
import { Icons, COLORS } from './constants';
import { translations } from './translations';

// --- Global UI Components ---

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
  const disabledStyles = "opacity-30 grayscale cursor-not-allowed active:scale-100 shadow-none";
  
  return (
    <button 
      onClick={!disabled ? onClick : undefined} 
      className={`${base} ${variants[variant]} ${disabled ? disabledStyles : ''} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-[#121212] rounded-[2rem] border border-white/5 shadow-2xl p-6 ${className}`}>
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
  autoFocus?: boolean;
}> = ({ label, type = 'text', value, onChange, options, placeholder, autoFocus }) => (
  <div className="flex flex-col gap-2 mb-5 w-full">
    <label className="text-[10px] font-black text-[#C6FF00] ml-1 uppercase tracking-[0.2em]">{label}</label>
    {type === 'select' ? (
      <select 
        value={value} 
        onChange={onChange} 
        className="bg-[#1E1E1E] text-white rounded-2xl p-4 outline-none border border-white/5 focus:border-[#C6FF00] transition-colors appearance-none font-bold"
      >
        {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        value={value === 0 && type === 'number' ? '' : value} 
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="bg-[#1E1E1E] text-white rounded-2xl p-4 outline-none border border-white/5 focus:border-[#C6FF00] transition-colors font-bold placeholder:text-white/20"
      />
    )}
  </div>
);

// --- Sub-pages ---

const LandingPage: React.FC<{ onStart: () => void, lang: Language, setLang: (l: Language) => void }> = ({ onStart, lang, setLang }) => {
  const t = translations[lang];
  return (
    <div className="flex flex-col items-center justify-between h-screen px-8 py-20 text-center bg-[#050505] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-[#C6FF00]/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#C6FF00]/5 blur-[80px] rounded-full" />

      <div className="mt-10 z-10 flex gap-2">
         <button onClick={() => setLang('th')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${lang === 'th' ? 'bg-[#C6FF00] text-black' : 'bg-white/5 text-white/40'}`}>TH</button>
         <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${lang === 'en' ? 'bg-[#C6FF00] text-black' : 'bg-white/5 text-white/40'}`}>EN</button>
      </div>

      <div className="mt-10 z-10">
        <h1 className="text-8xl font-black italic text-white mb-2 tracking-tighter uppercase leading-none">
          {t.landing_title}<span className="text-[#C6FF00]">CAL</span>
        </h1>
        <p className="text-white/40 text-sm font-bold max-w-[250px] mx-auto uppercase tracking-widest leading-relaxed">
          {t.landing_subtitle}
        </p>
      </div>

      <Button onClick={onStart} className="w-full max-w-xs text-xl py-6 z-10">
        {t.landing_btn}
      </Button>
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
  const trainerImageRef = useRef<HTMLInputElement>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);

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
    setProfile({
      name: '', gender: 'male', age: 0, weight: 0, height: 0, 
      activity: 'moderate', goal: 'maintain', dailyLimit: 2000, language: lang,
      profileImage: ''
    });
    setTrainer({
      name: 'Coach Ken', personality: 'kind', 
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop'
    });
  };

  const PRESET_MALE = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&h=800&fit=crop'
  ];

  const PRESET_FEMALE = [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=800&fit=crop'
  ];

  const handleReset = () => {
    localStorage.clear();
    initializeDefaults(appLang);
    setHistory([]);
    setView('landing');
    setShowResetModal(false);
    setCurrentTab('home');
  };

  const handleAddEntry = (entry: FoodEntry) => {
    const newHistory = [entry, ...history];
    setHistory(newHistory);
    localStorage.setItem('keecal_history', JSON.stringify(newHistory));
  };

const handleImageUpload = async (file: File) => {
    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const aiData = await analyzeFoodImage(base64);
        
        const newEntry: FoodEntry = {
          id: Date.now().toString(),
          name: aiData.name,
          calories: aiData.calories,
          nutrition: aiData.nutrition,
          trainerComment: aiData.trainerComment,
          timestamp: new Date().toISOString(),
          image: base64,
          imageUrl: base64
        };
        
        handleAddEntry(newEntry);
        setShowResult(newEntry);
      } catch (error) {
        console.error(error);
        alert("Error: Please check your API Key and connection.");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };
        handleAddEntry(newEntry);
        setShowResult(newEntry);
      } catch (error) {
        console.error(error);
        alert("วิเคราะห์รูปไม่ได้จ้า เช็ค API Key หน่อยนะแม่");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };
  const handleTrainerImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && trainer) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTrainer({ ...trainer, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTDEE = (p: UserProfile) => {
    let bmr = p.gender === 'male' 
      ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
      : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;

    const factors: Record<ActivityLevel, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra_active: 1.9
    };

    let tdee = bmr * factors[p.activity];
    if (p.goal === 'lose') tdee -= 500;
    if (p.goal === 'gain') tdee += 500;
    return Math.round(tdee);
  };

  // --- Views ---

  const renderProfileSetup = () => (
    <div className="p-8 pb-32 overflow-y-auto min-h-screen bg-[#0A0A0A]">
      <h2 className="text-4xl font-black mb-8 italic text-white tracking-tighter uppercase">{t.setup_profile}</h2>
      
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32 mb-4">
          <div className="w-full h-full rounded-full bg-[#1E1E1E] border-2 border-white/10 overflow-hidden flex items-center justify-center">
            {profile?.profileImage ? (
              <img src={profile.profileImage} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <button 
            onClick={() => profileImageRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-[#C6FF00] text-black p-2 rounded-xl shadow-lg active:scale-90 transition-all"
          >
            <Icons.Plus />
          </button>
          <input type="file" ref={profileImageRef} className="hidden" accept="image/*" onChange={handleProfileImageFile} />
        </div>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{t.upload_profile}</p>
      </div>

      <div className="space-y-2">
        <Input label={t.name} value={profile?.name || ''} onChange={e => setProfile({...profile!, name: e.target.value})} placeholder="..." />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t.gender} type="select" value={profile?.gender || 'male'} onChange={e => setProfile({...profile!, gender: e.target.value as Gender})} options={[{value:'male', label:t.male}, {value:'female', label:t.female}]} />
          <Input label={t.age} type="number" value={profile?.age || 0} onChange={e => setProfile({...profile!, age: parseInt(e.target.value) || 0})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t.weight} type="number" value={profile?.weight || 0} onChange={e => setProfile({...profile!, weight: parseInt(e.target.value) || 0})} />
          <Input label={t.height} type="number" value={profile?.height || 0} onChange={e => setProfile({...profile!, height: parseInt(e.target.value) || 0})} />
        </div>
        <Input label={t.activity} type="select" value={profile?.activity || 'moderate'} onChange={e => setProfile({...profile!, activity: e.target.value as ActivityLevel})} options={[
          {value:'sedentary', label:t.sedentary}, {value:'light', label:t.light}, {value:'moderate', label:t.moderate}, {value:'active', label:t.active}, {value:'extra_active', label:t.extra_active}
        ]} />
        <Input label={t.goal} type="select" value={profile?.goal || 'maintain'} onChange={e => setProfile({...profile!, goal: e.target.value as Goal})} options={[
          {value:'lose', label:t.lose}, {value:'maintain', label:t.maintain}, {value:'gain', label:t.gain}
        ]} />
        <Button className="w-full mt-6" onClick={() => {
          const limit = calculateTDEE(profile!);
          setProfile({...profile!, dailyLimit: limit});
          setView('trainer_setup');
        }} disabled={!profile?.name || !profile.age || !profile.weight}>
          {t.continue}
        </Button>
      </div>
    </div>
  );

  const renderTrainerSetup = () => {
    const currentPresets = profile?.gender === 'female' ? PRESET_FEMALE : PRESET_MALE;
    
    return (
      <div className="p-8 pb-32 overflow-y-auto min-h-screen bg-[#0A0A0A]">
        <h2 className="text-4xl font-black mb-8 italic text-white tracking-tighter uppercase">{t.choose_coach}</h2>
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-48 h-48 mb-6">
            <img 
              src={trainer?.image || currentPresets[0]} 
              className="w-full h-full rounded-[3rem] object-cover border-4 border-[#C6FF00] shadow-2xl" 
            />
            <button 
              onClick={() => trainerImageRef.current?.click()}
              className="absolute -bottom-2 -right-2 bg-[#C6FF00] text-black p-3 rounded-2xl shadow-xl active:scale-90 transition-all"
            >
              <Icons.Plus />
            </button>
            <input type="file" ref={trainerImageRef} className="hidden" accept="image/*" onChange={handleTrainerImageFile} />
          </div>

          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 w-full justify-center">
            {currentPresets.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setTrainer({ ...trainer!, image: img })}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${trainer?.image === img ? 'border-[#C6FF00] scale-110 shadow-lg shadow-[#C6FF00]/20' : 'border-transparent opacity-40'}`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <Input label={t.coach_name} value={trainer?.name || ''} onChange={e => setTrainer({...trainer!, name: e.target.value})} />
        </div>

        <div className="space-y-3 mb-10">
          <label className="text-[10px] font-black text-[#C6FF00] ml-1 uppercase tracking-[0.2em]">{t.personality}</label>
          {(['kind', 'aggressive', 'funny'] as Personality[]).map(p => (
            <div 
              key={p} 
              onClick={() => setTrainer({...trainer!, personality: p})}
              className={`p-5 rounded-3xl cursor-pointer border-2 transition-all flex items-center justify-between ${trainer?.personality === p ? 'border-[#C6FF00] bg-[#C6FF00]/5' : 'border-white/5 bg-[#121212]'}`}
            >
              <span className="font-black text-white italic text-lg uppercase">{t[p]}</span>
              <span className="text-2xl">{p === 'kind' ? '✨' : p === 'aggressive' ? '🔥' : '😂'}</span>
            </div>
          ))}
        </div>

        <Button className="w-full" onClick={() => {
          localStorage.setItem('keecal_profile', JSON.stringify({...profile!, language: appLang}));
          localStorage.setItem('keecal_trainer', JSON.stringify(trainer!));
          setView('main');
        }}>
          {t.start_training}
        </Button>
      </div>
    );
  };

  const renderMain = () => {
    const todayEntries = history.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString());
    const todayCals = todayEntries.reduce((sum, e) => sum + e.calories, 0);
    const progress = Math.min((todayCals / (profile?.dailyLimit || 2000)) * 100, 100);

    if (currentTab === 'home') return (
      <div className="p-8 pb-32 overflow-y-auto min-h-screen bg-[#0A0A0A]">
        <header className="flex items-center gap-4 mb-8">
          <img src={trainer?.image} className="w-14 h-14 rounded-2xl object-cover border-2 border-[#C6FF00]" />
          <div>
            <h3 className="font-black text-xl italic text-white uppercase tracking-tighter leading-none">{trainer?.name}</h3>
            <p className="text-[#C6FF00] text-[9px] font-black uppercase tracking-[0.2em] mt-1">{t.personality}: {t[trainer!.personality]}</p>
          </div>
        </header>

        <Card className="mb-8 bg-gradient-to-br from-[#121212] to-[#0A0A0A]">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t.daily_intake}</h4>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-black italic tracking-tighter ${todayCals > (profile?.dailyLimit || 2000) ? 'text-[#FF3D00]' : 'text-white'}`}>{todayCals}</span>
                <span className="text-white/20 font-black text-xl">/ {profile?.dailyLimit}</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-[#1E1E1E] h-3 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${todayCals > (profile?.dailyLimit || 2000) ? 'bg-[#FF3D00]' : 'bg-[#C6FF00]'}`} style={{width: `${progress}%`}} />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <label className="h-40 bg-[#121212] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer group">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            <div className="p-4 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] group-hover:bg-[#C6FF00] group-hover:text-black transition-all"><Icons.Camera /></div>
            <span className="font-black italic uppercase text-[10px] tracking-widest text-white/40 group-hover:text-white">{t.snap_food}</span>
          </label>
          <label className="h-40 bg-[#121212] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all cursor-pointer group">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
            <div className="p-4 rounded-full bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black transition-all"><Icons.Upload /></div>
            <span className="font-black italic uppercase text-[10px] tracking-widest text-white/40 group-hover:text-white">{t.gallery}</span>
          </label>
        </div>

        <h3 className="font-black italic text-xs uppercase tracking-widest text-white/20 mb-6">{t.today_logs}</h3>
        <div className="space-y-4">
          {todayEntries.map(entry => (
            <Card key={entry.id} className="flex gap-4 p-4 items-center bg-[#121212] border-white/5 active:bg-[#1E1E1E] transition-colors">
              <img src={entry.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-sm uppercase truncate italic">{entry.name}</div>
                <div className="text-[9px] font-bold text-white/30 uppercase mt-1">{new Date(entry.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="font-black text-[#C6FF00] italic text-xl">{entry.calories}</div>
            </Card>
          ))}
          {todayEntries.length === 0 && (
            <div className="text-center py-10 opacity-20 font-black italic uppercase text-[10px] tracking-widest">{t.no_activity}</div>
          )}
        </div>
      </div>
    );

    if (currentTab === 'history') return <HistoryPage history={history} lang={appLang} />;
    if (currentTab === 'profile') return <ProfilePage profile={profile!} trainer={trainer!} onReset={() => setShowResetModal(true)} onProfileImageClick={() => profileImageRef.current?.click()} />;
  };

  const getLoadingMessage = () => {
    if (!profile || !trainer) return t.coaching_progress;
    const msgTemplate = t[`loading_${trainer.personality}` as keyof typeof t] || t.coaching_progress;
    return msgTemplate.replace('{name}', profile.name).replace('{trainer}', trainer.name);
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-[#0A0A0A] text-white relative flex flex-col overflow-hidden shadow-2xl">
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
      
      {view === 'landing' && <LandingPage onStart={() => setView('profile_setup')} lang={appLang} setLang={setAppLang} />}
      {view === 'profile_setup' && renderProfileSetup()}
      {view === 'trainer_setup' && renderTrainerSetup()}
      {view === 'main' && renderMain()}

      {analyzing && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center z-50 p-12 text-center">
          <img src={trainer?.image} className="w-32 h-32 rounded-[2.5rem] border-4 border-[#C6FF00] shadow-[0_0_50px_rgba(198,255,0,0.3)] object-cover mb-8" />
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight mb-8">
             {getLoadingMessage()}
          </h2>
          <div className="w-full max-w-xs bg-white/5 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-[#C6FF00] animate-[shimmer_2s_infinite]" style={{ width: '40%' }}></div>
          </div>
        </div>
      )}

      {showResult && (
        <div className="fixed inset-0 bg-[#0A0A0A] z-50 overflow-y-auto p-8 flex flex-col items-center">
          <div className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase">{t.nutrition_analysis}</h2>
              <button onClick={() => setShowResult(null)} className="text-white/40 bg-[#121212] p-4 rounded-3xl hover:text-white transition-all">✕</button>
            </div>
            <div className="relative mb-10">
              <img src={showResult.imageUrl} className="w-full h-80 rounded-[3rem] object-cover shadow-2xl" />
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#C6FF00] text-black px-8 py-3 rounded-2xl font-black italic text-xl shadow-2xl">
                 {showResult.calories} KCAL
              </div>
            </div>
            <div className="text-center mb-8 mt-12">
              <div className="text-2xl font-black italic text-white uppercase">{showResult.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-10">
              <Card className="text-center p-4"><div className="text-[8px] text-white/40 uppercase mb-1">{translations[appLang].protein_short}</div><div className="font-black text-[#C6FF00] text-xl">{showResult.nutrition.protein}g</div></Card>
              <Card className="text-center p-4"><div className="text-[8px] text-white/40 uppercase mb-1">{translations[appLang].carbs_short}</div><div className="font-black text-white text-xl">{showResult.nutrition.carbs}g</div></Card>
              <Card className="text-center p-4"><div className="text-[8px] text-white/40 uppercase mb-1">{translations[appLang].fat_short}</div><div className="font-black text-white text-xl">{showResult.nutrition.fat}g</div></Card>
            </div>
            <div className="bg-[#121212] p-8 rounded-[2.5rem] border border-[#C6FF00]/20 mb-10 shadow-inner">
               <div className="flex items-center gap-3 mb-4">
                  <img src={trainer?.image} className="w-10 h-10 rounded-xl object-cover border border-[#C6FF00]" />
                  <span className="font-black italic text-[#C6FF00] uppercase text-xs">{trainer?.name}</span>
               </div>
               <p className="italic text-lg font-bold text-white/90 leading-relaxed">"{showResult.trainerComment}"</p>
            </div>
            <Button onClick={() => setShowResult(null)} className="w-full py-5 text-lg">{t.back}</Button>
            <div className="h-10"></div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8">
          <Card className="w-full max-w-sm border-2 border-[#FF3D00]">
            <h3 className="text-2xl font-black italic text-white uppercase mb-4 tracking-tighter leading-tight">{t.reset_confirm_1}</h3>
            <p className="text-white/40 text-xs mb-8 uppercase tracking-widest leading-relaxed">{t.reset_confirm_2}</p>
            <div className="flex flex-col gap-3">
              <Button variant="danger" onClick={handleReset}>{t.reset_data}</Button>
              <Button variant="secondary" onClick={() => setShowResetModal(false)}>{t.back}</Button>
            </div>
          </Card>
        </div>
      )}

      {view === 'main' && (
        <nav className="absolute bottom-0 left-0 right-0 h-28 bg-[#0A0A0A]/90 backdrop-blur-3xl border-t border-white/5 flex justify-around items-center px-10 pb-6 z-40">
          <button onClick={() => setCurrentTab('home')} className={`flex flex-col items-center transition-all duration-300 ${currentTab === 'home' ? 'text-[#C6FF00] scale-125' : 'text-white/20'}`}>
            <Icons.Home /><span className="text-[8px] font-black uppercase mt-1 tracking-widest">{t.stats}</span>
          </button>
          <button onClick={() => setCurrentTab('history')} className={`flex flex-col items-center transition-all duration-300 ${currentTab === 'history' ? 'text-[#C6FF00] scale-125' : 'text-white/20'}`}>
            <Icons.History /><span className="text-[8px] font-black uppercase mt-1 tracking-widest">{t.logs}</span>
          </button>
          <button onClick={() => setCurrentTab('profile')} className={`flex flex-col items-center transition-all duration-300 ${currentTab === 'profile' ? 'text-[#C6FF00] scale-125' : 'text-white/20'}`}>
            <Icons.Profile /><span className="text-[8px] font-black uppercase mt-1 tracking-widest">{t.user}</span>
          </button>
        </nav>
      )}

      {/* Hidden inputs for image uploading that can be triggered from anywhere */}
      <input type="file" ref={profileImageRef} className="hidden" accept="image/*" onChange={handleProfileImageFile} />
    </div>
  );
}

// --- Specific Page Components ---

const HistoryPage: React.FC<{ history: FoodEntry[], lang: Language }> = ({ history, lang }) => {
  const t = translations[lang];
  const grouped = history.reduce((acc, curr) => {
    const date = new Date(curr.timestamp).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!acc[date]) acc[date] = { items: [], total: 0 };
    acc[date].items.push(curr);
    acc[date].total += curr.calories;
    return acc;
  }, {} as Record<string, { items: FoodEntry[], total: number }>);

  return (
    <div className="p-8 pb-32 overflow-y-auto min-h-screen bg-[#0A0A0A]">
      <h2 className="text-4xl font-black mb-10 italic text-white tracking-tighter uppercase">{t.activity_history}</h2>
      {Object.entries(grouped).map(([date, data]) => (
        <div key={date} className="mb-10">
          <div className="flex justify-between items-end mb-4 px-2">
            <span className="text-white/30 font-black text-[10px] uppercase tracking-widest">{date}</span>
            <div className="text-right">
               <span className="text-white/40 text-[8px] font-black uppercase block">{t.daily_total}</span>
               <span className="text-[#C6FF00] font-black text-xl italic">{data.total} KCAL</span>
            </div>
          </div>
          <div className="space-y-4">
            {data.items.map(e => (
              <Card key={e.id} className="flex gap-4 p-4 items-center bg-[#121212] border-white/5">
                <img src={e.imageUrl} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white italic text-sm uppercase truncate">{e.name}</div>
                  <div className="text-[8px] font-bold text-white/20 uppercase mt-0.5">{new Date(e.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className="font-black text-[#C6FF00] italic text-lg">{e.calories}</div>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {history.length === 0 && <div className="text-center py-40 opacity-20 font-black italic uppercase tracking-[0.4em] text-xs">{t.no_logs}</div>}
    </div>
  );
};

const ProfilePage: React.FC<{ profile: UserProfile, trainer: Trainer, onReset: () => void, onProfileImageClick: () => void }> = ({ profile, trainer, onReset, onProfileImageClick }) => {
  const t = translations[profile.language];
  return (
    <div className="p-8 pb-32 overflow-y-auto min-h-screen bg-[#0A0A0A]">
      <h2 className="text-4xl font-black mb-10 italic text-white tracking-tighter uppercase">{t.settings}</h2>
      <Card className="mb-6 flex flex-col items-center py-10 bg-[#121212] relative">
        <div 
          onClick={onProfileImageClick}
          className="w-24 h-24 rounded-[2rem] bg-white/5 border-2 border-[#C6FF00] flex items-center justify-center text-4xl mb-4 shadow-xl overflow-hidden cursor-pointer active:scale-95 transition-all"
        >
          {profile.profileImage ? (
            <img src={profile.profileImage} className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </div>
        <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">{profile.name}</h3>
        <p className="text-[#C6FF00] text-[10px] font-black uppercase mt-1 italic tracking-widest">{t[profile.goal]} • {t[profile.activity]}</p>
      </Card>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="text-center py-6 bg-[#121212]"><div className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">{t.body_weight}</div><div className="text-2xl font-black italic text-[#C6FF00]">{profile.weight} kg</div></Card>
        <Card className="text-center py-6 bg-[#121212]"><div className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">{t.height}</div><div className="text-2xl font-black italic text-white">{profile.height} cm</div></Card>
      </div>
      <h3 className="font-black mb-4 italic text-[10px] text-white/40 uppercase tracking-[0.4em] px-2">{t.your_coach}</h3>
      <Card className="mb-10 flex items-center gap-6 bg-[#121212]">
        <img src={trainer.image} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-[#C6FF00] shadow-xl" />
        <div>
          <div className="font-black text-2xl italic uppercase text-white tracking-tighter leading-none mb-2">{trainer.name}</div>
          <div className="text-[10px] font-black text-[#C6FF00] uppercase italic tracking-widest">{t[trainer.personality]}</div>
        </div>
      </Card>
      <Button variant="danger" onClick={onReset} className="w-full py-5 text-sm">{t.reset_data}</Button>
    </div>
  );
};

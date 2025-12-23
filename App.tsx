
import React, { useState, useRef, useEffect } from 'react';
import * as service from './services/geminiService';
import { DeepFormData } from './types';

function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [productionData, setProductionData] = useState<any | null>(null);
  const [storyboard, setStoryboard] = useState<string[]>([]);
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [currentCaption, setCurrentCaption] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const [form, setForm] = useState<DeepFormData>({
    productName: '', audience: '', painPoint: '', features: '', style: 'Cinematic Story', 
    duration: '30s', voiceTone: 'Hào hứng', musicMood: 'Trending TikTok',
    videoConfig: { resolution: '720p', aspectRatio: '9:16' },
    specialReq: ''
  });

  const generateCinematicConcept = async () => {
    setLoading(true);
    setLoadingProgress(10);
    setLoadingStep('Đang biên kịch kịch bản triệu view...');
    try {
      const data = await service.generateAutopilotProduction(form);
      setProductionData(data);
      setLoadingProgress(30);

      setLoadingStep('Đang phác họa Storyboard Cinematic...');
      const images = await Promise.all(
        data.storyboard_prompts.map((p: string) => service.generateVisual(p))
      );
      setStoryboard(images.filter(img => img !== null) as string[]);
      setLoadingProgress(70);

      setLoadingStep('Đang tổng hợp giọng đọc AI...');
      const audio = await service.generateVoiceover(data.blueprint.audio_full, 'Puck');
      setAudioB64(audio);
      setLoadingProgress(100);

    } catch (e) {
      alert("Đã có lỗi xảy ra. Hãy kiểm tra lại API Key hoặc kết nối mạng.");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const stopPreview = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
    setPlayProgress(0);
    setCurrentFrame(0);
  };

  const playPreview = async () => {
    if (!audioB64 || isPlaying) return;
    
    try {
      // Khởi tạo AudioContext sau tương tác người dùng
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      if (ctx.state === 'suspended') await ctx.resume();
      audioContextRef.current = ctx;
      
      const bytes = decode(audioB64);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      sourceNodeRef.current = source;

      const totalDuration = buffer.duration;
      startTimeRef.current = ctx.currentTime;
      setIsPlaying(true);

      const updateSync = () => {
        if (!audioContextRef.current || !isPlaying) return;
        
        const elapsedTime = audioContextRef.current.currentTime - startTimeRef.current;
        const progress = (elapsedTime / totalDuration) * 100;
        
        if (progress >= 100) {
          stopPreview();
          return;
        }

        setPlayProgress(progress);

        // Tìm frame dựa trên thời gian thực tế
        const frameIndex = Math.min(
          Math.floor((elapsedTime / totalDuration) * storyboard.length),
          storyboard.length - 1
        );
        setCurrentFrame(frameIndex);

        // Cập nhật caption
        const scriptStep = productionData.table_script[frameIndex] || productionData.table_script[productionData.table_script.length - 1];
        setCurrentCaption(scriptStep.audio);

        animationFrameRef.current = requestAnimationFrame(updateSync);
      };

      source.onended = () => {
        setIsPlaying(false);
      };

      source.start(0);
      animationFrameRef.current = requestAnimationFrame(updateSync);

    } catch (err) {
      console.error("Audio Playback Error:", err);
      alert("Không thể phát âm thanh. Hãy thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-tiktok-pink">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl">
           <div className="w-16 h-16 border-4 border-tiktok-pink border-t-transparent rounded-full animate-spin mb-8"></div>
           <div className="text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-tiktok-pink animate-pulse mb-2">{loadingStep}</p>
             <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-tiktok-pink transition-all duration-300" style={{width: `${loadingProgress}%`}}></div>
             </div>
           </div>
        </div>
      )}

      {/* Top Nav */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/50 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-tiktok-pink to-tiktok-cyan rounded-xl flex items-center justify-center font-black text-white shadow-lg">V8</div>
          <h1 className="text-sm font-black uppercase tracking-widest">Viral Studio <span className="text-tiktok-pink">Pro Sync</span></h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter bg-white/5 px-4 py-2 rounded-full border border-white/10">
             Mode: <span className="text-tiktok-cyan">Cinematic Preview</span>
           </div>
           <button onClick={() => (window as any).aistudio?.openSelectKey()} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-all">⚙️ API KEY</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-6 grid grid-cols-12 gap-12">
        {/* Sidebar Input */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-tiktok-pink rounded-full animate-pulse"></div>
               <h2 className="text-xs font-black uppercase tracking-widest text-tiktok-pink">Tham số kịch bản</h2>
            </div>
            <div className="space-y-4">
              <input 
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-tiktok-pink transition-all outline-none" 
                placeholder="Tên sản phẩm (VD: Son môi Matte)..."
                value={form.productName}
                onChange={e => setForm({...form, productName: e.target.value})}
              />
              <textarea 
                className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm h-32 focus:border-tiktok-pink transition-all outline-none" 
                placeholder="Vấn đề khách hàng gặp phải là gì?..."
                value={form.painPoint}
                onChange={e => setForm({...form, painPoint: e.target.value})}
              />
              <select className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm" value={form.style} onChange={e => setForm({...form, style: e.target.value})}>
                <option>Cinematic Story</option>
                <option>Review thực tế</option>
                <option>Drama kịch tính</option>
              </select>
            </div>
            <button 
              onClick={generateCinematicConcept}
              className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-tiktok-pink hover:text-white transition-all shadow-xl active:scale-95"
            >
              Phát hành Video Concept
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
            <p className="text-[10px] font-bold text-tiktok-cyan uppercase">ℹ️ Lưu ý quan trọng</p>
            <p className="text-[11px] leading-relaxed text-gray-500 italic">
              Bản **Free** sử dụng hệ thống Concept Sync (Đồng bộ Storyboard + AI Voice). <br/><br/>
              Nếu bạn cần video chuyển động thực (AI Video), hãy đảm bảo API Key đã được kích hoạt thanh toán tại ai.google.dev.
            </p>
          </div>
        </div>

        {/* Studio Player */}
        <div className="col-span-12 lg:col-span-8">
           {productionData ? (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                {/* Cinematic Player */}
                <div className="relative aspect-[9/16] max-w-[360px] mx-auto bg-black rounded-[3.5rem] border-[14px] border-[#0a0a0a] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden group">
                   {storyboard.length > 0 ? (
                      <div className="w-full h-full relative">
                         {/* Timeline Bar */}
                         <div className="absolute top-8 left-0 right-0 z-20 px-4 h-[2px] flex gap-1">
                            {storyboard.map((_, i) => (
                              <div key={i} className="h-full flex-1 bg-white/20 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-white transition-all duration-100" 
                                    style={{ width: currentFrame === i ? `${(playProgress % (100 / storyboard.length)) * storyboard.length}%` : (currentFrame > i ? '100%' : '0%') }}
                                 ></div>
                              </div>
                            ))}
                         </div>

                         {/* Image with Ken Burns effect */}
                         <img 
                            key={currentFrame}
                            src={storyboard[currentFrame]} 
                            className={`w-full h-full object-cover transition-all duration-[4000ms] ease-out ${isPlaying ? 'scale-110 translate-y-2 blur-[1px]' : 'scale-100'}`} 
                         />
                         
                         {/* Vignette Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>

                         {/* Caption Overlay */}
                         <div className="absolute inset-x-0 bottom-24 px-10 py-8 z-10">
                            <p className="text-sm font-bold text-center leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] italic text-white/90">
                               {currentCaption || 'Bấm Play để bắt đầu'}
                            </p>
                         </div>

                         {/* Interaction Overlays */}
                         <div className="absolute right-4 bottom-48 flex flex-col gap-8 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                            <div className="flex flex-col items-center gap-1">
                               <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-xl shadow-xl">❤️</div>
                               <span className="text-[10px] font-bold">1.2M</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-xl shadow-xl">💬</div>
                               <span className="text-[10px] font-bold">84k</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-xl shadow-xl">🔗</div>
                               <span className="text-[10px] font-bold">Chia sẻ</span>
                            </div>
                         </div>

                         {/* Main Play Button */}
                         {!isPlaying && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] z-30">
                              <button 
                                onClick={playPreview} 
                                className="w-24 h-24 bg-white/90 text-black rounded-full text-3xl shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                              >
                                <span>▶</span>
                              </button>
                           </div>
                         )}
                         {isPlaying && (
                            <div className="absolute inset-0 z-20 cursor-pointer" onClick={stopPreview}></div>
                         )}
                      </div>
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a]">
                         <div className="w-12 h-12 border-4 border-white/5 border-t-tiktok-pink rounded-full animate-spin"></div>
                         <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-gray-700">Loading Storyboard...</p>
                      </div>
                   )}
                </div>

                {/* Script Details */}
                <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <h3 className="text-[10px] font-black uppercase text-tiktok-pink tracking-widest">Kịch bản chi tiết</h3>
                         <p className="text-[11px] text-gray-500 uppercase tracking-tighter">Đồng bộ chính xác theo dòng thời gian</p>
                      </div>
                      <button className="text-[9px] font-bold text-white bg-white/5 border border-white/10 px-6 py-2 rounded-full hover:bg-white/10 transition-all uppercase tracking-widest">Sao chép kịch bản</button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {productionData.table_script.map((s: any, i: number) => (
                        <div key={i} className={`p-6 rounded-[2rem] border transition-all duration-500 ${currentFrame === i ? 'bg-tiktok-pink/10 border-tiktok-pink shadow-lg shadow-tiktok-pink/5 scale-105' : 'bg-white/5 border-white/5 opacity-50'}`}>
                           <div className="flex items-center justify-between mb-3">
                              <p className="text-[9px] font-black text-tiktok-pink uppercase">{s.timestamp}</p>
                              {currentFrame === i && isPlaying && <div className="w-1 h-1 bg-tiktok-pink rounded-full animate-ping"></div>}
                           </div>
                           <p className="text-xs font-bold leading-relaxed">{s.audio}</p>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-[700px] border-2 border-dashed border-white/5 rounded-[5rem] flex flex-col items-center justify-center group">
                <div className="text-[120px] mb-8 grayscale group-hover:grayscale-0 transition-all duration-700 opacity-20 group-hover:opacity-100">🎬</div>
                <h2 className="text-xl font-black uppercase tracking-[0.6em] text-white/20 group-hover:text-white/100 transition-all">Viral Studio V8</h2>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-700">Hãy nhập dữ liệu sản phẩm để bắt đầu đạo diễn</p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;

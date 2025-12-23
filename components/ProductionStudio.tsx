
import React, { useState } from 'react';
import { generateVisual, generateTikTokVideo } from '../services/geminiService';

interface Props {
  script: string;
}

export const ProductionStudio: React.FC<Props> = ({ script }) => {
  const [characterImg, setCharacterImg] = useState<string | null>(null);
  const [sceneImg, setSceneImg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ char: boolean; scene: boolean; video: boolean }>({
    char: false,
    scene: false,
    video: false
  });

  const extractDesc = (tag: string) => {
    const regex = new RegExp(`\\[${tag}\\]:?\\s*(.*?)(?=\\n|$)`, 'i');
    const match = script.match(regex);
    return match ? match[1].trim() : null;
  };

  const handleGenChar = async () => {
    const desc = extractDesc('CHARACTER');
    if (!desc) return alert("Không tìm thấy mô tả nhân vật trong kịch bản.");
    setLoading(prev => ({ ...prev, char: true }));
    try {
      // Fix: generateVisual expects only 1 argument
      const img = await generateVisual(`Character: ${desc}`);
      setCharacterImg(img);
    } catch (e) { alert("Lỗi khi tạo ảnh nhân vật."); }
    finally { setLoading(prev => ({ ...prev, char: false })); }
  };

  const handleGenScene = async () => {
    const desc = extractDesc('SCENE');
    if (!desc) return alert("Không tìm thấy mô tả bối cảnh trong kịch bản.");
    setLoading(prev => ({ ...prev, scene: true }));
    try {
      // Fix: generateVisual expects only 1 argument
      const img = await generateVisual(`Environment/Background: ${desc}`);
      setSceneImg(img);
    } catch (e) { alert("Lỗi khi tạo ảnh bối cảnh."); }
    finally { setLoading(prev => ({ ...prev, scene: false })); }
  };

  const handleGenVideo = async () => {
    const aistudio = (window as any).aistudio;
    
    // Check if key is selected. If not, open dialog and assume success to proceed (mitigate race condition)
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      await aistudio.openSelectKey();
      // Proceed immediately after triggering the dialog as per instructions
    }
    
    const charDesc = extractDesc('CHARACTER') || "";
    const sceneDesc = extractDesc('SCENE') || "";
    const prompt = `Vertical cinematic social media video. ${charDesc}. ${sceneDesc}. Fast paced editing style. High quality production value.`;
    
    setLoading(prev => ({ ...prev, video: true }));
    try {
      // Corrected call to generateTikTokVideo with required config arguments
      const op = await generateTikTokVideo(prompt, { resolution: '720p', aspectRatio: '9:16' });
      // Extract video URI from the operation response
      const downloadLink = op.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoUrl(`${downloadLink}&key=${process.env.API_KEY}`);
      } else {
        throw new Error("Không nhận được URL video.");
      }
    } catch (e: any) { 
      console.error("Caught error in ProductionStudio:", e);
      
      // Robust error checking for the 404 "Requested entity was not found" message
      const errorString = typeof e === 'string' ? e : (e.message || JSON.stringify(e));
      
      if (errorString.includes("Requested entity was not found")) {
        alert("Lỗi 404: Không tìm thấy Model hoặc Quyền truy cập. Điều này thường xảy ra khi bạn chưa chọn Khóa API từ một dự án Google Cloud có trả phí (Paid Project). Hãy chọn lại khóa API hợp lệ.");
        if (aistudio) {
          await aistudio.openSelectKey();
        }
      } else {
        alert("Đã xảy ra lỗi khi sản xuất video. Hãy đảm bảo bạn đang sử dụng API Key có quyền truy cập mô hình Veo.");
      }
    }
    finally { setLoading(prev => ({ ...prev, video: false })); }
  };

  return (
    <div className="space-y-8 mt-6 border-t pt-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">🎬 Studio Sản Xuất Visual</h2>
        <p className="text-gray-500">Tự động tạo nhân vật, bối cảnh và video từ kịch bản của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Character Card */}
        <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">👤 Nhân Vật</h3>
            <button 
              onClick={handleGenChar}
              disabled={loading.char}
              className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading.char ? 'Đang tạo...' : 'Tạo Concept'}
            </button>
          </div>
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
            {characterImg ? (
              <img src={characterImg} className="w-full h-full object-cover" alt="Character Concept" />
            ) : (
              <span className="text-gray-400 text-sm text-center px-4">Bấm nút trên để tạo concept nhân vật từ kịch bản</span>
            )}
          </div>
        </div>

        {/* Scene Card */}
        <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2">🌆 Bối Cảnh</h3>
            <button 
              onClick={handleGenScene}
              disabled={loading.scene}
              className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {loading.scene ? 'Đang tạo...' : 'Tạo Concept'}
            </button>
          </div>
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200">
            {sceneImg ? (
              <img src={sceneImg} className="w-full h-full object-cover" alt="Scene Concept" />
            ) : (
              <span className="text-gray-400 text-sm text-center px-4">Bấm nút trên để tạo concept bối cảnh từ kịch bản</span>
            )}
          </div>
        </div>
      </div>

      {/* Video Production Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-indigo-900">🚀 Final Production: AI Video</h3>
            <p className="text-indigo-700 text-sm max-w-lg mx-auto mb-2">Sử dụng mô hình Veo 3.1 để tạo đoạn video mẫu dựa trên kịch bản.</p>
            <p className="text-xs text-indigo-400 italic mb-4">Yêu cầu: API Key từ dự án có bật Billing tại <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">ai.google.dev/gemini-api/docs/billing</a></p>
          </div>
          
          {videoUrl ? (
            <div className="w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl mx-auto">
              <video src={videoUrl} controls className="w-full h-full" autoPlay loop />
            </div>
          ) : (
            <button 
              onClick={handleGenVideo}
              disabled={loading.video}
              className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading.video ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang sản xuất video (có thể tốn 1-3 phút)...
                </>
              ) : (
                <><span>🎥</span> Bắt đầu tạo video AI hoàn thiện</>
              )}
            </button>
          )}

          {loading.video && (
            <div className="text-sm text-indigo-500 animate-pulse font-medium text-center">
              Hệ thống đang xử lý khung hình... <br/>Vui lòng giữ trình duyệt mở trong khi AI làm việc.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

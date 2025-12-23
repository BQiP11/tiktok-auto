
import React, { useState } from 'react';
import { FactoryMode, DeepFormData } from '../types';
import { generateScript } from '../services/geminiService';

interface Props {
  onResult: (result: string) => void;
  setLoading: (loading: boolean) => void;
}

export const ScriptFactory: React.FC<Props> = ({ onResult, setLoading }) => {
  const [mode, setMode] = useState<FactoryMode>('instant');
  const [instantInput, setInstantInput] = useState('');
  const [deepForm, setDeepForm] = useState<DeepFormData>({
    productName: '',
    audience: '',
    painPoint: '',
    features: '',
    style: 'Review thực tế',
    specialReq: '',
  });

  const handleInstantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantInput) return;
    setLoading(true);
    try {
      const res = await generateScript(`Tạo ngay 3 kịch bản cực nhanh cho sản phẩm: ${instantInput}. Sử dụng cấu trúc kịch bản yêu cầu.`);
      onResult(res.content);
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo kịch bản.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const prompt = `
[MẪU NHẬP LIỆU]
Tên sản phẩm/Dịch vụ: ${deepForm.productName}
Đối tượng khách hàng: ${deepForm.audience}
Nỗi đau (Pain point): ${deepForm.painPoint}
Ưu điểm nổi bật: ${deepForm.features}
Phong cách video: ${deepForm.style}
Yêu cầu đặc biệt: ${deepForm.specialReq}

Hãy viết kịch bản chi tiết dựa trên thông tin trên.
    `;
    try {
      const res = await generateScript(prompt);
      onResult(res.content);
    } catch (err) {
      alert("Đã xảy ra lỗi khi tạo kịch bản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button 
          onClick={() => setMode('instant')}
          className={`px-4 py-2 rounded-md transition ${mode === 'instant' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Mì ăn liền
        </button>
        <button 
          onClick={() => setMode('deep')}
          className={`px-4 py-2 rounded-md transition ${mode === 'deep' ? 'bg-white shadow-sm text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Chuyên sâu
        </button>
      </div>

      {mode === 'instant' ? (
        <form onSubmit={handleInstantSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm/Dịch vụ</label>
            <input 
              type="text" 
              placeholder="VD: Máy pha cà phê mini"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={instantInput}
              onChange={(e) => setInstantInput(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
          >
            Ra ngay 3 kịch bản cực nhanh
          </button>
        </form>
      ) : (
        <form onSubmit={handleDeepSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm/Dịch vụ</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={deepForm.productName}
              onChange={(e) => setDeepForm({...deepForm, productName: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng khách hàng</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={deepForm.audience}
              onChange={(e) => setDeepForm({...deepForm, audience: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nỗi đau (Pain point)</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={deepForm.painPoint}
              onChange={(e) => setDeepForm({...deepForm, painPoint: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ưu điểm nổi bật</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={deepForm.features}
              onChange={(e) => setDeepForm({...deepForm, features: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phong cách video</label>
            <select 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={deepForm.style}
              onChange={(e) => setDeepForm({...deepForm, style: e.target.value as any})}
            >
              <option>Hài hước</option>
              <option>Drama</option>
              <option>Review thực tế</option>
              <option>Sang chảnh</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu đặc biệt</label>
            <input 
              type="text" 
              placeholder="VD: Sử dụng ngôn ngữ Gen Z, dưới 30s"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={deepForm.specialReq}
              onChange={(e) => setDeepForm({...deepForm, specialReq: e.target.value})}
            />
          </div>
          <div className="md:col-span-2 mt-2">
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
            >
              Tạo kịch bản chi tiết từng khung hình
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

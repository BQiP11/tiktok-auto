
import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';

interface Props {
  onResult: (result: string) => void;
  setLoading: (loading: boolean) => void;
}

export const HeadlineWizard: React.FC<Props> = ({ onResult, setLoading }) => {
  const [idea, setIdea] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea) return;
    setLoading(true);
    try {
      // Fix: Removed the extra second argument 'headline' from generateScript call to match function signature
      const res = await generateScript(`Hãy tạo 10 câu tiêu đề "không thể không bấm vào" cho ý tưởng: ${idea}`);
      onResult(res.content);
    } catch (err) {
      alert("Lỗi khi tạo tiêu đề.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhập ý tưởng video của bạn</label>
          <textarea 
            rows={3}
            placeholder="VD: Cách kiếm 10 triệu đầu tiên từ Shopee Affiliate..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <span>✨</span> Phù thủy tiêu đề xuất chiêu
        </button>
      </form>
    </div>
  );
};

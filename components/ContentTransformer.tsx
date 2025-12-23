
import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';

interface Props {
  onResult: (result: string) => void;
  setLoading: (loading: boolean) => void;
}

export const ContentTransformer: React.FC<Props> = ({ onResult, setLoading }) => {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setLoading(true);
    try {
      // Fix: Removed the extra second argument 'transform' from generateScript call to match function signature
      const res = await generateScript(`Chuyển đổi nội dung sau đây thành kịch bản video ngắn triệu view: \n\n${content}`);
      onResult(res.content);
    } catch (err) {
      alert("Lỗi khi chuyển đổi nội dung.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dán bài viết, nội dung dài hoặc tóm tắt link báo</label>
          <textarea 
            rows={8}
            placeholder="Dán nội dung vào đây để AI biến hình thành kịch bản video..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg transition"
        >
          Chuyển đổi thành kịch bản Viral
        </button>
      </form>
    </div>
  );
};

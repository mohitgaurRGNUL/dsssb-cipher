
import React, { useEffect } from 'react';
import type { Question } from '../types';

interface DetailsModalProps {
  question: Question | null;
  onClose: () => void;
}

const renderContent = (text: string, imageBase64: string) => {
    let content = '';
    if (text) {
        content += `<pre class="whitespace-pre-wrap font-sans">${text}</pre>`;
    }
    if (imageBase64 && imageBase64.startsWith('data:image')) {
        content += `<img src="${imageBase64}" alt="Content" class="max-w-full h-auto rounded-lg mt-2 border border-gray-200">`;
    }
    return content || '(No content)';
};

const DetailsModal: React.FC<DetailsModalProps> = ({ question, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Details for Paper {question.paperNumber} - Q#{question.questionNumber}</h2>
          <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Subject:</strong> {question.subject}</p>
            <p><strong>Topic:</strong> {question.topic}</p>
            <p><strong>Subtopic:</strong> {question.subtopic}</p>
          </div>
          <div>
            <p className="font-bold">Question:</p>
            <div dangerouslySetInnerHTML={{ __html: renderContent(question.questionText, question.questionImage) }} />
          </div>
          <hr/>
          <div>
            <p className="font-bold">Options:</p>
            <div className="space-y-2">
              {['A', 'B', 'C', 'D'].map(opt => {
                const isCorrect = question.correctOption === opt;
                const optKey = opt.toLowerCase() as keyof Question['options'];
                const text = question.options[optKey];
                const image = question[`option${opt}Image` as keyof Question] as string;
                return (
                  <div key={opt} className={`p-3 border rounded-lg ${isCorrect ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200'}`}>
                    <strong className={isCorrect ? 'text-green-700' : ''}>Option {opt}:</strong>
                    <div dangerouslySetInnerHTML={{ __html: renderContent(text, image) }} />
                  </div>
                );
              })}
            </div>
          </div>
          {question.correctAnswerText && (
            <>
              <hr />
              <div>
                <p className="font-bold">Explanation:</p>
                <div dangerouslySetInnerHTML={{ __html: renderContent(question.correctAnswerText, '') }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;

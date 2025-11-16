
import React, { useState, useEffect } from 'react';
import type { Question } from '../types';

interface ReviewPanelProps {
  questions: Question[];
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

const ReviewPanel: React.FC<ReviewPanelProps> = ({ questions, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (questions.length > 0) {
      setCurrentQuestion(questions[currentIndex]);
      setShowAnswer(false);
    } else {
        onClose();
    }
  }, [currentIndex, questions, onClose]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      alert('Review session complete!');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  if (!currentQuestion) return null;

  const progress = ((currentIndex + 1) / questions.length) * 100;

  const getAnswerContent = () => {
    let content = '';
    const correctOpt = currentQuestion.correctOption;
    if (correctOpt) {
      content += `<p><strong>Correct Option: ${correctOpt}</strong></p>`;
      const optKey = correctOpt.toLowerCase() as keyof Question['options'];
      const optText = currentQuestion.options[optKey];
      const optImage = currentQuestion[`option${correctOpt}Image` as keyof Question] as string;
      if (optText || optImage) {
        content += renderContent(optText, optImage);
      }
    }
    if (currentQuestion.correctAnswerText) {
      content += `<hr class="my-2"><p><strong>Explanation:</strong></p>${renderContent(currentQuestion.correctAnswerText, '')}`;
    }
    return content || `<p><strong>Correct Option: ${correctOpt}</strong></p><p>(No answer details provided.)</p>`;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-gray-200 shadow-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <button onClick={onClose} className="absolute top-0 right-0 text-2xl text-gray-500 hover:text-gray-800">&times;</button>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[200px] text-left text-lg mb-4">
            <div className="bg-indigo-50 p-3 rounded-lg mb-4 text-sm">
                <p className="m-0"><strong>Subject:</strong> {currentQuestion.subject}</p>
                <p className="m-0"><strong>Topic:</strong> {currentQuestion.topic}</p>
                <p className="m-0"><strong>Subtopic:</strong> {currentQuestion.subtopic}</p>
            </div>
            <div className="font-semibold mb-4" dangerouslySetInnerHTML={{ __html: renderContent(currentQuestion.questionText, currentQuestion.questionImage) }} />
            <ul className="list-none p-0 space-y-3">
              <li dangerouslySetInnerHTML={{ __html: `A) ${renderContent(currentQuestion.options.a, currentQuestion.optionAImage)}` }} />
              <li dangerouslySetInnerHTML={{ __html: `B) ${renderContent(currentQuestion.options.b, currentQuestion.optionBImage)}` }} />
              <li dangerouslySetInnerHTML={{ __html: `C) ${renderContent(currentQuestion.options.c, currentQuestion.optionCImage)}` }} />
              <li dangerouslySetInnerHTML={{ __html: `D) ${renderContent(currentQuestion.options.d, currentQuestion.optionDImage)}` }} />
            </ul>
            {showAnswer && (
              <div className="border-t border-dashed border-gray-300 mt-4 pt-4 text-green-700 font-semibold" dangerouslySetInnerHTML={{ __html: getAnswerContent() }} />
            )}
          </div>
          <div className="flex justify-center items-center gap-4">
            {!showAnswer ? (
              <button onClick={() => setShowAnswer(true)} className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700">Show Answer</button>
            ) : (
              <div className="flex w-full justify-between items-center">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="px-6 py-3 font-semibold text-white bg-yellow-500 rounded-lg shadow-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed">&larr; Previous</button>
                <span className="font-semibold text-gray-700">{currentIndex + 1} / {questions.length}</span>
                <button onClick={handleNext} className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700">{currentIndex === questions.length - 1 ? 'Finish' : 'Next'} &rarr;</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPanel;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question } from './types';
import Header from './components/Header';
import Stats from './components/Stats';
import QuestionForm from './components/QuestionForm';
import BatchImport from './components/BatchImport';
import QuestionTable from './components/QuestionTable';
import ReviewPanel from './components/ReviewPanel';
import DetailsModal from './components/DetailsModal';

const STORAGE_KEY = 'cuetPgCipherData';

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [filteredQuestionsCount, setFilteredQuestionsCount] = useState(0);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setQuestions(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [questions]);

  const stats = useMemo(() => {
    return {
      total: questions.length,
      filtered: filteredQuestionsCount,
    };
  }, [questions, filteredQuestionsCount]);

  const handleAddOrUpdateQuestion = useCallback((formData: Question) => {
    setQuestions(prev => {
        const uniqueId = `${formData.paperNumber}-${formData.questionNumber}`;
        const existingIndex = prev.findIndex(q => `${q.paperNumber}-${q.questionNumber}` === uniqueId);

        if (editingQuestion) { // We are in update mode
            const editingId = `${editingQuestion.paperNumber}-${editingQuestion.questionNumber}`;
            const originalIndex = prev.findIndex(q => `${q.paperNumber}-${q.questionNumber}` === editingId);
            
            if (originalIndex === -1) return prev; 

            if (uniqueId !== editingId && existingIndex !== -1) {
                alert(`Error: A question with Paper ${formData.paperNumber} and Q# ${formData.questionNumber} already exists.`);
                return prev;
            }
            const updatedQuestions = [...prev];
            updatedQuestions[originalIndex] = {
                ...prev[originalIndex], 
                ...formData
            };
            return updatedQuestions.sort((a, b) => (Number(a.paperNumber) - Number(b.paperNumber)) || (Number(a.questionNumber) - Number(b.questionNumber)));
        } else { // We are in add mode
            if (existingIndex !== -1) {
                if (window.confirm(`Question ${formData.questionNumber} from Paper ${formData.paperNumber} already exists. Overwrite?`)) {
                    const updatedQuestions = [...prev];
                    updatedQuestions[existingIndex] = formData;
                    return updatedQuestions.sort((a, b) => (Number(a.paperNumber) - Number(b.paperNumber)) || (Number(a.questionNumber) - Number(b.questionNumber)));
                }
                return prev;
            }
            return [...prev, formData].sort((a, b) => (Number(a.paperNumber) - Number(b.paperNumber)) || (Number(a.questionNumber) - Number(b.questionNumber)));
        }
    });
    setEditingQuestion(null);
  }, [editingQuestion]);
  

  const handleCancelEdit = useCallback(() => {
    setEditingQuestion(null);
  }, []);

  const handleBatchImport = useCallback((importedQuestions: any[]) => {
    let addedCount = 0;
    let overwrittenCount = 0;
    
    setQuestions(prev => {
      const questionsMap = new Map(prev.map(q => [`${q.paperNumber}-${q.questionNumber}`, q]));

      importedQuestions.forEach((q: any) => {
        if (!q.paperNumber || !q.questionNumber) return; // Skip invalid entries
        const uniqueId = `${q.paperNumber}-${q.questionNumber}`;

        const newQuestionData: Question = {
            paperNumber: String(q.paperNumber),
            questionNumber: String(q.questionNumber),
            subject: q.subject || '',
            topic: q.topic || '',
            subtopic: q.subtopic || '',
            subheading: q.subheading || '',
            questionText: q.questionText || '',
            questionImage: q.questionImage || '',
            options: {
                a: q.options?.a || '',
                b: q.options?.b || '',
                c: q.options?.c || '',
                d: q.options?.d || '',
            },
            optionAImage: q.optionAImage || '',
            optionBImage: q.optionBImage || '',
            optionCImage: q.optionCImage || '',
            optionDImage: q.optionDImage || '',
            correctOption: (q.correctOption as 'A' | 'B' | 'C' | 'D' | '') || '',
            correctAnswerText: q.correctAnswerText || '',
            reviewStatus: 'new'
        };

        if (questionsMap.has(uniqueId)) {
            overwrittenCount++;
        } else {
            addedCount++;
        }
        questionsMap.set(uniqueId, newQuestionData);
      });
      
      console.log(`Batch Import: Added ${addedCount}, Overwritten ${overwrittenCount}`);
      setTimeout(() => alert(`Batch Import Complete. Added: ${addedCount}, Overwritten: ${overwrittenCount}`), 100);
      
      return Array.from(questionsMap.values()).sort((a, b) => (Number(a.paperNumber) - Number(b.paperNumber)) || (Number(a.questionNumber) - Number(b.questionNumber)));
    });

  }, []);

  const onDelete = (uniqueId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
        setQuestions(prev => prev.filter(q => `${q.paperNumber}-${q.questionNumber}` !== uniqueId));
    }
  };

  const onDeleteSelected = (uniqueIds: string[]) => {
      setQuestions(prev => prev.filter(q => !uniqueIds.includes(`${q.paperNumber}-${q.questionNumber}`)));
  };

  const onDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete ALL questions? This cannot be undone.')) {
        setQuestions([]);
        localStorage.removeItem(STORAGE_KEY);
    }
  };

  const onEdit = (question: Question) => {
      setEditingQuestion(question);
  };

  const onView = (question: Question) => {
      setViewingQuestion(question);
  };

  const onImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;
        
        const rows = text.split('\n');
        
        const imported: any[] = [];
        
        for(let i=1; i<rows.length; i++) {
            if(!rows[i].trim()) continue;
            // Handle CSV parsing with quotes
            const rowData: string[] = [];
            let current = '';
            let inQuote = false;
            for(let j=0; j<rows[i].length; j++) {
                const char = rows[i][j];
                if(char === '"') {
                    if(inQuote && rows[i][j+1] === '"') {
                        current += '"';
                        j++;
                    } else {
                        inQuote = !inQuote;
                    }
                } else if(char === ',' && !inQuote) {
                    rowData.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            rowData.push(current);

            if(rowData.length < 2) continue;

            imported.push({
                paperNumber: rowData[0],
                questionNumber: rowData[1],
                subject: rowData[2],
                topic: rowData[3],
                subtopic: rowData[4],
                subheading: rowData[5],
                questionText: rowData[6],
                options: {
                    a: rowData[7],
                    b: rowData[8],
                    c: rowData[9],
                    d: rowData[10],
                },
                correctOption: rowData[11],
                correctAnswerText: rowData[12],
                questionImage: rowData[13],
                optionAImage: rowData[14],
                optionBImage: rowData[15],
                optionCImage: rowData[16],
                optionDImage: rowData[17],
            });
        }
        handleBatchImport(imported);
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        <Header />
        <Stats total={stats.total} filtered={stats.filtered} />
        
        <QuestionForm 
            onSubmit={handleAddOrUpdateQuestion} 
            onCancelEdit={handleCancelEdit} 
            editingQuestion={editingQuestion} 
        />
        
        <BatchImport onImport={handleBatchImport} />
        
        <QuestionTable 
            questions={questions}
            onDelete={onDelete}
            onDeleteSelected={onDeleteSelected}
            onDeleteAll={onDeleteAll}
            onView={onView}
            onEdit={onEdit}
            onImportCSV={onImportCSV}
            filteredQuestionsCount={filteredQuestionsCount}
            setFilteredQuestionsCount={setFilteredQuestionsCount}
            onStartReview={setReviewQuestions}
        />
        
        {reviewQuestions.length > 0 && (
            <ReviewPanel 
                questions={reviewQuestions} 
                onClose={() => setReviewQuestions([])} 
            />
        )}
        
        {viewingQuestion && (
            <DetailsModal 
                question={viewingQuestion} 
                onClose={() => setViewingQuestion(null)} 
            />
        )}
      </div>
    </div>
  );
};

export default App;
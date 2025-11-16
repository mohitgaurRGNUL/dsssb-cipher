
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Question } from './types';
import Header from './components/Header';
import Stats from './components/Stats';
import QuestionForm from './components/QuestionForm';
import BatchImport from './components/BatchImport';
import QuestionTable from './components/QuestionTable';
import ReviewPanel from './components/ReviewPanel';
import DetailsModal from './components/DetailsModal';

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [filteredQuestionsCount, setFilteredQuestionsCount] = useState(0);

  useEffect(() => {
    try {
      const data = localStorage.getItem('dsssbExamAnalysisV5_Images');
      if (data) {
        setQuestions(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('dsssbExamAnalysisV5_Images', JSON.stringify(questions));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [questions]);

  const stats = useMemo(() => {
    return {
      total: questions.length,
      sectionA: questions.filter(q => q.section === 'Section A').length,
      sectionB: questions.filter(q => q.section === 'Section B').length,
    };
  }, [questions]);

  const handleAddOrUpdateQuestion = useCallback((formData: Question) => {
    setQuestions(prev => {
        const uniqueId = `${formData.paperNumber}-${formData.questionNumber}`;
        const existingIndex = prev.findIndex(q => `${q.paperNumber}-${q.questionNumber}` === uniqueId);

        if (editingQuestion) { // We are in update mode
            const editingId = `${editingQuestion.paperNumber}-${editingQuestion.questionNumber}`;
            const originalIndex = prev.findIndex(q => `${q.paperNumber}-${q.questionNumber}` === editingId);
            if (originalIndex === -1) return prev; // Should not happen

            if (uniqueId !== editingId && existingIndex !== -1) {
                alert(`Error: A question with Paper ${formData.paperNumber} and Q# ${formData.questionNumber} already exists.`);
                return prev;
            }
            const updatedQuestions = [...prev];
            updatedQuestions[originalIndex] = {
                ...prev[originalIndex], // Preserve review stats
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

  // FIX: Changed parameter type from `any[]` to `Partial<Question>[]` for better type safety.
  const handleBatchImport = useCallback((importedQuestions: Partial<Question>[]) => {
    let addedCount = 0;
    let overwrittenCount = 0;
    
    setQuestions(prev => {
      const questionsMap = new Map(prev.map(q => [`${q.paperNumber}-${q.questionNumber}`, q]));

      importedQuestions.forEach(q => {
        if (!q.paperNumber || !q.questionNumber) return; // Skip invalid entries
        const uniqueId = `${q.paperNumber}-${q.questionNumber}`;

        const newQuestionData: Question = {
            paperNumber: q.paperNumber,
            questionNumber: q.questionNumber,
            section: q.section || '',
            subject: q.subject || '',
            topic: q.topic || '',
            subtopic: q.subtopic || 'N/A',
            questionText: q.questionText || '',
            questionImage: q.questionImage || '',
            options: q.options || { a: '', b: '', c: '', d: '' },
            optionAImage: q.optionAImage || '',
            optionBImage: q.optionBImage || '',
            optionCImage: q.optionCImage || '',
            optionDImage: q.optionDImage || '',
            correctOption: q.correctOption || '',
            correctAnswerText: q.correctAnswerText || '',
        };

        // FIX: Added a check for existingQuestion to prevent spreading undefined, which would cause a runtime error.
        if (questionsMap.has(uniqueId)) {
          const existingQuestion = questionsMap.get(uniqueId);
          if (existingQuestion) {
            questionsMap.set(uniqueId, { ...existingQuestion, ...newQuestionData });
            overwrittenCount++;
          }
        } else {
          questionsMap.set(uniqueId, newQuestionData);
          addedCount++;
        }
      });
      return Array.from(questionsMap.values()).sort((a, b) => (Number(a.paperNumber) - Number(b.paperNumber)) || (Number(a.questionNumber) - Number(b.questionNumber)));
    });

    alert(`Batch import complete!\nAdded: ${addedCount} new questions.\nOverwritten: ${overwrittenCount} existing questions.`);
  }, []);

  const handleDelete = useCallback((uniqueId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => `${q.paperNumber}-${q.questionNumber}` !== uniqueId));
    }
  }, []);

  const handleDeleteSelected = useCallback((uniqueIds: string[]) => {
    setQuestions(prev => prev.filter(q => !uniqueIds.includes(`${q.paperNumber}-${q.questionNumber}`)));
  }, []);
  
  const handleDeleteAll = useCallback(() => {
    if (window.confirm('ARE YOU SURE you want to delete ALL questions? This cannot be undone.')) {
        setQuestions([]);
    }
  }, []);

  const handleImportCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.replace(/^"|"$/g, '').trim());
        const colMap: { [key: string]: number } = {};
        headers.forEach((h, i) => colMap[h] = i);
        // ... (rest of CSV parsing logic)
        const imported = rows.slice(1).map(rowStr => {
           const cols = rowStr.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(field => field.replace(/^"|"$/g, ''));
           return {
                paperNumber: cols[colMap['Paper Number']] || '',
                questionNumber: cols[colMap['Question Number']] || '',
                section: cols[colMap['Section']] || '',
                subject: cols[colMap['Subject']] || '',
                topic: cols[colMap['Topic']] || '',
                subtopic: cols[colMap['Subtopic']] || 'N/A',
                questionText: cols[colMap['Question Text']] || '',
                options: {
                    a: cols[colMap['Option A']] || '', b: cols[colMap['Option B']] || '',
                    c: cols[colMap['Option C']] || '', d: cols[colMap['Option D']] || ''
                },
                correctOption: cols[colMap['Correct Option']] as Question['correctOption'] || '',
                correctAnswerText: cols[colMap['Correct Answer Text']] || '',
                questionImage: cols[colMap['Question Image']] || '',
                optionAImage: cols[colMap['Option A Image']] || '',
                optionBImage: cols[colMap['Option B Image']] || '',
                optionCImage: cols[colMap['Option C Image']] || '',
                optionDImage: cols[colMap['Option D Image']] || '',
           } as Question;
        }).filter(q => q.paperNumber && q.questionNumber); // Basic validation
        if(window.confirm(`Found ${imported.length} questions. Overwrite existing data?`)){
          setQuestions(imported.sort((a, b) => (Number(a.paperNumber) - Number(b.paperNumber)) || (Number(a.questionNumber) - Number(b.questionNumber))));
          alert('Data imported!');
        }
      } catch (error) {
        console.error(error);
        alert('Failed to import CSV.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleStartReview = useCallback((questionsToReview: Question[]) => {
    if (questionsToReview.length > 0) {
        setReviewQuestions(questionsToReview);
    } else {
        alert('No questions match the current filters for review.');
    }
  }, []);

  return (
    <div className="bg-gradient-to-br from-indigo-400 to-purple-500 min-h-screen text-gray-800 font-sans">
      <main className="container mx-auto p-4 md:p-8">
        <Header />
        <Stats total={stats.total} sectionA={stats.sectionA} sectionB={stats.sectionB} filtered={filteredQuestionsCount} />
        <QuestionForm onSubmit={handleAddOrUpdateQuestion} onCancelEdit={handleCancelEdit} editingQuestion={editingQuestion} />
        <BatchImport onImport={handleBatchImport} />
        <QuestionTable
          questions={questions}
          onDelete={handleDelete}
          onDeleteSelected={handleDeleteSelected}
          onDeleteAll={handleDeleteAll}
          onView={setViewingQuestion}
          onEdit={setEditingQuestion}
          onImportCSV={handleImportCSV}
          filteredQuestionsCount={filteredQuestionsCount}
          setFilteredQuestionsCount={setFilteredQuestionsCount}
          onStartReview={handleStartReview}
        />
      </main>
      {viewingQuestion && <DetailsModal question={viewingQuestion} onClose={() => setViewingQuestion(null)} />}
      {reviewQuestions.length > 0 && <ReviewPanel questions={reviewQuestions} onClose={() => setReviewQuestions([])} />}
    </div>
  );
};

export default App;


import React, { useState, useMemo, useEffect } from 'react';
import type { Question } from '../types';
import { syllabusStructure } from '../constants';

interface QuestionTableProps {
  questions: Question[];
  onDelete: (uniqueId: string) => void;
  onDeleteSelected: (uniqueIds: string[]) => void;
  onDeleteAll: () => void;
  onView: (question: Question) => void;
  onEdit: (question: Question) => void;
  onImportCSV: (file: File) => void;
  filteredQuestionsCount: number;
  setFilteredQuestionsCount: (count: number) => void;
  onStartReview: (questions: Question[]) => void;
}

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info' }> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400',
    info: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
  };
  return <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>{children}</button>;
};


const QuestionTable: React.FC<QuestionTableProps> = ({
  questions, onDelete, onDeleteSelected, onDeleteAll, onView, onEdit, onImportCSV, setFilteredQuestionsCount, onStartReview
}) => {
  const [filters, setFilters] = useState({ paper: '', subject: '', topic: '', subtopic: '', subheading: '', keyword: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const csvInputRef = React.useRef<HTMLInputElement>(null);

  const filterOptions = useMemo(() => {
    const papers = [...new Set(questions.map(q => q.paperNumber))].sort((a, b) => Number(a) - Number(b));
    const subjects = Object.keys(syllabusStructure).sort();
    
    let topics: string[] = [];
    let subtopics: string[] = [];
    let subheadings: string[] = [];
    
    if (filters.subject) {
      topics = Object.keys(syllabusStructure[filters.subject] || {}).sort();
    }
    
    if (filters.subject && filters.topic) {
         subtopics = Object.keys(syllabusStructure[filters.subject][filters.topic] || {}).sort();
    }

    if (filters.subject && filters.topic && filters.subtopic) {
         subheadings = syllabusStructure[filters.subject][filters.topic][filters.subtopic] || [];
    }

    return { papers, subjects, topics, subtopics, subheadings };
  }, [questions, filters.subject, filters.topic, filters.subtopic]);

  const filteredData = useMemo(() => {
    return questions.filter(q => {
      const keyword = filters.keyword.toLowerCase();
      const keywordMatch = !keyword ||
        q.questionNumber.toString().toLowerCase().includes(keyword) ||
        (q.questionText && q.questionText.toLowerCase().includes(keyword)) ||
        (q.subject && q.subject.toLowerCase().includes(keyword)) ||
        (q.topic && q.topic.toLowerCase().includes(keyword)) ||
        (q.subtopic && q.subtopic.toLowerCase().includes(keyword)) ||
        (q.subheading && q.subheading.toLowerCase().includes(keyword)) ||
        (q.options.a && q.options.a.toLowerCase().includes(keyword)) ||
        (q.options.b && q.options.b.toLowerCase().includes(keyword)) ||
        (q.options.c && q.options.c.toLowerCase().includes(keyword)) ||
        (q.options.d && q.options.d.toLowerCase().includes(keyword)) ||
        (q.correctAnswerText && q.correctAnswerText.toLowerCase().includes(keyword));
        
      return (
        (!filters.paper || q.paperNumber === filters.paper) &&
        (!filters.subject || q.subject === filters.subject) &&
        (!filters.topic || q.topic === filters.topic) &&
        (!filters.subtopic || q.subtopic === filters.subtopic) &&
        (!filters.subheading || q.subheading === filters.subheading) &&
        keywordMatch
      );
    });
  }, [questions, filters]);
  
  useEffect(() => {
    setFilteredQuestionsCount(filteredData.length);
  }, [filteredData, setFilteredQuestionsCount]);


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
        const newFilters = {...prev, [name]: value};
        if(name === 'subject') {
            newFilters.topic = '';
            newFilters.subtopic = '';
            newFilters.subheading = '';
        }
        if(name === 'topic') {
            newFilters.subtopic = '';
            newFilters.subheading = '';
        }
        if(name === 'subtopic') {
            newFilters.subheading = '';
        }
        return newFilters;
    });
  };

  const handleSelect = (uniqueId: string) => {
    setSelectedIds(prev =>
      prev.includes(uniqueId) ? prev.filter(id => id !== uniqueId) : [...prev, uniqueId]
    );
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map(q => `${q.paperNumber}-${q.questionNumber}`));
      setIsAllSelected(true);
    } else {
      setSelectedIds([]);
      setIsAllSelected(false);
    }
  };

  useEffect(() => {
    setIsAllSelected(filteredData.length > 0 && selectedIds.length === filteredData.length);
  }, [selectedIds, filteredData]);


  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert('Please select questions to delete.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected questions?`)) {
      onDeleteSelected(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleImportClick = () => {
    csvInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportCSV(e.target.files[0]);
      e.target.value = ''; // Reset for re-uploading same file
    }
  };
  
  const copyMetadata = () => {
    const questionsToCopy = questions.filter(q => selectedIds.includes(`${q.paperNumber}-${q.questionNumber}`));
    if (questionsToCopy.length === 0) {
      alert('Please select questions to copy metadata.');
      return;
    }
    let metadataText = `Go through the selected source carefully. Based on the metadata and the question text, generate 10 most important questions that are most likely to appear in future exams.\n\n🔹 Your Task:\nAnalyze the metadata + question text.\nIdentify the most exam-relevant questions.\nPresent them in the flashcard format shown below.\n\n📘 Flashcard Creation Instructions\nInput: Educational text (paragraph, notes, or previous question).\nProcessing: Read line by line.\nOutput: For each line, generate multiple-choice flashcards with:\nOne question (Q:)\nFour answer choices (A, B, C, D)\nThe correct answer marked at the end with |\n\n📑 Flashcard Format Example\nInput Line:\nWe can tell something is alive if it moves on its own.\n\nFlashcards Output:\nQ: How do we tell the difference between what is alive and what is not alive?\nA. By their size\nB. By their color\nC. By their movement\nD. By their sound | C. By their movement\n\n🛠 Rules You Must Follow\nGenerate 10 most important exam questions (not explanations).\nOnly one correct option per question.\nOptions should be slightly confusing but with one correct answer.\nStay within the subject, topic, subtopic, and subheading mentioned in the metadata.\n\nNow, based on the following metadata and question text, generate the output:\n\n`;
    questionsToCopy.forEach((q, index) => {
        metadataText += `--- Metadata Example ${index + 1} ---\n`;
        metadataText += `Paper: ${q.paperNumber}\n`;
        metadataText += `Question #: ${q.questionNumber}\n`;
        metadataText += `Subject: ${q.subject}\n`;
        metadataText += `Topic: ${q.topic}\n`;
        metadataText += `Subtopic: ${q.subtopic}\n`;
        metadataText += `Subheading: ${q.subheading}\n`;
        metadataText += `Question: ${q.questionText || '(Image Question)'}\n`;
        metadataText += `Correct Option: ${q.correctOption}\n`;
        metadataText += `Explanation: ${q.correctAnswerText || 'N/A'}\n\n`;
    });

    navigator.clipboard.writeText(metadataText).then(() => {
        alert(`Metadata for ${questionsToCopy.length} questions copied to clipboard with retrieval tool prompt!`);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy metadata.');
    });
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToCSV = (data: Question[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export!');
      return;
    }
    const headers = ['Paper Number', 'Question Number', 'Subject', 'Topic', 'Subtopic', 'Subheading', 'Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Correct Answer Text', 'Question Image', 'Option A Image', 'Option B Image', 'Option C Image', 'Option D Image'];
    const escapeCSV = (val: any) => {
        if (val === undefined || val === null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    const rows = data.map(q => [q.paperNumber, q.questionNumber, q.subject, q.topic, q.subtopic, q.subheading, q.questionText, q.options.a, q.options.b, q.options.c, q.options.d, q.correctOption, q.correctAnswerText, q.questionImage, q.optionAImage, q.optionBImage, q.optionCImage, q.optionDImage].map(escapeCSV).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile('\uFEFF' + csvContent, filename, 'text/csv;charset=utf-8;');
  };

  const exportFlashcards = (data: Question[], filename: string) => {
    if (data.length === 0) {
        alert('No data to export!');
        return;
    }
    const renderContentForTxt = (text: string, imageBase64: string) => {
      let content = text ? text.replace(/;/g, ',').replace(/\n/g, '<br>') : '';
      if (imageBase64 && imageBase64.startsWith('data:image')) {
        content += `<br><img src="${imageBase64}">`;
      }
      return content;
    }
    const txtContent = data.map(q => {
        let front = renderContentForTxt(q.questionText, q.questionImage);
        front += '<br><br>';
        front += `A) ${renderContentForTxt(q.options.a, q.optionAImage)}<br>`;
        front += `B) ${renderContentForTxt(q.options.b, q.optionBImage)}<br>`;
        front += `C) ${renderContentForTxt(q.options.c, q.optionCImage)}<br>`;
        front += `D) ${renderContentForTxt(q.options.d, q.optionDImage)}`;
        
        const correctOptKey = q.correctOption.toLowerCase() as keyof Question['options'];
        const correctOptText = q.options[correctOptKey];
        const correctOptImage = q[`option${q.correctOption}Image` as keyof Question] as string;

        let back = `Correct Option: ${q.correctOption}<br>`;
        back += renderContentForTxt(correctOptText, correctOptImage);

        if(q.correctAnswerText){
            back += `<br><br><b>Explanation:</b><br>${renderContentForTxt(q.correctAnswerText, '')}`;
        }

        return `${front};${back}`;
    }).join('\n');

    downloadFile(txtContent, filename, 'text/plain;charset=utf-8;');
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-6 bg-gray-800 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Question Log</h2>
        <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={handleDeleteSelected}>Delete Selected</Button>
            <Button variant="danger" onClick={onDeleteAll}>Delete All</Button>
            <Button variant="info" onClick={copyMetadata}>Copy Metadata</Button>
            <input type="file" ref={csvInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <Button variant="warning" onClick={handleImportClick}>Import CSV</Button>
            <Button variant="success" onClick={() => exportToCSV(questions, 'cuet_full.csv')}>Export All CSV</Button>
            <Button variant="success" onClick={() => exportToCSV(filteredData, 'cuet_filtered.csv')}>Export Filtered CSV</Button>
            <Button variant="success" onClick={() => exportFlashcards(filteredData, 'flashcards_import.txt')}>Export .txt</Button>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 border-b border-gray-200">
          <select name="paper" value={filters.paper} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"><option value="">All Papers</option>{filterOptions.papers.map(p => <option key={p} value={p}>Paper {p}</option>)}</select>
          <select name="subject" value={filters.subject} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"><option value="">All Subjects</option>{filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select name="topic" value={filters.topic} onChange={handleFilterChange} disabled={!filters.subject} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"><option value="">All Topics</option>{filterOptions.topics.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <select name="subtopic" value={filters.subtopic} onChange={handleFilterChange} disabled={!filters.topic} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"><option value="">All Subtopics</option>{filterOptions.subtopics.map(st => <option key={st} value={st}>{st}</option>)}</select>
          <select name="subheading" value={filters.subheading} onChange={handleFilterChange} disabled={!filters.subtopic} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"><option value="">All Subheadings</option>{filterOptions.subheadings.map(sh => <option key={sh} value={sh}>{sh}</option>)}</select>
          <input type="text" name="keyword" placeholder="Search by Keyword or Q#" value={filters.keyword} onChange={handleFilterChange} className="sm:col-span-2 xl:col-span-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          <Button onClick={() => onStartReview(filteredData)} disabled={filteredData.length === 0} className="sm:col-span-2 xl:col-span-1 w-full">Start Review</Button>
      </div>
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-4"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
              <th className="px-6 py-3">Paper#</th>
              <th className="px-6 py-3">Q#</th>
              <th className="px-6 py-3">Subject</th>
              <th className="px-6 py-3">Topic</th>
              <th className="px-6 py-3">Subtopic</th>
              <th className="px-6 py-3">Subheading</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(q => {
              const uniqueId = `${q.paperNumber}-${q.questionNumber}`;
              return (
                <tr key={uniqueId} className="bg-white border-b hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" checked={selectedIds.includes(uniqueId)} onChange={() => handleSelect(uniqueId)} /></td>
                  <td className="px-6 py-4">{q.paperNumber}</td>
                  <td className="px-6 py-4">{q.questionNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{q.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{q.topic}</td>
                  <td className="px-6 py-4 whitespace-nowrap max-w-[150px] truncate" title={q.subtopic}>{q.subtopic}</td>
                  <td className="px-6 py-4 whitespace-nowrap max-w-[150px] truncate" title={q.subheading}>{q.subheading}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => onView(q)} className="font-medium text-indigo-600 hover:underline">View</button>
                    <button onClick={() => onEdit(q)} className="font-medium text-yellow-600 hover:underline">Edit</button>
                    <button onClick={() => onDelete(uniqueId)} className="font-medium text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionTable;

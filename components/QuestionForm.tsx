
import React, { useState, useEffect, useCallback } from 'react';
import type { Question } from '../types';
import { syllabusStructure } from '../constants';

interface QuestionFormProps {
  onSubmit: (question: Question) => void;
  onCancelEdit: () => void;
  editingQuestion: Question | null;
}

const emptyQuestion: Question = {
  paperNumber: '', questionNumber: '', section: '', subject: '', topic: '', subtopic: '',
  questionText: '', questionImage: '', options: { a: '', b: '', c: '', d: '' },
  optionAImage: '', optionBImage: '', optionCImage: '', optionDImage: '',
  correctOption: '', correctAnswerText: ''
};

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-sans resize-vertical" />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition bg-white" />
);

const QuestionForm: React.FC<QuestionFormProps> = ({ onSubmit, onCancelEdit, editingQuestion }) => {
  const [formData, setFormData] = useState<Question>(emptyQuestion);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);

  const populateForm = useCallback((question: Question | null) => {
    if (question) {
      setFormData(question);
      const newSubjects = Object.keys(syllabusStructure[question.section] || {});
      setSubjects(newSubjects);
      const newTopics = Object.keys(syllabusStructure[question.section]?.[question.subject] || {});
      setTopics(newTopics);
      const newSubtopics = syllabusStructure[question.section]?.[question.subject]?.[question.topic] || [];
      setSubtopics(newSubtopics);
    } else {
      setFormData(emptyQuestion);
      setSubjects([]);
      setTopics([]);
      setSubtopics([]);
    }
  }, []);
  
  useEffect(() => {
    populateForm(editingQuestion);
  }, [editingQuestion, populateForm]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('option_')) {
        const optionKey = name.split('_')[1] as keyof Question['options'];
        setFormData(prev => ({...prev, options: { ...prev.options, [optionKey]: value } }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (formData.section) {
        setSubjects(Object.keys(syllabusStructure[formData.section] || {}));
        if(!editingQuestion || formData.section !== editingQuestion.section) {
            setFormData(prev => ({...prev, subject: '', topic: '', subtopic: ''}));
        }
    } else {
        setSubjects([]);
    }
  }, [formData.section, editingQuestion]);

  useEffect(() => {
    if (formData.section && formData.subject) {
        setTopics(Object.keys(syllabusStructure[formData.section]?.[formData.subject] || {}));
        if(!editingQuestion || formData.subject !== editingQuestion.subject) {
             setFormData(prev => ({...prev, topic: '', subtopic: ''}));
        }
    } else {
        setTopics([]);
    }
  }, [formData.subject, formData.section, editingQuestion]);
  
  useEffect(() => {
    if (formData.section && formData.subject && formData.topic) {
        setSubtopics(syllabusStructure[formData.section]?.[formData.subject]?.[formData.topic] || []);
        if(!editingQuestion || formData.topic !== editingQuestion.topic) {
            setFormData(prev => ({...prev, subtopic: ''}));
        }
    } else {
        setSubtopics([]);
    }
  }, [formData.topic, formData.subject, formData.section, editingQuestion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields: (keyof Question)[] = ['paperNumber', 'questionNumber', 'section', 'subject', 'topic', 'correctOption'];
    for (const field of requiredFields) {
      if (!formData[field] && !(field === 'subtopic' && formData[field] === 'N/A')) {
        alert(`Please fill in the '${field}' field.`);
        return;
      }
    }
    if (!formData.questionText && !formData.questionImage) {
      alert('Please provide either Question Text or a Question Image.');
      return;
    }
    onSubmit(formData);
  };

  const formRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if(editingQuestion) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingQuestion]);
  

  return (
    <div ref={formRef} className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl mb-8 shadow-2xl scroll-mt-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{editingQuestion ? `Editing Paper ${editingQuestion.paperNumber} - Q# ${editingQuestion.questionNumber}` : 'Add Single Question'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Paper Number</label><FormInput type="number" name="paperNumber" value={formData.paperNumber} onChange={handleChange} min="1" max="12" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Question Number</label><FormInput type="number" name="questionNumber" value={formData.questionNumber} onChange={handleChange} min="1" max="200" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <FormSelect name="section" value={formData.section} onChange={handleChange} required>
              <option value="">Select Section</option><option value="Section A">Section A</option><option value="Section B">Section B</option>
            </FormSelect>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <FormSelect name="subject" value={formData.subject} onChange={handleChange} required disabled={!formData.section}>
              <option value="">Select Subject</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <FormSelect name="topic" value={formData.topic} onChange={handleChange} required disabled={!formData.subject}>
              <option value="">Select Topic</option>{topics.map(t => <option key={t} value={t}>{t}</option>)}
            </FormSelect>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Subtopic</label>
            <FormSelect name="subtopic" value={formData.subtopic} onChange={handleChange} required disabled={!formData.topic}>
              <option value="">Select Subtopic</option>{subtopics.map(st => <option key={st} value={st}>{st}</option>)}
            </FormSelect>
          </div>
        </div>

        <div><label className="block text-sm font-medium text-gray-700 mb-1">Question Text (Optional)</label><FormTextarea name="questionText" value={formData.questionText} onChange={handleChange} rows={3} placeholder="Enter the full question text here..." /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Question Image Base64 (Optional)</label><FormTextarea name="questionImage" value={formData.questionImage} onChange={handleChange} rows={3} placeholder="Paste Base64 for question image (e.g., data:image/png;base64,iVBO...)..." /></div>

        {['A', 'B', 'C', 'D'].map(opt => (
          <div key={opt} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Option {opt} Text (Optional)</label><FormInput type="text" name={`option_${opt.toLowerCase()}`} value={formData.options[opt.toLowerCase() as keyof typeof formData.options]} onChange={handleChange} placeholder={`Text for option ${opt}`} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Option {opt} Image Base64 (Optional)</label><FormTextarea name={`option${opt}Image`} value={formData[`option${opt}Image` as keyof Question] as string} onChange={handleChange} rows={2} placeholder={`Paste Base64 for option ${opt}...`} /></div>
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Correct Option</label>
              <FormSelect name="correctOption" value={formData.correctOption} onChange={handleChange} required>
                <option value="">Select Correct Option</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </FormSelect>
            </div>
             <div className="md:col-span-1"><label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer Explanation (Optional)</label><FormTextarea name="correctAnswerText" value={formData.correctAnswerText} onChange={handleChange} rows={2} placeholder="Enter an explanation..." /></div>
        </div>
        
        <div className="flex items-center gap-4">
          <button type="submit" className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform duration-200 hover:-translate-y-0.5">
            {editingQuestion ? 'Update Question' : 'Add Question'}
          </button>
          {editingQuestion && (
            <button type="button" onClick={onCancelEdit} className="px-6 py-3 font-semibold text-white bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-transform duration-200 hover:-translate-y-0.5">
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;

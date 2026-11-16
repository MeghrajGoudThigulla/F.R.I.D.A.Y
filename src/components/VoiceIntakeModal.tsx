// F.R.I.D.A.Y - Voice / Chat Guided Intake Modal (PRD v2.0 Flow A / PRD v4.0 Tier 1)
import React, { useState } from 'react';
import { Mic, MicOff, X, Send, Sparkles, CheckCircle2 } from 'lucide-react';

interface VoiceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (answers: Record<string, string>) => void;
}

const QUESTIONS = [
  { id: 'q1', title: 'Target Role & Domain', prompt: 'What specific role, trade, or job title are you targeting?' },
  { id: 'q2', title: 'Work History & Experience', prompt: 'Tell me about the recent jobs, roles, or major projects you have worked on.' },
  { id: 'q3', title: 'Credentials & Equipment', prompt: 'What active licenses, certifications, machines, or software tools do you operate?' },
  { id: 'q4', title: 'Key Accomplishments', prompt: 'What is your proudest work accomplishment or quantifiable result?' },
  { id: 'q5', title: 'Work Parameters', prompt: 'What are your work authorization status, shift preferences, or location constraints?' }
];

export const VoiceIntakeModal: React.FC<VoiceIntakeModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');

  if (!isOpen) return null;

  const currentQ = QUESTIONS[currentStep];

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(answers);
      onClose();
    }
  };

  const handleSpeechToggle = () => {
    // Check Web Speech API availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError('Speech recognition is not supported in this browser. Please type your response below.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setRecognitionError('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAnswers(prev => ({
          ...prev,
          [currentQ.id]: prev[currentQ.id] ? `${prev[currentQ.id]} ${transcript}` : transcript
        }));
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        setRecognitionError(`Speech error: ${event.error}. You can also type freely.`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e: any) {
      setRecognitionError('Could not start speech recognition: ' + e.message);
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel-glow rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Step {currentStep + 1} of {QUESTIONS.length}
            </span>
            <h3 className="text-lg font-bold text-white">{currentQ.title}</h3>
          </div>
          <div className="flex gap-1.5">
            {QUESTIONS.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i === currentStep
                    ? 'bg-cyan-400 ring-2 ring-cyan-400/40'
                    : i < currentStep
                    ? 'bg-emerald-400'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question Prompt */}
        <div className="mb-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <p className="text-slate-200 text-sm font-medium leading-relaxed">
            "{currentQ.prompt}"
          </p>
        </div>

        {/* Input & Voice Controls */}
        <div className="space-y-3">
          <textarea
            value={answers[currentQ.id]}
            onChange={e => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
            placeholder="Type your response here or click the microphone to speak aloud..."
            rows={4}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />

          {recognitionError && (
            <p className="text-xs text-amber-400">{recognitionError}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSpeechToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Listening... (Speak Now)' : 'Speak Response (Mic)'}</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!answers[currentQ.id]?.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-600/20"
            >
              <span>{currentStep === QUESTIONS.length - 1 ? 'Build Structured Profile' : 'Next Question'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

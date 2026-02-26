import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Copy, Trash2, Check, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('ar-SA');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('متصفحك لا يدعم تحويل الصوت إلى نص. يرجى استخدام متصفح مثل Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript + ' ';
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (currentFinal) {
        setFinalText((prev) => prev + currentFinal);
      }
      setInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setError('تم رفض الوصول إلى الميكروفون. يرجى السماح للمتصفح باستخدام الميكروفون.');
        setIsRecording(false);
      } else if (event.error !== 'no-speech') {
        setError(`حدث خطأ: ${event.error}`);
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if it was supposed to be recording (e.g., paused by browser)
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition', e);
        }
      }
    };

    recognitionRef.current = recognition;

    // If it was recording when language changed, restart it with new language
    if (isRecordingRef.current) {
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start recognition on language change', e);
      }
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [language]);

  const toggleRecording = () => {
    setError(null);
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start recording', e);
        setError('حدث خطأ أثناء محاولة بدء التسجيل.');
      }
    }
  };

  const clearText = () => {
    setFinalText('');
    setInterimText('');
  };

  const copyToClipboard = async () => {
    const textToCopy = finalText + interimText;
    if (!textToCopy) return;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f9fa] text-neutral-900 font-sans selection:bg-emerald-200">
      <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-6 shadow-sm">
            <Mic className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            محول الصوت إلى نص
          </h1>
          <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
            تحدث بحرية وسنقوم بتحويل كلامك إلى نص مكتوب بدقة عالية. يدعم اللغتين العربية والإنجليزية.
          </p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Controls */}
          <div className="p-4 md:p-6 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={toggleRecording}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all duration-300 w-full sm:w-auto ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 scale-[0.98]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 hover:-translate-y-0.5'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5 fill-current" />
                    <span>إيقاف التسجيل</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>بدء التسجيل</span>
                  </>
                )}
              </button>

              {isRecording && (
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-medium animate-pulse border border-red-100">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  جاري الاستماع...
                </div>
              )}
            </div>

            <div className="flex items-center p-1.5 bg-neutral-100 rounded-2xl w-full sm:w-auto">
              <button
                onClick={() => setLanguage('ar-SA')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  language === 'ar-SA'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => setLanguage('en-US')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  language === 'en-US'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div 
            className="p-6 md:p-8 min-h-[400px] relative"
            dir={language === 'ar-SA' ? 'rtl' : 'ltr'}
          >
            {!finalText && !interimText && !isRecording && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 pointer-events-none">
                <Mic className="w-16 h-16 mb-6 opacity-10" />
                <p className="text-lg font-medium">اضغط على "بدء التسجيل" وتحدث للبدء</p>
              </div>
            )}
            
            <div className="text-2xl md:text-3xl leading-relaxed md:leading-relaxed whitespace-pre-wrap font-medium">
              <span className="text-neutral-900">{finalText}</span>
              <span className="text-neutral-400">{interimText}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 md:p-6 border-t border-neutral-100 bg-neutral-50/50 flex flex-wrap justify-end gap-3">
            <button
              onClick={clearText}
              disabled={!finalText && !interimText}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              <span>مسح النص</span>
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!finalText && !interimText}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed border ${
                copied 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ النص'}</span>
            </button>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-neutral-400 text-sm">
          <p>ملاحظة: تعتمد دقة التحويل على جودة الميكروفون ووضوح الصوت.</p>
        </footer>
      </div>
    </div>
  );
}

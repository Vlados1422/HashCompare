import { useState, useCallback, useRef } from 'react';
import CryptoJS from 'crypto-js';

interface HashResult {
  fileName: string;
  fileSize: string;
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

interface ManualHash {
  label: string;
  value: string;
}

type TabType = 'files' | 'manual' | 'guide';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [hashResults, setHashResults] = useState<HashResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [manualHashes, setManualHashes] = useState<ManualHash[]>([
    { label: 'Хэш 1', value: '' },
    { label: 'Хэш 2', value: '' },
  ]);
  const [compareResult, setCompareResult] = useState<'match' | 'mismatch' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const computeHashes = useCallback(async (file: File): Promise<HashResult> => {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);

    const md5 = CryptoJS.MD5(wordArray).toString();
    const sha1 = CryptoJS.SHA1(wordArray).toString();
    const sha256 = CryptoJS.SHA256(wordArray).toString();
    const sha512 = CryptoJS.SHA512(wordArray).toString();

    return {
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      md5,
      sha1,
      sha256,
      sha512,
    };
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    const results: HashResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await computeHashes(files[i]);
      results.push(result);
    }

    setHashResults((prev) => [...prev, ...results]);
    setIsProcessing(false);
  }, [computeHashes]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const clearResults = () => {
    setHashResults([]);
  };

  const removeResult = (index: number) => {
    setHashResults((prev) => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleManualCompare = () => {
    const h1 = manualHashes[0]?.value.trim().toLowerCase();
    const h2 = manualHashes[1]?.value.trim().toLowerCase();

    if (!h1 || !h2) {
      setCompareResult(null);
      return;
    }

    setCompareResult(h1 === h2 ? 'match' : 'mismatch');
  };

  const addManualHash = () => {
    setManualHashes((prev) => [...prev, { label: `Хэш ${prev.length + 1}`, value: '' }]);
  };

  const removeManualHash = (index: number) => {
    if (manualHashes.length > 2) {
      setManualHashes((prev) => prev.filter((_, i) => i !== index));
      setCompareResult(null);
    }
  };

  const updateManualHash = (index: number, value: string) => {
    setManualHashes((prev) => prev.map((h, i) => (i === index ? { ...h, value } : h)));
    setCompareResult(null);
  };

  const checkAllMatch = () => {
    const values = manualHashes.map((h) => h.value.trim().toLowerCase()).filter(Boolean);
    if (values.length < 2) return null;
    const first = values[0];
    return values.every((v) => v === first) ? 'match' : 'mismatch';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              HashCompare
            </h1>
            <p className="text-xs text-gray-400">Сравнение хэшей файлов и приложений</p>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex flex-col sm:flex-row gap-1 bg-white/5 rounded-xl p-1 backdrop-blur-sm border border-white/10">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'files'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-2">📁</span>
            <span className="hidden sm:inline">Хэши файлов</span>
            <span className="sm:hidden">Файлы</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'manual'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-2">✏️</span>
            <span className="hidden sm:inline">Ручное сравнение</span>
            <span className="sm:hidden">Сравнение</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'guide'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="mr-2">📖</span>
            <span className="hidden sm:inline">Инструкция</span>
            <span className="sm:hidden">Гайд</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition-all ${
                dragActive
                  ? 'border-purple-400 bg-purple-500/10 scale-[1.02]'
                  : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/8'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-200">
                    Перетащите файлы сюда
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    или нажмите кнопку для выбора
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Вычисление...
                    </span>
                  ) : (
                    'Выбрать файлы'
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {hashResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-200">
                    Результаты ({hashResults.length})
                  </h2>
                  <button
                    onClick={clearResults}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20"
                  >
                    Очистить всё
                  </button>
                </div>

                {hashResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
                  >
                    <div className="px-4 sm:px-5 py-4 border-b border-white/10 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-200 truncate max-w-[200px] sm:max-w-md">
                          {result.fileName}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{result.fileSize}</p>
                      </div>
                      <button
                        onClick={() => removeResult(index)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                      {[
                        { label: 'MD5', value: result.md5 },
                        { label: 'SHA-1', value: result.sha1 },
                        { label: 'SHA-256', value: result.sha256 },
                        { label: 'SHA-512', value: result.sha512 },
                      ].map((hash) => (
                        <div key={hash.label} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center justify-between sm:block">
                            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded min-w-[70px] text-center inline-block">
                              {hash.label}
                            </span>
                            <button
                              onClick={() => copyToClipboard(hash.value)}
                              className="sm:hidden p-2 text-gray-400 hover:text-purple-400 transition-colors shrink-0"
                              title="Копировать"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <code className="flex-1 text-xs font-mono text-gray-300 bg-black/30 px-3 py-2 rounded-lg break-all min-w-0">
                              {hash.value}
                            </code>
                            <button
                              onClick={() => copyToClipboard(hash.value)}
                              className="hidden sm:block p-2 text-gray-400 hover:text-purple-400 transition-colors shrink-0"
                              title="Копировать"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Comparison of loaded files */}
                {hashResults.length >= 2 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5">
                    <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Сравнение загруженных файлов
                    </h3>
                    <div className="space-y-3">
                      {['md5', 'sha1', 'sha256', 'sha512'].map((algo) => {
                        const values = hashResults.map((r) => (r as any)[algo]);
                        const allMatch = values.every((v: string) => v === values[0]);
                        const label = algo.toUpperCase().replace('SHA', 'SHA-');
                        return (
                          <div key={algo} className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold min-w-[70px] text-center ${
                              allMatch ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {label}
                            </span>
                            <span className={`text-sm font-medium ${allMatch ? 'text-green-400' : 'text-red-400'}`}>
                              {allMatch ? '✓ Совпадают' : '✗ Различаются'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Comparison Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-200 mb-2">Ручное сравнение хэшей</h2>
              <p className="text-sm text-gray-400 mb-6">
                Введите хэши для сравнения. Поддерживается сравнение нескольких хэшей одновременно.
              </p>

              <div className="space-y-4">
                {manualHashes.map((hash, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 mb-1 block">{hash.label}</label>
                      <textarea
                        value={hash.value}
                        onChange={(e) => updateManualHash(index, e.target.value)}
                        placeholder="Вставьте хэш сюда..."
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                        rows={2}
                      />
                    </div>
                    {manualHashes.length > 2 && (
                      <button
                        onClick={() => removeManualHash(index)}
                        className="mt-6 p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={addManualHash}
                  className="flex-1 px-4 py-2 text-sm bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-all border border-white/10"
                >
                  + Добавить хэш
                </button>
                <button
                  onClick={handleManualCompare}
                  className="flex-1 px-6 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
                >
                  Сравнить
                </button>
              </div>

              {/* Result */}
              {(compareResult || checkAllMatch()) && (
                <div className={`mt-6 p-4 rounded-xl border ${
                  (compareResult || checkAllMatch()) === 'match'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {(compareResult || checkAllMatch()) === 'match' ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-green-400">Хэши совпадают!</p>
                          <p className="text-sm text-green-400/70">Файлы идентичны</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-red-400">Хэши различаются!</p>
                          <p className="text-sm text-red-400/70">Файлы не идентичны</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Guide Tab */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            {/* What is hash */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔐</span> Что такое хэш файла?
              </h2>
              <div className="space-y-3 text-gray-300 text-sm leading-relaxed">
                <p>
                  <strong className="text-purple-300">Хэш (контрольная сумма)</strong> — это уникальная строка символов,
                  которая вычисляется из содержимого файла с помощью специального алгоритма.
                  Даже малейшее изменение файла приводит к совершенно другому хэшу.
                </p>
                <p>
                  Хэши используются для:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Проверки целостности скачанных файлов</li>
                  <li>Подтверждения подлинности приложений</li>
                  <li>Обнаружения модификаций в файлах</li>
                  <li>Сравнения двух файлов на идентичность</li>
                  <li>Защиты от подмены файлов злоумышленниками</li>
                </ul>
              </div>
            </div>

            {/* Algorithms */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-2xl">🧮</span> Алгоритмы хэширования
              </h2>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {[
                  {
                    name: 'MD5',
                    length: '128 бит (32 символа)',
                    desc: 'Самый быстрый, но менее безопасный. Подходит для быстрой проверки целостности.',
                    color: 'from-blue-500/20 to-blue-600/20',
                    borderColor: 'border-blue-500/30',
                  },
                  {
                    name: 'SHA-1',
                    length: '160 бит (40 символов)',
                    desc: 'Устаревший для криптографии, но ещё используется для проверки файлов.',
                    color: 'from-yellow-500/20 to-yellow-600/20',
                    borderColor: 'border-yellow-500/30',
                  },
                  {
                    name: 'SHA-256',
                    length: '256 бит (64 символа)',
                    desc: 'Стандарт для проверки подлинности. Рекомендуется для большинства задач.',
                    color: 'from-green-500/20 to-green-600/20',
                    borderColor: 'border-green-500/30',
                  },
                  {
                    name: 'SHA-512',
                    length: '512 бит (128 символов)',
                    desc: 'Максимальная надёжность. Используется для критически важных проверок.',
                    color: 'from-red-500/20 to-red-600/20',
                    borderColor: 'border-red-500/30',
                  },
                ].map((algo) => (
                  <div
                    key={algo.name}
                    className={`bg-gradient-to-br ${algo.color} rounded-lg p-4 border ${algo.borderColor}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-200">{algo.name}</h3>
                      <span className="text-xs text-gray-400 font-mono">{algo.length}</span>
                    </div>
                    <p className="text-sm text-gray-300">{algo.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to use */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span> Как пользоваться приложением
              </h2>
              <div className="space-y-6">
                {/* Method 1 */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-purple-300 mb-2">Способ 1: Вычисление хэшей файлов</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>Перейдите на вкладку <strong className="text-white">«Хэши файлов»</strong></li>
                    <li>Перетащите файлы в область загрузки или нажмите <strong className="text-white">«Выбрать файлы»</strong></li>
                    <li>Дождитесь вычисления всех хэшей (MD5, SHA-1, SHA-256, SHA-512)</li>
                    <li>Скопируйте нужный хэш кнопкой копирования рядом с ним</li>
                    <li>Сравните с хэшем, предоставленным источником файла</li>
                    <li>Если загружено 2+ файла — автоматическое сравнение появится внизу</li>
                  </ol>
                </div>

                {/* Method 2 */}
                <div className="border-l-4 border-pink-500 pl-4">
                  <h3 className="font-semibold text-pink-300 mb-2">Способ 2: Ручное сравнение хэшей</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                    <li>Перейдите на вкладку <strong className="text-white">«Ручное сравнение»</strong></li>
                    <li>Вставьте хэши в поля ввода (можно добавить больше полей)</li>
                    <li>Нажмите кнопку <strong className="text-white">«Сравнить»</strong></li>
                    <li>Результат покажет, совпадают ли хэши</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Windows Installation */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-2xl">💻</span> Установка на Windows 10/11
              </h2>
              <div className="space-y-4 text-sm text-gray-300">
                <p className="text-gray-400 mb-4">
                  HashCompare — это веб-приложение, которое можно установить как десктопное приложение через браузер.
                </p>

                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-blue-400">🌐</span> Вариант 1: Установка через Chrome/Edge (рекомендуется)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Откройте сайт HashCompare в браузере <strong className="text-white">Google Chrome</strong> или <strong className="text-white">Microsoft Edge</strong></li>
                    <li>Нажмите на иконку <strong className="text-white">⋮</strong> (три точки) в правом верхнем углу браузера</li>
                    <li>Выберите <strong className="text-white">«Сохранить и поделиться»</strong> → <strong className="text-white">«Установить страницу как приложение»</strong></li>
                    <li>В появившемся окне нажмите <strong className="text-white">«Установить»</strong></li>
                    <li>Приложение появится в меню «Пуск» и на рабочем столе</li>
                    <li>Теперь можно запускать HashCompare как обычную программу</li>
                  </ol>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-green-400">📥</span> Вариант 2: Скачивание исходного кода
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Установите <strong className="text-white">Node.js</strong> с официального сайта (nodejs.org) — версия 18 или выше</li>
                    <li>Скачайте исходный код проекта (ZIP-архив или через Git)</li>
                    <li>Распакуйте архив в любую папку</li>
                    <li>Откройте командную строку (PowerShell или CMD) в папке проекта</li>
                    <li>Выполните команду: <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">npm install</code></li>
                    <li>Запустите приложение: <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">npm run dev</code></li>
                    <li>Откройте браузер по адресу <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">http://localhost:5173</code></li>
                  </ol>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-yellow-400">🔧</span> Вариант 3: Создание исполняемого файла (.exe)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Установите <strong className="text-white">Node.js</strong> (версия 18+)</li>
                    <li>Скачайте и распакуйте исходный код проекта</li>
                    <li>Откройте командную строку в папке проекта</li>
                    <li>Установите зависимости: <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">npm install</code></li>
                    <li>Установите Electron: <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">npm install --save-dev electron electron-builder</code></li>
                    <li>Соберите приложение: <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">npm run build</code></li>
                    <li>Создайте .exe файл: <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">npx electron-builder</code></li>
                    <li>Готовый .exe файл появится в папке <code className="text-purple-300 bg-purple-500/10 px-2 py-1 rounded">dist</code></li>
                  </ol>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-4">
                  <p className="text-yellow-300 text-xs">
                    💡 <strong>Совет:</strong> Вариант 1 (установка через браузер) — самый простой и быстрый способ.
                    Приложение будет работать офлайн и запускаться как обычная программа.
                  </p>
                </div>
              </div>
            </div>

            {/* Practical examples */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> Практические примеры
              </h2>
              <div className="space-y-4 text-sm text-gray-300">
                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">🔽 Проверка скачанного файла</h4>
                  <p className="mb-2">
                    Многие сайты предоставляют хэш файла рядом со ссылкой для скачивания.
                    После загрузки файла вычислите его хэш и сравните с указанным.
                  </p>
                  <p className="text-gray-400">
                    Пример: На сайте указано <code className="text-purple-300 bg-purple-500/10 px-1 rounded">SHA-256: a1b2c3...</code> —
                    загрузите скачанный файл и сравните.
                  </p>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">📦 Проверка установщика приложения</h4>
                  <p className="mb-2">
                    Перед установкой программы из интернета проверьте её хэш.
                    Если хэш отличается от официального — файл мог быть изменён.
                  </p>
                  <p className="text-gray-400">
                    Официальные хэши обычно публикуются на сайте разработчика или в репозитории.
                  </p>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">🔄 Сравнение двух версий файла</h4>
                  <p className="mb-2">
                    Загрузите два файла одновременно. Приложение покажет, идентичны ли они.
                    Это полезно для проверки, была ли обновлена конфигурация или документ.
                  </p>
                </div>

                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">🛡️ Обнаружение вредоносных изменений</h4>
                  <p className="mb-2">
                    Если хэш известного безопасного файла изменился — это может означать,
                    что файл был заражён вирусом или модифицирован злоумышленником.
                  </p>
                  <p className="text-yellow-400/80 mt-2">
                    ⚠️ Всегда используйте SHA-256 или SHA-512 для критических проверок.
                  </p>
                </div>
              </div>
            </div>

            {/* Security tips */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span> Важные замечания
              </h2>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-0.5">●</span>
                  <p><strong className="text-white">MD5 устарел</strong> — не используйте его для проверки безопасности, только для быстрой проверки целостности.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-0.5">●</span>
                  <p><strong className="text-white">SHA-256 — золотой стандарт</strong> — рекомендуется для большинства задач проверки подлинности.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-0.5">●</span>
                  <p><strong className="text-white">Регистр не важен</strong> — при ручном сравнении регистр букв (a/A) не влияет на результат.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-0.5">●</span>
                  <p><strong className="text-white">Все вычисления локальны</strong> — файлы не отправляются на сервер, всё обрабатывается в вашем браузере.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-0.5">●</span>
                  <p><strong className="text-white">Размер файлов</strong> — очень большие файлы (&gt;1 ГБ) могут потребовать больше времени для обработки.</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 sm:p-6">
              <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                <span className="text-2xl">❓</span> Частые вопросы
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: 'Почему хэши одного файла на разных сайтах отличаются?',
                    a: 'Скорее всего, используются разные алгоритмы (MD5 vs SHA-256). Убедитесь, что сравниваете хэши одного алгоритма.',
                  },
                  {
                    q: 'Можно ли по хэшу восстановить файл?',
                    a: 'Нет. Хэш — это односторонняя функция. Из хэша невозможно получить исходный файл.',
                  },
                  {
                    q: 'Что делать, если хэши не совпадают?',
                    a: 'Попробуйте скачать файл заново. Если хэши всё ещё не совпадают — файл мог быть повреждён при передаче или модифицирован.',
                  },
                  {
                    q: 'Безопасно ли загружать файлы в это приложение?',
                    a: 'Да! Все вычисления происходят локально в вашем браузере. Файлы никуда не отправляются.',
                  },
                ].map((faq, i) => (
                  <div key={i} className="bg-black/20 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-1">{faq.q}</h4>
                    <p className="text-sm text-gray-400">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>HashCompare — Все вычисления выполняются локально в вашем браузере</p>
          <p className="mt-1">Файлы не отправляются на сервер • Поддержка MD5, SHA-1, SHA-256, SHA-512</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

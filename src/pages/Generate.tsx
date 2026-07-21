import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Download, RefreshCw, Settings, Image, ChevronDown } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { usePromptStore, useGenerationParamsStore, useGenerationStore, useCreditsStore } from '../store/useStore';
import { generateImage, getCredits } from '../lib/api';

const Generate = () => {
  const [searchParams] = useSearchParams();
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { currentPrompt, setCurrentPrompt, promptHistory, addToHistory } = usePromptStore();
  const { width, height, numOutputs, guidanceScale, numInferenceSteps, seed, setWidth, setHeight, setNumOutputs, setGuidanceScale, setNumInferenceSteps, setSeed } = useGenerationParamsStore();
  const { isGenerating, generatedImages, error, setIsGenerating, setGeneratedImages, setError } = useGenerationStore();
  const { balance, setBalance } = useCreditsStore();

  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt) {
      setCurrentPrompt(decodeURIComponent(prompt));
    }
  }, [searchParams, setCurrentPrompt]);

  const handleGenerate = useCallback(async () => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (balance <= 0) {
      setError('Insufficient credits. Please purchase more credits.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateImage({
        prompt: currentPrompt,
        width,
        height,
        num_outputs: numOutputs,
        guidance_scale: guidanceScale,
        num_inference_steps: numInferenceSteps,
        seed: seed || undefined,
      });

      if (response.output && response.output.length > 0) {
        const fixedImages = await Promise.all(
          response.output.map(async (url) => {
            try {
              const imgResponse = await fetch(url);
              const blob = await imgResponse.blob();
              return URL.createObjectURL(blob);
            } catch {
              return url;
            }
          })
        );
        setGeneratedImages(fixedImages);
        addToHistory(currentPrompt);
        
        try {
          const credits = await getCredits();
          setBalance(credits.balance);
        } catch (creditsError) {
          console.warn('Failed to update credits after generation:', creditsError);
        }
      } else {
        setError('No images were generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, width, height, numOutputs, guidanceScale, numInferenceSteps, seed, balance, setIsGenerating, setError, setGeneratedImages, addToHistory, setBalance]);

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download image');
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const presetPrompts = [
    'A beautiful sunset over the ocean with golden clouds',
    'A futuristic city skyline at night with neon lights',
    'A cute cat sitting on a windowsill with sunlight',
    'An abstract painting with vibrant colors and geometric shapes',
    'A fantasy castle in the mountains with dragons flying around',
  ];

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-2">
            Generate <span className="gradient-text">Images</span>
          </h1>
          <p className="text-white/60">
            Describe what you want to create and let our AI bring it to life
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Prompt
                </h2>
                <span className="text-sm text-white/40">
                  {currentPrompt.length} characters
                </span>
              </div>
              
              <textarea
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                placeholder="Describe what you want to create...&#10;&#10;Example: A beautiful landscape with mountains, lakes, and a sunset sky"
                className="input-field w-full h-40 resize-none font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleGenerate();
                  }
                }}
              />
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-white/60">
                  Press Ctrl + Enter to generate
                </span>
                <button
                  onClick={() => setCurrentPrompt(presetPrompts[Math.floor(Math.random() * presetPrompts.length)])}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Random Prompt
                </button>
              </div>

              {promptHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-2">Recent prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {promptHistory.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPrompt(prompt)}
                        className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors truncate max-w-xs"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <button
                onClick={() => setIsParamsOpen(!isParamsOpen)}
                className="w-full flex items-center justify-between"
              >
                <h2 className="font-orbitron text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Generation Parameters
                </h2>
                <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${isParamsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isParamsOpen && (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Width</label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="input-field"
                        min={256}
                        max={1024}
                        step={64}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Height</label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="input-field"
                        min={256}
                        max={1024}
                        step={64}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">
                      Number of Outputs: <span className="text-cyan-400">{numOutputs}</span>
                    </label>
                    <input
                      type="range"
                      value={numOutputs}
                      onChange={(e) => setNumOutputs(Number(e.target.value))}
                      className="w-full"
                      min={1}
                      max={4}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>1</span>
                      <span>4</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">
                      Guidance Scale: <span className="text-cyan-400">{guidanceScale}</span>
                    </label>
                    <input
                      type="range"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(Number(e.target.value))}
                      className="w-full"
                      min={1}
                      max={20}
                      step={0.5}
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>1</span>
                      <span>20</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">
                      Inference Steps: <span className="text-cyan-400">{numInferenceSteps}</span>
                    </label>
                    <input
                      type="range"
                      value={numInferenceSteps}
                      onChange={(e) => setNumInferenceSteps(Number(e.target.value))}
                      className="w-full"
                      min={20}
                      max={100}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>20</span>
                      <span>100</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-2">Seed (optional)</label>
                    <input
                      type="number"
                      value={seed || ''}
                      onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : null)}
                      className="input-field"
                      placeholder="Leave empty for random"
                    />
                  </div>
                </div>
              )}
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !currentPrompt.trim()}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
                </>
              )}
            </Button>

            <div className="text-center text-sm text-white/40">
              <span className="text-cyan-400">{balance}</span> credits remaining
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="font-orbitron text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-cyan-400" />
                Preview
              </h2>

              {isGenerating && (
                <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/70">Generating your image...</p>
                    <p className="text-white/40 text-sm mt-2">This may take a few seconds</p>
                  </div>
                </div>
              )}

              {error && !isGenerating && (
                <div className="aspect-square rounded-xl bg-red-500/10 flex items-center justify-center">
                  <p className="text-red-400 text-center px-4">{error}</p>
                </div>
              )}

              {generatedImages.length > 0 && !isGenerating && !error && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(imageUrl)}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(imageUrl); }}>
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleRegenerate}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Regenerate
                  </Button>
                </div>
              )}

              {!isGenerating && !generatedImages.length && !error && (
                <div className="aspect-square rounded-xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 flex items-center justify-center border-2 border-dashed border-white/10">
                  <div className="text-center">
                    <Image className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/40">Your generated images will appear here</p>
                    <p className="text-white/30 text-sm mt-1">Enter a prompt and click generate</p>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="font-orbitron text-sm font-semibold text-white mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Use detailed descriptions for better results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Include style keywords (e.g., "oil painting", "photorealistic")
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Higher guidance scale = more prompt adherence
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  Higher inference steps = better quality (slower)
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white/70 hover:text-white"
            >
              Close
            </button>
            <img
              src={selectedImage}
              alt="Full size preview"
              className="max-w-full max-h-[90vh] rounded-xl"
            />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(selectedImage);
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2"
            >
              <Download className="w-5 h-5" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Generate;

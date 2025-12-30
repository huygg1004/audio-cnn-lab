"use client";

import { useState } from "react";
import ColorScale from "~/components/ColorScale";
import FeatureMap from "~/components/FeatureMap";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import Waveform from "~/components/Waveform";
import { 
  Upload, 
  Music, 
  Activity, 
  Layers, 
  FileAudio, 
  AlertCircle,
  Zap,
  BarChart3
} from "lucide-react";

// --- Interfaces ---
interface Prediction {
  class: string;
  confidence: number;
}

interface LayerData {
  shape: number[];
  values: number[][];
}

// FIX: Changed index signature to Record type
type VisualizationData = Record<string, LayerData>;

interface WaveformData {
  values: number[];
  sample_rate: number;
  duration: number;
}

interface ApiResponse {
  predictions: Prediction[];
  visualization: VisualizationData;
  input_spectrogram: LayerData;
  waveform: WaveformData;
}

// --- Constants ---
const ESC50_EMOJI_MAP: Record<string, string> = {
  dog: "🐕", rain: "🌧️", crying_baby: "👶", door_wood_knock: "🚪",
  helicopter: "🚁", rooster: "🐓", sea_waves: "🌊", sneezing: "🤧",
  mouse_click: "🖱️", chainsaw: "🪚", pig: "🐷", crackling_fire: "🔥",
  clapping: "👏", keyboard_typing: "⌨️", siren: "🚨", cow: "🐄",
  crickets: "🦗", breathing: "💨", door_wood_creaks: "🚪", car_horn: "📯",
  frog: "🐸", chirping_birds: "🐦", coughing: "😷", can_opening: "🥫",
  engine: "🚗", cat: "🐱", water_drops: "💧", footsteps: "👣",
  washing_machine: "🧺", train: "🚂", hen: "🐔", wind: "💨",
  laughing: "😂", vacuum_cleaner: "🧹", church_bells: "🔔", insects: "🦟",
  pouring_water: "🚰", brushing_teeth: "🪥", clock_alarm: "⏰", airplane: "✈️",
  sheep: "🐑", toilet_flush: "🚽", snoring: "😴", clock_tick: "⏱️",
  fireworks: "🎆", crow: "🐦‍⬛", thunderstorm: "⛈️", drinking_sipping: "🥤",
  glass_breaking: "🔨", hand_saw: "🪚",
};

const getEmojiForClass = (className: string): string => {
  // FIX: Use ?? instead of ||
  return ESC50_EMOJI_MAP[className] ?? "🔈";
};

function splitLayers(visualization: VisualizationData) {
  const main: [string, LayerData][] = [];
  const internals: Record<string, [string, LayerData][]> = {};

  for (const [name, data] of Object.entries(visualization)) {
    if (!name.includes(".")) {
      main.push([name, data]);
    } else {
      const [parent] = name.split(".");
      if (parent === undefined) continue;

      // FIX: Use ??= assignment
      internals[parent] ??= [];
      internals[parent].push([name, data]);
    }
  }
  return { main, internals };
}

export default function HomePage() {
  const [vizData, setVizData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setError(null);
    setVizData(null);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const base64String = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );

        const response = await fetch(
          "https://quietjourney8888--audio-cnn-inference-audioclassifier-inference.modal.run",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio_data: base64String }),
          }
        );

        if (!response.ok) {
          throw new Error(`API error ${response.statusText}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData: any = await response.json();
        const data = rawData as ApiResponse;
        
        setVizData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occured");
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file.");
      setIsLoading(false);
    };
  };

  const { main, internals } = vizData
    ? splitLayers(vizData?.visualization)
    : { main: [], internals: {} };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
        
        {/* Navbar / Top Brand Area */}
        <header className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20">
                <Activity className="h-6 w-6 text-indigo-400" />
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-tight text-white"> CNN Audio Lab</h1>
                <p className="text-xs text-zinc-500">Neural Network Visualizer</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-400">
               Model: VGG16-Audio
            </Badge>
          </div>
        </header>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* === LEFT COLUMN: Controls & Input Data (Sticky on Desktop) === */}
          <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-6">
            
            {/* 1. Upload Card */}
            <Card className="border-zinc-800 bg-zinc-900/40">
              <CardContent className="p-6">
                 <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 p-8 transition-all hover:border-indigo-500/50 hover:bg-zinc-900">
                    <input
                      type="file"
                      accept=".wav"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="absolute inset-0 z-10 w-full h-full cursor-pointer opacity-0"
                    />
                    <div className="mb-4 rounded-full bg-zinc-900 p-3 ring-1 ring-zinc-800 transition-transform group-hover:scale-110 group-hover:ring-indigo-500/50">
                       {isLoading ? (
                         <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                       ) : (
                         <Upload className="h-6 w-6 text-zinc-400 group-hover:text-indigo-400" />
                       )}
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      {isLoading ? "Analyzing..." : "Drop Audio File"}
                    </p>
                 </div>
                 {fileName && (
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <FileAudio className="h-4 w-4 shrink-0 text-indigo-400" />
                           <span className="truncate text-xs text-zinc-300">{fileName}</span>
                        </div>
                        <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">Ready</Badge>
                    </div>
                 )}
                 {error && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-red-400">
                      <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                 )}
              </CardContent>
            </Card>

              {/* 2. Source Visuals (Only show if data exists) */}
              {vizData && (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
                  
                  {/* Waveform Card */}
                  <Card className="border-zinc-800 bg-zinc-900/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Music className="h-4 w-4" /> Raw Waveform
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="group relative w-full rounded bg-black border border-zinc-800">
                        <div className="h-24 overflow-x-auto p-2 custom-scrollbar">
                          <div className="min-w-fit"> 
                            <Waveform
                              data={vizData.waveform.values}
                              title={`${vizData.waveform.duration.toFixed(2)}s`}
                            />
                          </div>
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Spectrogram Card */}
                  <Card className="border-zinc-800 bg-zinc-900/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Input Spectrogram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full overflow-hidden rounded bg-black border border-zinc-800">
                        <div className="overflow-x-auto custom-scrollbar">
                          <div className="min-w-fit">
                            <FeatureMap
                              data={vizData.input_spectrogram.values}
                              title=""
                              spectrogram
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-zinc-500 text-right font-mono">
                        {vizData.input_spectrogram.shape.join(" × ")}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
          </div>

          {/* === RIGHT COLUMN: Analysis Results === */}
          <div className="lg:col-span-8 space-y-6">
             {!vizData ? (
                <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-zinc-500">
                   <Activity className="mb-4 h-12 w-12 opacity-20" />
                   <p>Upload audio to trigger the Neural Network</p>
                </div>
             ) : (
                <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 space-y-6">
                   
                   {/* 1. Top Predictions */}
                   <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900 to-black overflow-hidden relative">
                      <div className="absolute right-0 top-0 h-64 w-64 bg-indigo-500/10 blur-[100px]" />
                      <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-white">
                            <Zap className="h-5 w-5 text-yellow-400" />
                            Classification Results
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Winner Block */}
                            <div className="rounded-xl bg-zinc-800/50 p-6 border border-zinc-700/50 flex flex-col items-center justify-center text-center">
                               <span className="text-6xl mb-4">
                                 {getEmojiForClass(vizData.predictions[0]?.class ?? "")}
                               </span>
                               <h2 className="text-3xl font-bold text-white capitalize mb-1">
                                  {vizData.predictions[0]?.class?.replaceAll("_", " ") ?? "Unknown"}
                               </h2>
                               <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 text-lg">
                                  {((vizData.predictions[0]?.confidence ?? 0) * 100).toFixed(1)}% Confidence
                               </Badge>
                            </div>

                            {/* Runners Up List */}
                            <div className="space-y-4 justify-center flex flex-col">
                               <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Alternative Classes</p>
                               {vizData.predictions.slice(1, 4).map((pred) => (
                                  <div key={pred.class} className="group">
                                     <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                           <span className="text-xl">{getEmojiForClass(pred.class)}</span>
                                           <span className="text-zinc-300 capitalize text-sm font-medium">{pred.class.replaceAll("_", " ")}</span>
                                        </div>
                                        <span className="text-zinc-500 font-mono text-xs">{(pred.confidence * 100).toFixed(1)}%</span>
                                     </div>
                                     <Progress value={pred.confidence * 100} className="h-1.5 bg-zinc-800 [&>div]:bg-zinc-600" />
                                  </div>
                               ))}
                            </div>
                         </div>
                      </CardContent>
                   </Card>

                   {/* 2. Neural Network Internals */}
                   <Card className="border-zinc-800 bg-zinc-900/30">
                      <CardHeader className="flex flex-row items-center justify-between">
                         <CardTitle className="flex items-center gap-2 text-zinc-100">
                            <Layers className="h-5 w-5 text-indigo-400" />
                            ConvNet Activation Maps
                         </CardTitle>
                         <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
                             <span>Low Activation</span>
                             <ColorScale width={100} height={8} min={-1} max={1} />
                             <span>High Activation</span>
                         </div>
                      </CardHeader>
                      <CardContent>
                         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {main.map(([mainName, mainData]) => (
                               <div key={mainName} className="flex flex-col gap-2 p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-colors">
                                  <div className="flex items-center justify-between mb-1">
                                     <span className="text-xs font-mono text-indigo-300 font-bold">{mainName}</span>
                                     <span className="text-[10px] text-zinc-600 font-mono">{mainData.shape[0]}x{mainData.shape[1]}</span>
                                  </div>
                                  <div className="rounded overflow-hidden ring-1 ring-white/5">
                                     <FeatureMap data={mainData.values} title="" />
                                  </div>
                                  {internals[mainName] && (
                                     <div className="mt-2 pt-2 border-t border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-500 mb-2">Features ({internals[mainName].length})</p>
                                        <div className="h-24 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                           {internals[mainName].map(([layerName, layerData]) => (
                                              <div key={layerName} className="opacity-60 hover:opacity-100 transition-opacity">
                                                 <FeatureMap data={layerData.values} title="" internal />
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  )}
                               </div>
                            ))}
                         </div>
                      </CardContent>
                   </Card>

                </div>
             )}
          </div>
        </div>
      </div>
    </main>
  );
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Play, 
  RefreshCw, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Network, 
  Clock, 
  Flame 
} from 'lucide-react';
import { Pipeline, Job } from '../types';

interface PipelineViewProps {
  repoId: number;
  pipelines: Pipeline[];
  activePipelineId: number | null;
  onSelectPipeline: (id: number) => void;
  onRefresh: () => void;
  isMobileMode?: boolean;
}

export default function PipelineView({
  repoId,
  pipelines,
  activePipelineId,
  onSelectPipeline,
  onRefresh,
  isMobileMode = false
}: PipelineViewProps) {
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [runningTrigger, setRunningTrigger] = useState<boolean>(false);
  
  // Terminal log stream state
  const [selectedJobForLogs, setSelectedJobForLogs] = useState<Job | null>(null);
  const [streamedLogs, setStreamedLogs] = useState<string>('');
  const [streamStatus, setStreamStatus] = useState<string>('');
  
  const activePipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
  const terminalRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Expanded accordion sections for mobile
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    'lint': true,
    'test': true,
    'build': false,
    'deploy': false
  });

  // Toggle stage accordion on mobile
  const toggleStage = (stage: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stage]: !prev[stage]
    }));
  };

  // Fetch jobs for currently active pipeline
  const fetchJobs = async (pipeId: number) => {
    setLoadingJobs(true);
    try {
      const res = await fetch(`/api/v1/repos/${repoId}/pipelines/${pipeId}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách Jobs:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (activePipeline) {
      fetchJobs(activePipeline.id);
      setSelectedJobForLogs(null);
      setStreamedLogs('');
    }
  }, [activePipelineId, repoId]);

  // Handle auto-scroll terminal logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [streamedLogs]);

  // Subscribe to SSE Logs Stream when job selection changes
  useEffect(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    if (!selectedJobForLogs) return;

    setStreamedLogs('');
    setStreamStatus('connecting');

    // Create fresh SSE subscription
    const eventSource = new EventSource(`/api/v1/jobs/${selectedJobForLogs.id}/logs-stream`);
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.log) {
          setStreamedLogs(prev => prev + data.log + '\n');
        }
        if (data.status) {
          setStreamStatus(data.status);
          // Auto update local job status in list if changed
          setJobs(prevJobs => 
            prevJobs.map(j => j.id === selectedJobForLogs.id ? { ...j, status: data.status } : j)
          );
        }
        if (data.done) {
          eventSource.close();
          setStreamStatus('done');
          onRefresh(); // Refresh general pipeline status card
        }
      } catch (err) {
        console.error("Lỗi đọc gói SSE log:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Mất kết nối SSE Logs Stream.", err);
      setStreamStatus('failed');
      eventSource.close();
    };

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [selectedJobForLogs]);

  // Command to trigger / retry pipeline
  const handleTriggerPipeline = async (pipeId: number) => {
    setRunningTrigger(true);
    try {
      const res = await fetch(`/api/v1/repos/${repoId}/pipelines/${pipeId}/run`, {
        method: 'POST'
      });
      if (res.ok) {
        // Refresh local jobs & general workflow
        setTimeout(() => {
          fetchJobs(pipeId);
          onRefresh();
          setRunningTrigger(false);
        }, 300);
      }
    } catch (err) {
      console.error(err);
      setRunningTrigger(false);
    }
  };

  // Group jobs by stage for layout processing
  const stagesList: ('lint' | 'test' | 'build' | 'deploy')[] = ['lint', 'test', 'build', 'deploy'];
  const jobsByStage: Record<string, Job[]> = {
    'lint': [],
    'test': [],
    'build': [],
    'deploy': []
  };
  jobs.forEach(job => {
    if (jobsByStage[job.stage]) {
      jobsByStage[job.stage].push(job);
    }
  });

  return (
    <div className="flex flex-col gap-4 font-sans">
      
      {/* Pipeline Navigation / State Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/10 shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-slate-100 font-semibold text-sm">Cấu hình Pipeline CI/CD</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                activePipeline?.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                activePipeline?.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold' :
                activePipeline?.status === 'running' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                {activePipeline?.status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Commit: {activePipeline?.commit_sha ? activePipeline.commit_sha.slice(0, 8) : 'unknown'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Select Pipelines dropdown emulator */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-850">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Chọn bản:</span>
            <select 
              value={activePipeline?.id || ''} 
              onChange={(e) => onSelectPipeline(parseInt(e.target.value))}
              className="bg-transparent text-slate-350 text-xs font-mono outline-none border-none py-0.5 cursor-pointer"
            >
              {pipelines.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-950 text-slate-300">
                  Pipeline #{p.id} ({p.status})
                </option>
              ))}
            </select>
          </div>

          <button
            id="start-pipeline-btn"
            onClick={() => handleTriggerPipeline(activePipeline?.id || 1)}
            disabled={runningTrigger || activePipeline?.status === 'running'}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-all shadow-sm shadow-indigo-900/10 disabled:bg-slate-850 disabled:text-slate-500 cursor-pointer"
          >
            {activePipeline?.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-indigo-200" />}
            <span>Kích hoạt CI/CD</span>
          </button>
        </div>
      </div>

      {/* Main Core Render Box */}
      {!isMobileMode ? (
        /* ======================== DESKTOP VIEW ======================== */
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 relative overflow-hidden shadow-inner">
          <div className="mb-4 text-xs font-mono text-slate-500 flex items-center justify-between">
            <span>Sơ đồ liên kết Đồ thị (Graph Network View)</span>
            <span>Các job nối nhau bằng dây truyền tín hiệu SVG</span>
          </div>

          {/* SVG Connection Lines in Background */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 0 }}>
            {/* Draw standard visual pipes between stage centers */}
            <path d="M 120 120 L 260 120 M 345 120 L 485 120 M 570 120 L 710 120" stroke="#1e293b" strokeWidth="2" fill="none" strokeDasharray="4 4" />
          </svg>

          {/* Horizontal layout grid */}
          <div className="grid grid-cols-4 gap-6 relative" style={{ zIndex: 1 }}>
            {stagesList.map((stage, sIdx) => {
              const stageJobs = jobsByStage[stage];
              return (
                <div key={sIdx} className="flex flex-col gap-3">
                  {/* Stage Headline */}
                  <div className="px-3 py-1.5 bg-slate-905/60 border border-slate-850 rounded-lg flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-mono">{stage}</span>
                    <span className="text-[10px] font-mono text-slate-500">{stageJobs.length} Job</span>
                  </div>

                  {/* Jobs list in Stage column */}
                  <div className="flex flex-col gap-2.5">
                    {stageJobs.map((job) => {
                      const isSelected = selectedJobForLogs?.id === job.id;
                      return (
                        <div 
                          key={job.id}
                          className={`group rounded-lg border p-3 flex flex-col gap-2 transition-all ${
                            isSelected 
                              ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/20' 
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold text-slate-200 font-mono truncate max-w-[130px]" title={job.name}>
                              {job.name}
                            </span>
                            
                            {/* Short Status Indicator */}
                            {job.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {job.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                            {job.status === 'running' && <Loader2 className="w-4 h-4 text-indigo-400 shrink-0 animate-spin" />}
                            {job.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0 bg-slate-950/50" />}
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px] text-slate-400">
                            <button 
                              onClick={() => setSelectedJobForLogs(job)}
                              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>Logs console</span>
                            </button>

                            {/* Retry Action button in-place next to failed state */}
                            {job.status === 'failed' && (
                              <button
                                onClick={() => handleTriggerPipeline(activePipeline?.id || 1)}
                                className="flex items-center gap-0.5 text-rose-400 hover:text-rose-300 font-semibold uppercase shrink-0 font-mono. text-[9px] bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/25 cursor-pointer"
                              >
                                <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                                <span>Thử lại</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ======================== MOBILE VIEW ======================== */
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 shadow-md flex flex-col gap-3">
          <div className="text-xs font-mono text-slate-500 flex items-center justify-between pb-2 border-b border-slate-900">
            <span>Dạng dòng thời gian (Accordion View)</span>
            <span>Stage xếp dọc, nhấp để mở rộng job</span>
          </div>

          <div className="flex flex-col gap-2">
            {stagesList.map((stage, index) => {
              const stageJobs = jobsByStage[stage];
              const isExpanded = expandedStages[stage];
              
              // Determine visual highlight color of stage title based on job statuses
              let statusText = "Pending";
              let statusBadgeBg = "bg-slate-900 border-slate-800 text-slate-400";
              if (stageJobs.some(j => j.status === 'running')) {
                statusText = "Running";
                statusBadgeBg = "bg-amber-500/15 border-amber-500/20 text-amber-400 animate-pulse";
              } else if (stageJobs.some(j => j.status === 'failed')) {
                statusText = "Failed";
                statusBadgeBg = "bg-rose-500/15 border-rose-500/20 text-rose-400";
              } else if (stageJobs.every(j => j.status === 'success')) {
                statusText = "Success";
                statusBadgeBg = "bg-emerald-500/15 border-emerald-500/20 text-emerald-405";
              }

              return (
                <div key={index} className="border border-slate-900 rounded-lg overflow-hidden">
                  {/* Accordion Trigger header */}
                  <button
                    onClick={() => toggleStage(stage)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-900 hover:bg-slate-850 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-slate-300">{stage}</span>
                      <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${statusBadgeBg}`}>
                        {statusText}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>

                  {/* Accordion jobs content area */}
                  {isExpanded && (
                    <div className="bg-slate-950 p-2.5 divide-y divide-slate-900 flex flex-col gap-1.5">
                      {stageJobs.map((job) => (
                        <div 
                          key={job.id} 
                          onClick={() => setSelectedJobForLogs(job)}
                          className={`p-2.5 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                            selectedJobForLogs?.id === job.id 
                              ? 'bg-indigo-950/20 border border-indigo-500/25' 
                              : 'hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-200 font-mono font-medium">{job.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Ý kiến: Nhấn để xem console log</span>
                          </div>

                          <div className="flex items-center gap-2 font-mono">
                            {job.status === 'failed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTriggerPipeline(activePipeline?.id || 1);
                                }}
                                className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded shrink-0 cursor-pointer font-semibold uppercase"
                              >
                                Tải lại
                              </button>
                            )}

                            {job.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {job.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            {job.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />}
                            {job.status === 'pending' && <div className="w-3 h-3 rounded-full border border-slate-800 bg-slate-900 shrink-0" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal logs container */}
      {selectedJobForLogs && (
        <div id="terminal-block" className="flex flex-col rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-[#030712]">
          {/* Header */}
          <div className="bg-[#090d16] px-4 py-2.5 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-mono">
                Terminal logs: <span className="text-indigo-300 font-semibold">{selectedJobForLogs.name}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {streamStatus === 'connecting' && (
                <span className="text-[10px] text-amber-400 animate-pulse font-mono">
                  ● CONNECTING
                </span>
              )}
              {streamStatus === 'running' && (
                <span className="text-[10px] text-blue-400 animate-pulse font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                  ● LOG STREAMING LIVE
                </span>
              )}
              {streamStatus === 'done' && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  ● SUCCESS
                </span>
              )}

              <button 
                onClick={() => setSelectedJobForLogs(null)}
                className="text-slate-500 hover:text-slate-350 font-mono text-xs cursor-pointer. pl-2"
              >
                Close
              </button>
            </div>
          </div>

          {/* Console lines screen */}
          <div 
            ref={terminalRef}
            className="p-4 h-[250px] overflow-y-auto font-mono text-[11px] leading-relaxed select-text flex flex-col gap-1.5 scroll-smooth"
          >
            {streamedLogs ? (
              streamedLogs.split('\n').map((line, lIdx) => {
                let textClass = 'text-slate-300';
                if (line.includes('[GitBot CI]') || line.includes('Stage:')) {
                  textClass = 'text-indigo-400 font-semibold';
                } else if (line.startsWith('$')) {
                  textClass = 'text-amber-300';
                } else if (line.toLowerCase().includes('success') || line.includes('PASS') || line.includes('✔')) {
                  textClass = 'text-emerald-400 font-bold';
                } else if (line.toLowerCase().includes('fail') || line.includes('ERROR') || line.includes('exit status')) {
                  textClass = 'text-rose-400 font-bold';
                }

                return (
                  <div key={lIdx} className={`${textClass} whitespace-pre-wrap`}>
                    {line}
                  </div>
                );
              })
            ) : (
              <div className="text-slate-600 text-xs text-center py-10">
                ⏳ Đang sạc dữ liệu console logs gốc của Runner...
              </div>
            )}
          </div>

          <div className="bg-[#050912] px-3 py-1.5 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono select-none">
            <span>Terminal: standard-shell-alpine</span>
            <span>WebSocket streaming simulation via SSE</span>
          </div>
        </div>
      )}

    </div>
  );
}

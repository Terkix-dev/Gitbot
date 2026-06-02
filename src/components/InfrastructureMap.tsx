/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDown, Cpu, Database, HardDrive, Layout, Server, ShieldCheck, Smartphone, Users } from 'lucide-react';

export default function InfrastructureMap() {
  return (
    <div id="infrastructure-map-container" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Server className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-semibold text-slate-100 font-sans tracking-tight">Kiến trúc hạ tầng Microservices & Mạng lưới GitBot</h3>
      </div>

      <div className="flex flex-col gap-6">
        {/* Core diagram container */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center justify-center p-4 bg-slate-950 rounded-lg border border-slate-800/60 font-sans">
          
          {/* Node 1: Users */}
          <div className="flex flex-col items-center p-4 bg-slate-900 border border-slate-800 rounded-lg text-center hover:border-teal-500 transition-colors">
            <div className="p-3 bg-teal-500/10 rounded-full border border-teal-500/30 text-teal-400 mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">Người dùng / Thiết bị</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Trình duyệt Web, di động, ứng dụng PWA, SSH Client
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-slate-600 rotate-90 md:rotate-0">
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/50 mb-1">HTTPS/SSH</span>
            <ArrowDown className="w-5 h-5 text-slate-500 md:-rotate-90" />
          </div>

          {/* Node 2: Nginx LB */}
          <div className="flex flex-col items-center p-4 bg-slate-900 border border-slate-800 rounded-lg text-center hover:border-indigo-500 transition-colors">
            <div className="p-3 bg-indigo-500/10 rounded-full border border-indigo-500/30 text-indigo-400 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">Nginx Load Balancer</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Cân bằng tải, định tuyến giao dịch & chứng thực SSH Gate
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-slate-600 rotate-90 md:rotate-0">
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800/50 mb-1">Reverse Proxy</span>
            <ArrowDown className="w-5 h-5 text-slate-500 md:-rotate-90" />
          </div>

          {/* Node 3: Microservices split */}
          <div className="grid grid-rows-2 gap-3 w-full">
            <div className="flex items-center gap-3 p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-lg">
              <Layout className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Frontend Service</span>
                <span className="text-[9px] text-slate-400">Next.js Serverless</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-950/40 border border-purple-800/40 rounded-lg">
              <Cpu className="w-5 h-5 text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200">Backend API Web</span>
                <span className="text-[9px] text-slate-400">Golang REST API Server</span>
              </div>
            </div>
          </div>

        </div>

        {/* Storage Layer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-400 shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs font-semibold text-slate-200 uppercase font-sans tracking-wide">Git Storage Engine (Gitaly Cluster)</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Tách biệt hoàn toàn vật lý với API Server. Sử dụng ổ cứng tốc độ cao <strong>SSD NVMe</strong> kết hợp cơ chế nhân bản <strong>Replication</strong> rải rác đảm bảo không bao giờ bị mất code của khách hàng.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/30 text-emerald-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-xs font-semibold text-slate-200 uppercase font-sans tracking-wide">PostgreSQL Core Database</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Nơi quản lý dữ liệu phi cấu trúc, metadata, tags, pull requests, logs và quan hệ kho chứa. Tích hợp backup liên tục và khả năng mở rộng quy mô dọc ổn định.
              </p>
            </div>
          </div>
        </div>

        {/* Infrastructure Footnotes info */}
        <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-lg flex items-start gap-2.5">
          <span className="px-2 py-0.5 text-[9px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded mt-0.5 font-bold uppercase shrink-0">CI/CD DEV-OPS</span>
          <p className="text-[11px] text-slate-400 leading-normal">
            Toàn bộ ứng dụng chính được đóng gói bằng <strong>Docker containers</strong>, đăng ký và quản trị vận hành bởi <strong>Kubernetes (K8s) cluster</strong>. Khả năng tự động Autoscaling giúp chống chịu tải tức thì khi lượng Git Webhooks tăng đột biến.
          </p>
        </div>
      </div>
    </div>
  );
}

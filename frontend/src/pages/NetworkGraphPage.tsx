import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Share2, Filter, AlertTriangle, ShieldCheck, DollarSign,
  Users, RefreshCw, ZoomIn, ZoomOut, RotateCcw, ArrowRight,
  ShieldAlert, Building2, User, ChevronRight, X, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import type { NetworkGraphResponse, NetworkNode, NetworkEdge } from '../types';
import { TransactionModal } from '../components/TransactionModal';
import { Transaction } from '../types';

export const NetworkGraphPage: React.FC = () => {
  const [data, setData] = useState<NetworkGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [limit, setLimit] = useState(45);
  const [riskLevel, setRiskLevel] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [focusMules, setFocusMules] = useState<boolean>(false);

  // Interaction State
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Modal State for inspecting transactions
  const [inspectTxn, setInspectTxn] = useState<Transaction | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNetworkGraph({
        limit,
        risk_level: riskLevel,
        min_amount: minAmount,
        focus_mules: focusMules,
      });
      setData(res);
      // Auto-select first mule node if available
      const mule = res.nodes.find((n) => n.is_mule_suspect);
      if (mule && !selectedNode) setSelectedNode(mule);
    } catch (err: any) {
      setError(err.message || 'Failed to construct transaction network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [limit, riskLevel, minAmount, focusMules]);

  // Compute 2D node coordinates using circular layout with clusters
  const nodePositions = useMemo(() => {
    if (!data || data.nodes.length === 0) return new Map<string, { x: number; y: number }>();
    const pos = new Map<string, { x: number; y: number }>();
    const width = 850;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;

    const senders = data.nodes.filter((n) => n.type === 'sender');
    const receivers = data.nodes.filter((n) => n.type !== 'sender');

    // Inner ring for merchants/receivers
    const innerRadius = 140;
    receivers.forEach((node, idx) => {
      const angle = (idx / Math.max(1, receivers.length)) * 2 * Math.PI;
      pos.set(node.id, {
        x: centerX + innerRadius * Math.cos(angle),
        y: centerY + innerRadius * Math.sin(angle),
      });
    });

    // Outer ring for senders
    const outerRadius = 260;
    senders.forEach((node, idx) => {
      const angle = (idx / Math.max(1, senders.length)) * 2 * Math.PI + 0.15;
      pos.set(node.id, {
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle),
      });
    });

    return pos;
  }, [data]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Connected edges for the selected node
  const connectedEdges = useMemo(() => {
    if (!data || !selectedNode) return [];
    return data.edges.filter(
      (e) => e.source === selectedNode.id || e.target === selectedNode.id
    );
  }, [data, selectedNode]);

  const handleOpenTransaction = async (txnId: string) => {
    try {
      const res = await api.getTransaction(txnId);
      setInspectTxn(res);
    } catch {
      alert(`Unable to load details for ${txnId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            GRAPH RISK ANALYTICS
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Interactive Transaction Network Explorer
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            Graph relationship mapping of senders, merchant funnels, and money-mule pooling syndicates.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mules Toggle */}
          <button
            onClick={() => setFocusMules(!focusMules)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-soft ${
              focusMules
                ? 'bg-alert-red text-white border-alert-red'
                : 'bg-surface border-taupe/20 text-charcoal hover:border-accent/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Mule Funnels</span>
          </button>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-taupe/20 text-xs shadow-soft">
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="bg-transparent text-charcoal font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface">All Risk Tiers</option>
              <option value="CRITICAL" className="bg-surface">Critical Risk</option>
              <option value="HIGH" className="bg-surface">High Risk</option>
              <option value="MEDIUM" className="bg-surface">Medium Risk</option>
              <option value="LOW" className="bg-surface">Low Risk</option>
            </select>
          </div>

          {/* Subgraph limit */}
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-taupe/20 text-xs shadow-soft text-charcoal">
            <span className="text-taupe">Limit:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-transparent font-mono font-medium focus:outline-none cursor-pointer"
            >
              <option value={25} className="bg-surface">25 Edges</option>
              <option value={45} className="bg-surface">45 Edges</option>
              <option value={75} className="bg-surface">75 Edges</option>
              <option value={100} className="bg-surface">100 Edges</option>
            </select>
          </div>

          <button
            onClick={fetchGraph}
            title="Refresh Network Subgraph"
            className="p-2 rounded-xl bg-surface border border-taupe/20 text-charcoal hover:text-accent hover:border-accent/40 shadow-soft transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Network KPI Cards Strip */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-taupe flex items-center justify-between">
              Total Nodes
              <Users className="w-3.5 h-3.5 text-accent" />
            </span>
            <div className="font-tabular font-bold text-xl text-text-main">
              {data.summary.total_nodes}
            </div>
            <p className="text-[10px] text-taupe">Senders & Receivers</p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-taupe flex items-center justify-between">
              Active Edges
              <Share2 className="w-3.5 h-3.5 text-accent" />
            </span>
            <div className="font-tabular font-bold text-xl text-text-main">
              {data.summary.total_edges}
            </div>
            <p className="text-[10px] text-taupe">Direct transfer vectors</p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-taupe flex items-center justify-between">
              Network Volume
              <DollarSign className="w-3.5 h-3.5 text-accent" />
            </span>
            <div className="font-tabular font-bold text-xl text-text-main">
              ₹{data.summary.total_volume_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[10px] text-taupe">Settled throughput</p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-taupe flex items-center justify-between">
              Mule Funnel Hubs
              <ShieldAlert className="w-3.5 h-3.5 text-alert-red" />
            </span>
            <div className="font-tabular font-bold text-xl text-alert-red">
              {data.summary.mule_suspect_nodes}
            </div>
            <p className="text-[10px] text-taupe">High in-degree pooling</p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-taupe/20 shadow-soft space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-taupe flex items-center justify-between">
              High / Critical Edges
              <AlertTriangle className="w-3.5 h-3.5 text-accent" />
            </span>
            <div className="font-tabular font-bold text-xl text-accent">
              {data.summary.high_or_critical_edges}
            </div>
            <p className="text-[10px] text-taupe">Anomaly weighted</p>
          </div>
        </div>
      )}

      {/* Main Graph Exploration Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Canvas Panel (2 cols on large screen) */}
        <div className="lg:col-span-2 relative bg-surface border border-taupe/25 rounded-2xl shadow-soft overflow-hidden min-h-[580px] flex flex-col">
          {/* Canvas Floating Overlay Controls */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-md p-1.5 rounded-xl border border-taupe/20 shadow-soft">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
              title="Zoom In"
              className="p-1.5 rounded-lg text-charcoal hover:bg-surface transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.15))}
              title="Zoom Out"
              className="p-1.5 rounded-lg text-charcoal hover:bg-surface transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              title="Reset View"
              className="p-1.5 rounded-lg text-charcoal hover:bg-surface transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-taupe px-1 border-l border-taupe/20">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          {/* Graph Legend */}
          <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-3 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-taupe/20 text-[10px] font-mono shadow-soft">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Sender
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-charcoal dark:bg-cream" /> Merchant
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-alert-red bg-alert-red" /> Mule Hub
            </span>
          </div>

          {/* Interactive SVG Canvas */}
          <div
            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <svg
              viewBox="0 0 850 550"
              className="w-full h-full min-h-[580px]"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <defs>
                <marker
                  id="arrow-critical"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#B84A3B" />
                </marker>
                <marker
                  id="arrow-high"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#C96B35" />
                </marker>
                <marker
                  id="arrow-normal"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#A99B89" />
                </marker>
              </defs>

              {/* Grid Background Pattern */}
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.04" />
              </pattern>
              <rect width="850" height="550" fill="url(#grid)" />

              {/* Render Edges */}
              {data?.edges.map((edge) => {
                const src = nodePositions.get(edge.source);
                const tgt = nodePositions.get(edge.target);
                if (!src || !tgt) return null;

                const isCritical = edge.risk_level === 'CRITICAL';
                const isHigh = edge.risk_level === 'HIGH';
                const strokeColor = isCritical ? '#B84A3B' : isHigh ? '#C96B35' : '#A99B89';
                const strokeWidth = Math.max(1.2, Math.min(4.5, (edge.amount / 20000) * 3));
                const marker = isCritical ? 'url(#arrow-critical)' : isHigh ? 'url(#arrow-high)' : 'url(#arrow-normal)';
                const isSelected = selectedEdge?.id === edge.id;

                return (
                  <g key={edge.id} className="cursor-pointer group" onClick={() => setSelectedEdge(edge)}>
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                      strokeOpacity={isSelected ? 1.0 : 0.65}
                      markerEnd={marker}
                      className="transition-all duration-150 group-hover:stroke-opacity-100"
                    />
                  </g>
                );
              })}

              {/* Render Nodes */}
              {data?.nodes.map((node) => {
                const pt = nodePositions.get(node.id);
                if (!pt) return null;

                const isSender = node.type === 'sender';
                const isMule = node.is_mule_suspect;
                const isSelected = selectedNode?.id === node.id;
                const radius = isMule ? 16 : isSender ? 12 : 14;

                let fillColor = isSender ? '#C96B35' : '#292520';
                if (isMule) fillColor = '#B84A3B';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pt.x}, ${pt.y})`}
                    onClick={() => {
                      setSelectedNode(node);
                      setSelectedEdge(null);
                    }}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {/* Mule Pulse Ring */}
                    {isMule && (
                      <circle
                        r={radius + 6}
                        fill="none"
                        stroke="#B84A3B"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        className="animate-spin"
                        style={{ animationDuration: '6s' }}
                      />
                    )}

                    {/* Selection Highlight Ring */}
                    {isSelected && (
                      <circle
                        r={radius + 4}
                        fill="none"
                        stroke="#C96B35"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Main Node Body */}
                    <circle
                      r={radius}
                      fill={fillColor}
                      stroke="#FFF9F0"
                      strokeWidth="2"
                      className="shadow-soft"
                    />

                    {/* Icon or Label */}
                    <text
                      y={radius + 12}
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-current font-medium pointer-events-none select-none"
                      fill={isSelected ? '#C96B35' : '#706456'}
                    >
                      {node.label.length > 12 ? node.label.slice(0, 10) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Node / Edge Forensic Inspector Drawer */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="p-5 rounded-2xl bg-surface border border-taupe/25 shadow-soft space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-taupe/15">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl text-white ${selectedNode.is_mule_suspect ? 'bg-alert-red' : 'bg-accent'}`}>
                    {selectedNode.type === 'sender' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-main leading-tight">{selectedNode.label}</h3>
                    <span className="text-[10px] font-mono text-taupe">{selectedNode.id}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    selectedNode.is_mule_suspect
                      ? 'bg-alert-red/20 text-alert-red border border-alert-red/30'
                      : 'bg-accent/20 text-accent border border-accent/30'
                  }`}
                >
                  {selectedNode.is_mule_suspect ? 'Mule Suspect' : selectedNode.type}
                </span>
              </div>

              {/* Node Summary Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-background/60 border border-taupe/20">
                  <span className="text-[10px] text-taupe uppercase block">Total Volume</span>
                  <strong className="font-mono text-sm text-text-main">
                    ₹{selectedNode.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-background/60 border border-taupe/20">
                  <span className="text-[10px] text-taupe uppercase block">Transfers</span>
                  <strong className="font-mono text-sm text-text-main">{selectedNode.transaction_count} txns</strong>
                </div>
              </div>

              {selectedNode.city && (
                <div className="text-xs text-taupe flex items-center justify-between">
                  <span>Location City:</span>
                  <strong className="text-text-main font-mono">{selectedNode.city}</strong>
                </div>
              )}

              {/* Connected Transfers List */}
              <div className="space-y-2 pt-2 border-t border-taupe/15">
                <h4 className="text-xs font-semibold text-charcoal flex items-center justify-between">
                  <span>Connected Transfers ({connectedEdges.length})</span>
                  <span className="text-[10px] text-taupe font-mono">Click to open forensic review</span>
                </h4>

                <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1">
                  {connectedEdges.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => handleOpenTransaction(e.transaction_id)}
                      className="p-2 rounded-xl bg-background/80 hover:bg-surface border border-taupe/20 hover:border-accent text-xs cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono text-[11px] text-accent font-medium group-hover:underline">
                          {e.transaction_id}
                        </div>
                        <div className="text-[10px] text-taupe">
                          {e.source === selectedNode.id ? `To ${e.target}` : `From ${e.source}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-text-main">₹{e.amount.toLocaleString()}</div>
                        <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                          e.risk_level === 'CRITICAL' ? 'bg-alert-red/20 text-alert-red' : 'bg-accent/20 text-accent'
                        }`}>
                          {e.risk_score} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-surface border border-taupe/25 shadow-soft text-center space-y-3">
              <Share2 className="w-8 h-8 text-taupe mx-auto" />
              <h4 className="font-semibold text-sm text-text-main">Select Any Graph Node</h4>
              <p className="text-xs text-taupe leading-relaxed">
                Click a sender, merchant, or suspected mule hub node on the canvas to inspect connected transaction
                edges, forensic risk signals, and relationship clusters.
              </p>
            </div>
          )}

          {/* Edge Detail Preview if selected */}
          {selectedEdge && (
            <div className="p-4 rounded-xl bg-background border border-accent/30 shadow-soft space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-accent font-bold">Selected Edge: {selectedEdge.transaction_id}</span>
                <button onClick={() => handleOpenTransaction(selectedEdge.transaction_id)} className="text-accent hover:underline flex items-center gap-1 text-[11px]">
                  <span>Review Drawer</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-taupe">
                <span>Amount: <strong className="text-text-main font-mono">₹{selectedEdge.amount.toLocaleString()}</strong></span>
                <span>Risk: <strong className="text-alert-red font-mono">{selectedEdge.risk_score}/100 ({selectedEdge.risk_level})</strong></span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedEdge.signals.map((sig, idx) => (
                  <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface border border-taupe/20 text-taupe">
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forensic Transaction Modal */}
      {inspectTxn && (
        <TransactionModal
          transaction={inspectTxn}
          onClose={() => setInspectTxn(null)}
          onUpdate={(updated) => {
            if (inspectTxn) {
              setInspectTxn({ ...inspectTxn, investigation: updated });
            }
          }}
        />
      )}
    </div>
  );
};

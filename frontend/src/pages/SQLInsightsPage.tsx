import React, { useState, useEffect } from 'react';
import {
  Database, Play, CheckCircle2, Clock, Terminal, ChevronRight,
  ExternalLink, Search, Copy, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { SQLQueryItem, SQLQueryResult } from '../types';

export const SQLInsightsPage: React.FC = () => {
  const [queries, setQueries] = useState<SQLQueryItem[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<SQLQueryItem | null>(null);
  const [result, setResult] = useState<SQLQueryResult | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const qList = await api.getSQLQueries();
        setQueries(qList);
        if (qList.length > 0) {
          setSelectedQuery(qList[0]);
        }
      } catch (err: any) {
        setError('Failed to load SQL query catalog');
      }
    };
    fetchQueries();
  }, []);

  const handleExecute = async (queryId: number) => {
    setExecuting(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.executeSQLQuery(queryId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      setExecuting(false);
    }
  };

  const handleCopySQL = () => {
    if (selectedQuery) {
      navigator.clipboard.writeText(selectedQuery.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredQueries = queries.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.business_question.toLowerCase().includes(search.toLowerCase()) ||
      q.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-taupe/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold">
            DATA ENGINEERING & ANALYTICS
          </span>
          <h1 className="text-3xl font-bold font-editorial text-text-main mt-0.5">
            Production SQL Query Studio
          </h1>
          <p className="text-xs text-charcoal/80 mt-1">
            20+ live analytical queries executed directly against the active database schema with latency benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-surface px-3 py-1.5 rounded-lg border border-taupe/20 text-charcoal">
          <Database className="w-4 h-4 text-accent" />
          <span>PostgreSQL ANSI Compliant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Query Catalog List */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-taupe" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter 20+ queries..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-surface-subtle border border-taupe/25 text-charcoal placeholder-taupe/60 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="max-h-[620px] overflow-y-auto space-y-1.5 pr-1">
            {filteredQueries.map((q) => {
              const isSelected = selectedQuery?.id === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQuery(q);
                    setResult(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-accent-dark shadow-soft'
                      : 'bg-surface-subtle/60 border-taupe/15 text-charcoal hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-taupe">Query #{q.id}</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface border border-taupe/20">
                      {q.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold line-clamp-1">{q.title}</h4>
                  <p className="text-[11px] text-taupe line-clamp-2 mt-0.5 leading-snug">
                    {q.business_question}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: SQL Editor & Live Result Viewer */}
        <div className="lg:col-span-8 space-y-6">
          {selectedQuery && (
            <div className="p-6 rounded-2xl bg-surface border border-taupe/20 shadow-soft space-y-5">
              {/* Query Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-taupe/15">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-accent font-bold">
                      Query #{selectedQuery.id}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle border border-taupe/25 text-taupe">
                      {selectedQuery.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-text-main font-editorial">
                    {selectedQuery.title}
                  </h2>
                  <p className="text-xs text-charcoal/80 mt-1">
                    <strong>Business Question:</strong> {selectedQuery.business_question}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopySQL}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-subtle border border-taupe/30 text-xs text-charcoal hover:text-text-main transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5 text-taupe" />}
                    <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                  </button>

                  <button
                    onClick={() => handleExecute(selectedQuery.id)}
                    disabled={executing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-dark text-white font-semibold text-xs transition-all shadow-soft disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{executing ? 'Executing...' : 'Run Query Live'}</span>
                  </button>
                </div>
              </div>

              {/* SQL Code Block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-taupe">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5" /> Executable SQL
                  </span>
                  <span>Dialect: PostgreSQL / SQLite3</span>
                </div>
                <div className="p-4 rounded-xl bg-charcoal text-surface font-mono text-xs overflow-x-auto border border-charcoal leading-relaxed shadow-soft">
                  <pre>{selectedQuery.sql}</pre>
                </div>
              </div>

              {/* Analytical Explanation & Interpretation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-taupe/15 space-y-1">
                  <span className="font-semibold text-text-main block">Technical Explanation:</span>
                  <p className="text-taupe leading-relaxed">{selectedQuery.explanation}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-taupe/15 space-y-1">
                  <span className="font-semibold text-text-main block">Expected Interpretation:</span>
                  <p className="text-taupe leading-relaxed">{selectedQuery.expected_interpretation}</p>
                </div>
              </div>

              {/* Execution Results Data Grid */}
              {result && (
                <div className="pt-4 border-t border-taupe/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sage" />
                      <h4 className="text-xs font-mono font-bold uppercase text-text-main">
                        Live Query Output ({result.row_count} rows returned)
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                      Latency: {result.execution_time_ms} ms
                    </span>
                  </div>

                  <div className="rounded-xl border border-taupe/20 overflow-hidden shadow-soft">
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-subtle sticky top-0 border-b border-taupe/20 font-mono text-[11px] text-taupe uppercase">
                          <tr>
                            {result.columns.map((col) => (
                              <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-taupe/15 text-charcoal font-tabular">
                          {result.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-surface-subtle/50">
                              {result.columns.map((col) => (
                                <td key={col} className="py-2.5 px-3 whitespace-nowrap">
                                  {row[col] !== null ? String(row[col]) : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

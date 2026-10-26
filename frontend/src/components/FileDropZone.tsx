import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Download, Database, Sparkles, X } from 'lucide-react';
import { api } from '../services/api';
import type { EvaluateSheetResponse } from '../types';

interface FileDropZoneProps {
  onEvaluated: (result: EvaluateSheetResponse) => void;
  onReset: () => void;
  activeSheetName: string | null;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onEvaluated,
  onReset,
  activeSheetName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persistToDb, setPersistToDb] = useState(false);
  const [lastEvaluated, setLastEvaluated] = useState<EvaluateSheetResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setLoading(true);

    try {
      const fileName = file.name;
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Content = reader.result as string;
          const result = await api.evaluateSheet({
            filename: fileName,
            file_base64: base64Content,
            persist_to_db: persistToDb,
          });

          setLastEvaluated(result);
          onEvaluated(result);
        } catch (err: any) {
          setError(err.message || 'Failed to evaluate spreadsheet.');
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error reading local file.');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Unexpected error processing file.');
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDemoEvaluate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sample high-risk + normal batch for testing
      const demoCsv = `Transaction ID,Timestamp,Sender ID,Sender Name,Receiver ID,Receiver Name,Merchant Category,Amount (INR),City,Device,Status,Simulated Fraud
TXN_DEMO_01,2026-10-26 01:15:00,SENDER_901,Rohit Verma,MERCH_801,Apex Bullion Pvt Ltd,jewelry_luxury,89500.00,Mumbai,Web,SUCCESS,TRUE
TXN_DEMO_02,2026-10-26 01:18:20,SENDER_901,Rohit Verma,MERCH_802,Crypto OTC Node,crypto_p2p_simulation,94000.00,Bengaluru,Android,SUCCESS,TRUE
TXN_DEMO_03,2026-10-26 08:30:00,SENDER_902,Priya Sharma,MERCH_803,Nature Basket Groceries,grocery,1450.00,Delhi,Android,SUCCESS,FALSE
TXN_DEMO_04,2026-10-26 09:12:00,SENDER_903,Amitabh Sen,MERCH_804,Starbucks Coffee,food_dining,420.00,Mumbai,iOS,SUCCESS,FALSE
TXN_DEMO_05,2026-10-26 10:05:00,SENDER_904,Kavita Rao,MERCH_805,Croma Electronics,electronics,64999.00,Pune,Android,SUCCESS,FALSE
TXN_DEMO_06,2026-10-26 02:45:00,SENDER_905,Unknown Payer,MERCH_806,Mule Account A,peer_transfer,75000.00,Delhi,Android,SUCCESS,TRUE
TXN_DEMO_07,2026-10-26 12:15:00,SENDER_906,Vikram Singh,MERCH_807,MakeMyTrip Flight,travel_booking,18500.00,Bengaluru,iOS,SUCCESS,FALSE
TXN_DEMO_08,2026-10-26 13:40:00,SENDER_907,Ananya Iyer,MERCH_808,BESCOM Electricity,utilities_bills,2350.00,Bengaluru,Web,SUCCESS,FALSE
TXN_DEMO_09,2026-10-26 03:22:00,SENDER_908,Night Burst User,MERCH_809,Fast Cash Gateway,crypto_p2p_simulation,85000.00,Mumbai,Web,SUCCESS,TRUE
TXN_DEMO_10,2026-10-26 15:10:00,SENDER_909,Devendra Patel,MERCH_810,Apollo Pharmacy,grocery,890.00,Ahmedabad,Android,SUCCESS,FALSE
`;
      const result = await api.evaluateSheet({
        filename: 'demo_upi_transactions.xlsx',
        csv_text: demoCsv,
        persist_to_db: persistToDb,
      });
      setLastEvaluated(result);
      onEvaluated(result);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate demo sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    window.open(api.getSampleSheetUrl(), '_blank');
  };

  return (
    <div className="space-y-3">
      {/* Active Evaluation Banner */}
      {activeSheetName && (
        <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-text-main">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span>
              <strong>Evaluating Sheet:</strong> <code className="text-accent font-mono">{activeSheetName}</code>
              {lastEvaluated && (
                <span className="text-taupe ml-2">
                  ({lastEvaluated.total_records.toLocaleString()} rows | Anomaly Rate:{' '}
                  <strong className="text-alert-red font-mono">{lastEvaluated.dashboard_data.kpis.simulated_fraud_rate_pct}%</strong> | {lastEvaluated.execution_time_ms}ms)
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setLastEvaluated(null);
              onReset();
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline bg-surface px-2 py-1 rounded-lg border border-taupe/20"
          >
            <RefreshCw className="w-3 h-3" />
            Revert to Default Dataset
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all duration-200 text-center ${
          isDragging
            ? 'border-accent bg-accent/10 shadow-lg scale-[1.01]'
            : 'border-taupe/30 bg-surface hover:border-accent/60 hover:bg-surface/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            className={`p-3 rounded-2xl transition-colors ${
              isDragging ? 'bg-accent text-white' : 'bg-background border border-taupe/20 text-accent'
            }`}
          >
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-main flex items-center justify-center gap-1.5">
              <span>Drop Excel Spreadsheet or CSV Here</span>
              <span className="text-[10px] font-mono uppercase bg-accent/15 text-accent px-1.5 py-0.5 rounded font-bold">
                AUTO-EVALUATE
              </span>
            </h4>
            <p className="text-xs text-taupe mt-0.5">
              Drag & drop <strong className="text-charcoal font-mono">.xlsx</strong>,{' '}
              <strong className="text-charcoal font-mono">.xls</strong>, or{' '}
              <strong className="text-charcoal font-mono">.csv</strong> to compute full risk metrics, anomaly detection, and charts.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 pt-2 text-xs font-mono text-accent">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Parsing sheet & executing 3-tier anomaly detection models...</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-[11px] text-taupe bg-background px-2.5 py-1 rounded-lg border border-taupe/20">
                Supports standard headers: Amount, Timestamp, Sender, Receiver, Category
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Helper Bar & Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-background/60 p-3 rounded-xl border border-taupe/20">
        <label className="flex items-center gap-2 text-charcoal cursor-pointer select-none">
          <input
            type="checkbox"
            checked={persistToDb}
            onChange={(e) => setPersistToDb(e.target.checked)}
            className="rounded border-taupe/30 text-accent focus:ring-accent"
          />
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span>Persist and import sheet into database (updates all pages)</span>
          </span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDemoEvaluate}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/15 text-accent hover:bg-accent hover:text-white font-medium text-[11px] transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>Evaluate Demo Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSample}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-taupe/25 text-charcoal hover:border-accent hover:text-accent font-medium text-[11px] transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Download Sample CSV</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-alert-red/10 border border-alert-red/30 flex items-center gap-2 text-alert-red text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
